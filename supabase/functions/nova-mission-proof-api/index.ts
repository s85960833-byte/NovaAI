import { withSupabase } from "@supabase/server";
import { verifyMissionProofEnvelope } from "../nova-mission-api/mission-proof.ts";
import { hasExactTrustedMissionProofRequestShape } from "./mission-proof-request.ts";
import { resolveMissionVerifierConfig, verifyMissionVerifierSignature } from "../nova-mission-api/mission-proof-auth.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RequestInputError extends Error {
  constructor(message: string, readonly status: 400 | 413) {
    super(message);
    this.name = "RequestInputError";
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > 70000) throw new RequestInputError("Request body is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError("Request body is required", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 70000) {
        await reader.cancel();
        throw new Error("Request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new RequestInputError("Request body must be valid UTF-8 JSON", 400); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new RequestInputError("Request body must be a JSON object", 400);
  return parsed as Record<string, unknown>;
}

const handler = withSupabase(
  { auth: "secret", cors: "disabled" },
  async (request, ctx) => {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const input = await readBody(request);
      if (!hasExactTrustedMissionProofRequestShape(input)) {
        return json({ error: "Request contains unsupported fields" }, 400);
      }
      const envelope = input.envelope;
      if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
        return json({ error: "Proof envelope is required" }, 400);
      }
      const proof = envelope as Record<string, unknown>;
      const workerId = input.worker_id;
      const leaseToken = input.lease_token;
      if (typeof workerId !== "string" || !/^[A-Za-z0-9._:-]{1,120}$/.test(workerId) ||
          typeof leaseToken !== "string" || !UUID.test(leaseToken)) {
        return json({ error: "Worker and lease identifiers are invalid" }, 400);
      }
      const verifierId = proof.verifier_id;
      const verifierVersion = proof.verifier_version;
      if (typeof verifierId !== "string" || typeof verifierVersion !== "string") {
        return json({ error: "Trusted verifier identity is required" }, 400);
      }

      const rawVerifierConfig = Deno.env.get("NOVA_MISSION_VERIFIER_KEYS");
      if (!rawVerifierConfig) {
        return json({ error: "Trusted verifier is not configured" }, 503);
      }
      const trusted = resolveMissionVerifierConfig(rawVerifierConfig, verifierId, verifierVersion);
      if (!trusted) {
        return json({ error: "Verifier identity or version is not trusted" }, 403);
      }

      const timestamp = request.headers.get("x-nova-verifier-timestamp") || "";
      const nonce = request.headers.get("x-nova-verifier-nonce") || "";
      const signature = request.headers.get("x-nova-verifier-signature") || "";
      const authenticated = await verifyMissionVerifierSignature({
        secret: trusted.secret, timestamp, nonce, workerId, leaseToken, envelope, signature,
      });
      if (!authenticated) return json({ error: "Verifier authentication failed" }, 401);

      const binding = {
        missionId: String(proof.mission_id || ""),
        taskId: String(proof.task_id || ""),
        runId: String(proof.run_id || ""),
        verifierId,
        verifierVersion,
      };
      const checked = await verifyMissionProofEnvelope(envelope, binding);
      if (!checked.valid || !checked.digest) {
        return json({ error: checked.reason || "Proof envelope is invalid" }, 422);
      }
      if (proof.outcome !== "passed") {
        return json({ error: "Only independently passing proof can complete a task" }, 422);
      }

      const summary = `Verified by ${verifierId} v${verifierVersion} (${(proof.checks as unknown[]).length} checks)`;
      const { data, error } = await ctx.supabaseAdmin.rpc("nova_persist_mission_proof_and_complete_with_nonce", {
        p_run_id: binding.runId,
        p_worker_id: workerId,
        p_lease_token: leaseToken,
        p_envelope: envelope,
        p_evidence_digest: checked.digest,
        p_summary: summary,
        p_verifier_id: verifierId,
        p_verifier_nonce: nonce,
      });
      if (error) {
        if (error.code === "P0002") return json({ error: "Execution run not found" }, 404);
        if (error.code === "42501") return json({ error: "Trusted verifier is not authorized" }, 403);
        if (error.code === "23505") return json({ error: "Verifier nonce has already been consumed or this run already has a proof" }, 409);
        if (error.code === "55000") return json({ error: "The worker lease is no longer active" }, 409);
        if (error.code === "23514" || error.code === "22P02") return json({ error: "Proof does not satisfy the task verification contract" }, 422);
        throw error;
      }
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.proof_id || !result?.attestation_id || result.completion_status !== "succeeded") {
        throw new Error("Atomic proof persistence returned an invalid result");
      }
      return json({
        status: "completed",
        proof_id: result.proof_id,
        attestation_id: result.attestation_id,
        digest: checked.digest,
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      if (error instanceof RequestInputError) return json({ error: message }, error.status);
      if (message.includes("configuration")) return json({ error: "Trusted verifier is not configured" }, 503);
      console.error("NOVA trusted proof request failed");
      return json({ error: "Trusted proof persistence failed" }, 500);
    }
  },
);

Deno.serve(handler);
