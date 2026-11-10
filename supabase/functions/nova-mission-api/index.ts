import { withSupabase } from "@supabase/server";
import { RequestInputError, parseJsonObject } from "../nova-bi-api/request-input.ts";
import { configuredSiteOrigin, withSiteOrigin } from "../nova-bi-api/cors.ts";
import { validateMissionInput } from "./mission-input.ts";
import { buildStarterPlan, type MissionWorkspace } from "./mission-planner.ts";
import { validateApprovalDecision, validateApprovalRequest } from "./mission-approval.ts";

const siteOrigin = configuredSiteOrigin(
  Deno.env.get("NOVA_MISSION_SITE_URL") || Deno.env.get("NOVA_BI_SITE_URL"),
);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fail = (message: string, status = 400) => json({ error: message }, status);
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function readBoundedBody(request: Request, maxBytes = 120000): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestInputError("Request body is too large", 413);
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try { await reader.cancel(); } catch { /* preserve the size-limit error */ }
        throw new RequestInputError("Request body is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(merged);
  } catch {
    throw new RequestInputError("Request body must be valid UTF-8", 400);
  }
}

const authenticatedHandler = withSupabase(
  { auth: "user", cors: "disabled" },
  async (req, ctx) => {
    const userId = String(ctx.jwtClaims?.sub || ctx.userClaims?.id || "");
    if (!uuid(userId)) return fail("Authenticated user context is missing", 401);

    const url = new URL(req.url);
    const path = url.pathname
      .replace(/^\/+|\/+$/g, "")
      .replace(/^functions\/v1\/nova-mission-api\/?/i, "")
      .replace(/^nova-mission-api\/?/i, "");
    const db = ctx.supabase;

    // Reuse the server-enforced per-user database limiter; no client-side trust.
    const limit = await ctx.supabaseAdmin.rpc("nova_bi_consume_rate_limit", {
      p_user_id: userId,
      p_bucket: "mission-api",
      p_limit: 60,
      p_window_seconds: 60,
    });
    if (limit.error) {
      console.error("NOVA Mission API rate-limit check unavailable");
      return fail("NOVA Missions are temporarily unavailable. Please retry shortly.", 503);
    }
    if (limit.data !== true) {
      return new Response(JSON.stringify({ error: "Too many mission requests. Retry shortly." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    try {
      if (req.method === "GET" && path === "missions") {
        const { data, error } = await db.from("nova_missions")
          .select("id,title,workspace,state,version,attempts,created_at,updated_at")
          .eq("owner_id", userId)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return json({ missions: data || [] });
      }

      if (req.method === "POST" && path === "missions") {
        const input = parseJsonObject(await readBoundedBody(req));
        const headerKey = req.headers.get("Idempotency-Key");
        if (headerKey && input.idempotency_key && headerKey !== input.idempotency_key) {
          return fail("Body and header idempotency keys must match");
        }
        const mission = validateMissionInput({
          ...input,
          idempotency_key: input.idempotency_key ?? headerKey ?? undefined,
        });
        const { data: missionId, error } = await ctx.supabaseAdmin.rpc("nova_create_mission", {
          p_owner_id: userId,
          p_title: mission.title,
          p_description: mission.description,
          p_workspace: mission.workspace,
          p_idempotency_key: mission.idempotencyKey,
          p_plan_json: mission.plan,
        });
        if (error?.code === "23505") return fail("This mission idempotency key is already used for different mission details", 409);
        if (error) throw error;
        if (!uuid(missionId)) throw new Error("Mission creation returned an invalid identifier");

        const { data, error: readError } = await db.from("nova_missions")
          .select("id,title,description,workspace,state,version,attempts,plan_json,created_at,updated_at")
          .eq("id", missionId)
          .eq("owner_id", userId)
          .maybeSingle();
        if (readError) throw readError;
        if (!data) return fail("Created mission could not be loaded", 500);
        return json({ mission: data }, 201);
      }

      const planMatch = path.match(/^missions\/([0-9a-f-]{36})\/plan$/i);
      if (req.method === "POST" && planMatch && uuid(planMatch[1])) {
        parseJsonObject(await readBoundedBody(req));
        const missionId = planMatch[1];
        const { data: currentMission, error: readError } = await db.from("nova_missions")
          .select("id,title,description,workspace,state")
          .eq("id", missionId).eq("owner_id", userId).maybeSingle();
        if (readError) throw readError;
        if (!currentMission) return fail("Mission not found", 404);
        if (currentMission.state !== "draft") return fail("Only draft missions can receive a starter plan", 409);

        const starter = buildStarterPlan({
          title: currentMission.title,
          description: currentMission.description,
          workspace: currentMission.workspace as MissionWorkspace,
        });
        const { data: plannedId, error: planError } = await ctx.supabaseAdmin.rpc("nova_save_mission_plan", {
          p_owner_id: userId,
          p_mission_id: missionId,
          p_plan_json: starter.plan,
          p_tasks: starter.tasks,
        });
        if (planError) {
          if (planError.code === "55000") return fail("Only draft missions can receive a starter plan", 409);
          if (planError.code === "23514") return fail("The starter plan did not pass database validation", 400);
          throw planError;
        }
        if (plannedId !== missionId) throw new Error("Mission planning returned an unexpected identifier");

        const [updated, tasks, events, proofs] = await Promise.all([
          db.from("nova_missions")
            .select("id,title,description,workspace,state,version,attempts,plan_json,created_at,updated_at")
            .eq("id", missionId).eq("owner_id", userId).maybeSingle(),
          db.from("nova_mission_tasks")
            .select("id,sequence,title,status,attempts,created_at,updated_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("sequence", { ascending: true }).limit(100),
          db.from("nova_mission_events")
            .select("id,sequence,event_type,from_state,to_state,actor_id,payload_json,created_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("sequence", { ascending: true }).limit(200),
          db.from("nova_mission_proofs")
            .select("id,task_id,proof_type,summary,verification_status,evidence_json,verified_at,created_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("created_at", { ascending: false }).limit(100),
        ]);
        if (updated.error) throw updated.error;
        if (tasks.error) throw tasks.error;
        if (events.error) throw events.error;
        if (proofs.error) throw proofs.error;
        return json({ mission: updated.data, tasks: tasks.data || [], events: events.data || [], proofs: proofs.data || [], plan_type: "starter_template" });
      }

      const cancelMatch = path.match(/^missions\/([0-9a-f-]{36})\/cancel$/i);
      if (req.method === "POST" && cancelMatch && uuid(cancelMatch[1])) {
        const input = parseJsonObject(await readBoundedBody(req));
        const reason = input.reason === undefined ? "" :
          typeof input.reason === "string" ? input.reason : null;
        if (reason === null || reason.length > 1000) return fail("Cancellation reason must be a string up to 1000 characters");
        const missionId = cancelMatch[1];
        const { data: cancelledId, error } = await ctx.supabaseAdmin.rpc("nova_cancel_mission", {
          p_owner_id: userId, p_mission_id: missionId, p_reason: reason,
        });
        if (error) {
          if (error.code === "P0002") return fail("Mission not found", 404);
          if (error.code === "55000") return fail("Mission is already in a terminal state", 409);
          if (error.code === "23514") return fail("Cancellation reason did not pass validation", 400);
          throw error;
        }
        if (cancelledId !== missionId) throw new Error("Mission cancellation returned an unexpected identifier");
        const { data: mission, error: readError } = await db.from("nova_missions")
          .select("id,title,description,workspace,state,version,attempts,plan_json,created_at,updated_at")
          .eq("id", missionId).eq("owner_id", userId).maybeSingle();
        if (readError) throw readError;
        if (!mission) return fail("Cancelled mission could not be loaded", 500);
        return json({ mission });
      }

      const approvalRequestMatch = path.match(/^missions\/([0-9a-f-]{36})\/tasks\/([0-9a-f-]{36})\/approval$/i);
      if (req.method === "POST" && approvalRequestMatch &&
          uuid(approvalRequestMatch[1]) && uuid(approvalRequestMatch[2])) {
        const input = validateApprovalRequest(parseJsonObject(await readBoundedBody(req)));
        const missionId = approvalRequestMatch[1];
        const taskId = approvalRequestMatch[2];
        const { data: approvalId, error } = await ctx.supabaseAdmin.rpc("nova_request_task_approval", {
          p_owner_id: userId, p_mission_id: missionId, p_task_id: taskId,
          p_request_key: input.requestKey, p_action_summary: input.actionSummary,
        });
        if (error) {
          if (error.code === "P0002") return fail("Mission or task not found", 404);
          if (error.code === "55000") return fail("Mission or task is not ready for an approval request", 409);
          if (error.code === "23514") return fail("Approval request did not pass validation", 400);
          if (error.code === "23505") return fail("This approval idempotency key is already assigned to another task", 409);
          throw error;
        }
        if (!uuid(approvalId)) throw new Error("Approval request returned an invalid identifier");
        const [approval, run] = await Promise.all([
          db.from("nova_mission_approvals").select("id,mission_id,task_id,action_summary,status,requested_at,decided_at")
            .eq("id", approvalId).eq("owner_id", userId).maybeSingle(),
          db.from("nova_mission_execution_runs").select("id,approval_id,status,attempt,created_at,updated_at")
            .eq("approval_id", approvalId).eq("owner_id", userId).maybeSingle(),
        ]);
        if (approval.error) throw approval.error;
        if (run.error) throw run.error;
        if (!approval.data || !run.data) return fail("Approval request could not be loaded", 500);
        return json({ approval: approval.data, execution_run: run.data }, 202);
      }

      const approvalDecisionMatch = path.match(/^approvals\/([0-9a-f-]{36})\/decision$/i);
      if (req.method === "POST" && approvalDecisionMatch && uuid(approvalDecisionMatch[1])) {
        const input = validateApprovalDecision(parseJsonObject(await readBoundedBody(req)));
        const approvalId = approvalDecisionMatch[1];
        const { data: decidedId, error } = await ctx.supabaseAdmin.rpc("nova_decide_task_approval", {
          p_owner_id: userId, p_approval_id: approvalId, p_decision: input.decision,
          p_actor_id: userId, p_decision_note: input.decisionNote,
        });
        if (error) {
          if (error.code === "P0002") return fail("Approval not found", 404);
          if (error.code === "55000") return fail("This approval has already been decided", 409);
          if (error.code === "42501") return fail("Only the mission owner may decide this approval", 403);
          if (error.code === "23514") return fail("Approval decision did not pass validation", 400);
          throw error;
        }
        if (decidedId !== approvalId) throw new Error("Approval decision returned an unexpected identifier");
        const [approval, run] = await Promise.all([
          db.from("nova_mission_approvals").select("id,mission_id,task_id,action_summary,status,requested_at,decided_at,decided_by,decision_note")
            .eq("id", approvalId).eq("owner_id", userId).maybeSingle(),
          db.from("nova_mission_execution_runs").select("id,approval_id,status,attempt,created_at,updated_at")
            .eq("approval_id", approvalId).eq("owner_id", userId).maybeSingle(),
        ]);
        if (approval.error) throw approval.error;
        if (run.error) throw run.error;
        if (!approval.data || !run.data) return fail("Approval decision could not be loaded", 500);
        return json({ approval: approval.data, execution_run: run.data });
      }

      const detailMatch = path.match(/^missions\/([0-9a-f-]{36})$/i);
      if (req.method === "GET" && detailMatch && uuid(detailMatch[1])) {
        const missionId = detailMatch[1];
        const { data: mission, error } = await db.from("nova_missions")
          .select("id,title,description,workspace,state,version,attempts,plan_json,created_at,updated_at")
          .eq("id", missionId)
          .eq("owner_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (!mission) return fail("Mission not found", 404);

        const [tasks, events, proofs, approvals, executionRuns] = await Promise.all([
          db.from("nova_mission_tasks")
            .select("id,sequence,title,status,attempts,created_at,updated_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("sequence", { ascending: true }).limit(100),
          db.from("nova_mission_events")
            .select("id,sequence,event_type,from_state,to_state,actor_id,payload_json,created_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("sequence", { ascending: true }).limit(200),
          db.from("nova_mission_proofs")
            .select("id,task_id,proof_type,summary,verification_status,evidence_json,verified_at,created_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("created_at", { ascending: false }).limit(100),
          db.from("nova_mission_approvals")
            .select("id,task_id,action_summary,status,requested_at,decided_at,decided_by,decision_note")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("requested_at", { ascending: false }).limit(100),
          db.from("nova_mission_execution_runs")
            .select("id,approval_id,task_id,status,attempt,created_at,updated_at")
            .eq("mission_id", missionId).eq("owner_id", userId)
            .order("created_at", { ascending: false }).limit(100),
        ]);
        if (tasks.error) throw tasks.error;
        if (events.error) throw events.error;
        if (proofs.error) throw proofs.error;
        if (approvals.error) throw approvals.error;
        if (executionRuns.error) throw executionRuns.error;
        return json({
          mission, tasks: tasks.data || [], events: events.data || [], proofs: proofs.data || [],
          approvals: approvals.data || [], execution_runs: executionRuns.data || [],
        });
      }

      return fail("Route not found", 404);
    } catch (error) {
      const message = String((error as Error)?.message || "");
      if (error instanceof RequestInputError) return fail(message, error.status);
      if (error instanceof TypeError) return fail(message, 400);
      if (message.includes("Authentication required")) return fail("Authentication required", 401);
      console.error("NOVA Mission API request failed", String((error as { code?: string })?.code || "unknown"));
      return fail("NOVA Mission API request failed", 500);
    }
  },
);

Deno.serve(withSiteOrigin(authenticatedHandler, siteOrigin));
