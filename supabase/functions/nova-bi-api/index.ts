import { withSupabase } from "@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, idempotency-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const uuid = (value: unknown) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const plainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const safeJson = (value: unknown, maxBytes = 50000) => {
  if (!plainObject(value)) return false;
  try { return new TextEncoder().encode(JSON.stringify(value)).length <= maxBytes; }
  catch { return false; }
};

const fail = (message: string, status = 400) => json({ error: message }, status);

Deno.serve(withSupabase({ auth: "user" }, async (req, ctx) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const userId = String(ctx.jwtClaims?.sub || ctx.userClaims?.id || "");
  if (!uuid(userId)) return fail("Authenticated user context is missing", 401);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "").replace(/^functions\/v1\/nova-bi-api\/?/i, "").replace(/^nova-bi-api\/?/i, "");
  const db = ctx.supabase;

  async function body() {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 70000) throw new Error("Request body is too large");
    try { return JSON.parse(raw || "{}"); }
    catch { throw new Error("Request body must be valid JSON"); }
  }

  try {
    if (req.method === "GET" && path === "me") {
      const { data, error } = await db.from("nova_bi_memberships")
        .select("organization_id,role,status,organization:nova_bi_organizations(id,name,created_at)")
        .eq("user_id", userId).eq("status", "active");
      if (error) throw error;
      return json({ user: { id: userId, email: ctx.userClaims?.email || null }, organizations: data || [] });
    }

    if (req.method === "POST" && path === "organizations") {
      const input = await body();
      const name = typeof input.name === "string" ? input.name.trim() : "";
      if (name.length < 2 || name.length > 160) return fail("Organization name must be 2 to 160 characters");
      const { data, error } = await db.from("nova_bi_organizations")
        .insert({ name, created_by: userId })
        .select("id,name,created_at").single();
      if (error) throw error;
      return json({ organization_id: data.id, organization: data }, 201);
    }

    if (req.method === "GET" && path === "invitations") {
      const { data, error } = await db.from("nova_bi_memberships")
        .select("id,organization_id,role,status,created_at,organization:nova_bi_organizations(id,name)")
        .eq("user_id", userId).eq("status", "invited").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ invitations: data || [] });
    }

    if (req.method === "POST" && path === "members/invite") {
      const input = await body();
      const orgId = input.organization_id || "";
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const role = String(input.role || "viewer");
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) return fail("Enter a valid email address");
      if (!["admin", "analyst", "viewer"].includes(role)) return fail("Unsupported invitation role");
      const { data: actor, error: actorError } = await db.from("nova_bi_memberships")
        .select("role").eq("organization_id", orgId).eq("user_id", userId).eq("status", "active").maybeSingle();
      if (actorError) throw actorError;
      if (!actor || !["owner", "admin"].includes(actor.role)) return fail("Owner or admin role required", 403);
      if (role === "admin" && actor.role !== "owner") return fail("Only the organization owner can invite another admin", 403);

      const { data: invitation, error: inviteError } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email);
      if (inviteError || !invitation?.user?.id) {
        console.error("NOVA BI invitation email could not be issued", inviteError);
        return fail("Invitation could not be sent. The address may already have an account or email delivery may not be configured.", 409);
      }
      const invitedUserId = invitation.user.id;
      const { data: member, error: memberError } = await ctx.supabaseAdmin.from("nova_bi_memberships")
        .insert({ organization_id: orgId, user_id: invitedUserId, role, status: "invited" })
        .select("id,organization_id,user_id,role,status,created_at").single();
      if (memberError) {
        console.error("NOVA BI invitation membership could not be saved", memberError);
        return fail("The invitation email was issued but membership setup failed. Contact the workspace owner before retrying.", 500);
      }
      await ctx.supabaseAdmin.from("nova_bi_audit_events").insert({
        organization_id: orgId, actor_id: userId, event_type: "membership.invitation.sent",
        resource_type: "membership", resource_id: member.id, metadata_json: { role, invited_email: email },
      });
      return json({ invitation: member }, 201);
    }

    const acceptParts = path.split("/");
    if (req.method === "POST" && acceptParts.length === 3 && acceptParts[0] === "invitations" && acceptParts[2] === "accept" && uuid(acceptParts[1])) {
      const { data, error } = await db.from("nova_bi_memberships")
        .update({ status: "active" })
        .eq("id", acceptMatch[1]).eq("user_id", userId).eq("status", "invited")
        .select("id,organization_id,role,status").single();
      if (error) throw error;
      return json({ accepted: data.status === "active", membership: data });
    }

    if (req.method === "GET" && path === "members") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data: ownMembership, error: membershipError } = await db.from("nova_bi_memberships")
        .select("id,user_id,role,status,created_at")
        .eq("organization_id", orgId).eq("user_id", userId).eq("status", "active").maybeSingle();
      if (membershipError) throw membershipError;
      if (!ownMembership) return fail("Active organization membership required", 403);
      if (ownMembership.role === "owner" || ownMembership.role === "admin") {
        const { data, error } = await ctx.supabaseAdmin.from("nova_bi_memberships")
          .select("id,user_id,role,status,created_at")
          .eq("organization_id", orgId).order("created_at", { ascending: true });
        if (error) throw error;
        return json({ members: data || [] });
      }
      return json({ members: [ownMembership] });
    }

    if (req.method === "GET" && path === "datasets") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data, error } = await db.from("nova_bi_datasets")
        .select("id,organization_id,name,source_type,schema_version,fingerprint,row_count,column_names,created_at")
        .eq("organization_id", orgId).is("deleted_at", null).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ datasets: data || [] });
    }

    if (req.method === "POST" && path === "datasets") {
      const input = await body();
      if (!uuid(input.organization_id)) return fail("A valid organization_id is required");
      if (typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 160) return fail("Dataset name must be 1 to 160 characters");
      if (!["csv", "xlsx", "manual", "integration"].includes(String(input.source_type))) return fail("Unsupported source_type");
      if (typeof input.fingerprint !== "string" || input.fingerprint.length < 8 || input.fingerprint.length > 160) return fail("Invalid dataset fingerprint");
      if (!Number.isInteger(input.row_count) || input.row_count < 0 || input.row_count > 20000) return fail("row_count must be between 0 and 20000");
      if (!Array.isArray(input.column_names) || input.column_names.length > 100 || input.column_names.some((x: unknown) => typeof x !== "string" || x.length > 100)) return fail("column_names must contain at most 100 short strings");
      const { data, error } = await db.from("nova_bi_datasets").insert({
        organization_id: input.organization_id, created_by: userId, name: input.name.trim(),
        source_type: input.source_type, schema_version: "1", fingerprint: input.fingerprint,
        row_count: input.row_count, column_names: input.column_names,
      }).select("id,organization_id,name,source_type,fingerprint,row_count,column_names,created_at").single();
      if (error) throw error;
      return json({ dataset: data }, 201);
    }

    if (req.method === "GET" && path === "analyses") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data, error } = await db.from("nova_bi_analyses")
        .select("id,organization_id,dataset_id,analysis_type,calculation_version,result_json,evidence_json,assumptions_json,created_at")
        .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ analyses: data || [] });
    }

    if (req.method === "POST" && path === "analyses") {
      const input = await body();
      if (!uuid(input.organization_id) || !uuid(input.dataset_id)) return fail("Valid organization_id and dataset_id are required");
      if (!["cost_leaks", "client_profitability", "team_productivity", "project_risk", "scenario"].includes(String(input.analysis_type))) return fail("Unsupported analysis_type");
      if (typeof input.calculation_version !== "string" || input.calculation_version.length < 1 || input.calculation_version.length > 80) return fail("Invalid calculation_version");
      if (!safeJson(input.result_json) || !safeJson(input.evidence_json || {}) || !safeJson(input.assumptions_json || {})) return fail("Analysis payloads must be JSON objects under 50 KB each");
      const { data, error } = await db.from("nova_bi_analyses").insert({
        organization_id: input.organization_id, dataset_id: input.dataset_id, created_by: userId,
        analysis_type: input.analysis_type, calculation_version: input.calculation_version,
        result_json: input.result_json, evidence_json: input.evidence_json || {},
        assumptions_json: input.assumptions_json || {},
      }).select("id,organization_id,dataset_id,analysis_type,calculation_version,created_at").single();
      if (error) throw error;
      return json({ analysis: data }, 201);
    }

    if (req.method === "GET" && path === "workflows") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data, error } = await db.from("nova_bi_workflow_proposals")
        .select("id,organization_id,created_by,title,status,proposal_json,idempotency_key,created_at,updated_at")
        .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ workflows: data || [] });
    }

    if (req.method === "POST" && path === "workflows") {
      const input = await body();
      if (!uuid(input.organization_id)) return fail("A valid organization_id is required");
      if (typeof input.title !== "string" || input.title.trim().length < 1 || input.title.trim().length > 180) return fail("Workflow title must be 1 to 180 characters");
      if (!safeJson(input.proposal_json)) return fail("proposal_json must be an object under 50 KB");
      const idempotencyKey = req.headers.get("idempotency-key") || input.idempotency_key;
      if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 160) return fail("A valid Idempotency-Key is required");
      const { data, error } = await db.from("nova_bi_workflow_proposals").insert({
        organization_id: input.organization_id, created_by: userId, title: input.title.trim(),
        status: "proposed", proposal_json: input.proposal_json, idempotency_key: idempotencyKey,
      }).select("id,organization_id,title,status,created_at").single();
      if (error) {
        if (error.code === "23505") return fail("This workflow request was already submitted", 409);
        throw error;
      }
      return json({ workflow: data }, 201);
    }

    const decisionMatch = path.match(/^workflows\/([0-9a-f-]{36})\/decision$/i);
    if (req.method === "POST" && decisionMatch) {
      const input = await body();
      if (!["approved", "rejected"].includes(String(input.decision))) return fail("Decision must be approved or rejected");
      const { data, error } = await db.from("nova_bi_workflow_proposals")
        .update({ status: input.decision })
        .eq("id", decisionMatch[1]).eq("status", "proposed")
        .select("id,status").single();
      if (error) throw error;
      return json({ decided: data.status === input.decision, workflow: data });
    }

    if (req.method === "GET" && path === "branding") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data, error } = await db.from("nova_bi_branding")
        .select("organization_id,brand_name,tagline,logo_url,primary_color,accent_color,updated_at")
        .eq("organization_id", orgId).single();
      if (error) throw error;
      return json({ branding: data });
    }

    if (req.method === "POST" && path === "branding") {
      const input = await body();
      if (!uuid(input.organization_id)) return fail("A valid organization_id is required");
      const brandName = typeof input.brand_name === "string" ? input.brand_name.trim() : "";
      const tagline = typeof input.tagline === "string" ? input.tagline.trim() : "";
      const logoUrl = typeof input.logo_url === "string" ? input.logo_url.trim() : "";
      const primary = String(input.primary_color || "");
      const accent = String(input.accent_color || "");
      if (brandName.length < 2 || brandName.length > 160) return fail("Brand name must be 2 to 160 characters");
      if (tagline.length > 160) return fail("Tagline must be 160 characters or fewer");
      if (logoUrl && (!logoUrl.startsWith("https://") || logoUrl.length > 500 || /\\s/.test(logoUrl))) return fail("Logo URL must be a valid HTTPS URL under 500 characters");
      if (!/^#[0-9a-f]{6}$/i.test(primary) || !/^#[0-9a-f]{6}$/i.test(accent)) return fail("Brand colors must be six-digit hex colors");
      const { data, error } = await db.from("nova_bi_branding")
        .update({ brand_name: brandName, tagline, logo_url: logoUrl, primary_color: primary, accent_color: accent })
        .eq("organization_id", input.organization_id)
        .select("organization_id,brand_name,tagline,logo_url,primary_color,accent_color,updated_at").single();
      if (error) throw error;
      return json({ branding: data });
    }

    if (req.method === "GET" && path === "audit") {
      const orgId = url.searchParams.get("organization_id") || "";
      if (!uuid(orgId)) return fail("A valid organization_id is required");
      const { data, error } = await db.from("nova_bi_audit_events")
        .select("id,actor_id,event_type,resource_type,resource_id,metadata_json,created_at")
        .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return json({ events: data || [] });
    }

    return fail("Route not found", 404);
  } catch (error) {
    console.error("nova-bi-api error", error);
    const message = String((error as Error)?.message || "");
    if (message.includes("Authentication required")) return fail("Authentication required", 401);
    if (message.includes("Active organization owner or admin")) return fail("Owner or admin role required", 403);
    if (message.includes("Proposal creator cannot approve")) return fail("A proposal creator cannot approve their own proposal", 403);
    if (message.includes("Only proposed workflows")) return fail("This workflow already has a decision", 409);
    return fail("NOVA Business Intelligence request failed", 400);
  }
}));
