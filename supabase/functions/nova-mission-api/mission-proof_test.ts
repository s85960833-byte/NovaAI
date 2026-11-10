import {
  canonicalizeMissionProof,
  verifyMissionProofEnvelope,
  type MissionProofEnvelope,
} from "./mission-proof.ts";

const binding = {
  missionId: "11111111-1111-4111-8111-111111111111",
  taskId: "22222222-2222-4222-8222-222222222222",
  runId: "33333333-3333-4333-8333-333333333333",
  verifierId: "nova.browser-checks",
  verifierVersion: "1.0.0",
};

const envelope = (): MissionProofEnvelope => ({
  schema_version: "nova.proof.v1",
  mission_id: binding.missionId,
  task_id: binding.taskId,
  run_id: binding.runId,
  verifier_id: binding.verifierId,
  verifier_version: binding.verifierVersion,
  observed_at: "2026-11-10T11:00:00.000Z",
  outcome: "passed",
  checks: [{ id: "page-loaded", passed: true }, { id: "no-console-errors", passed: true }],
});

Deno.test("canonical proof serialization is stable across object key order", () => {
  const left = canonicalizeMissionProof({ b: 2, a: { d: true, c: 1 } });
  const right = canonicalizeMissionProof({ a: { c: 1, d: true }, b: 2 });
  if (left !== right) throw new Error("Canonical JSON differs by object key order");
});

Deno.test("verifies a proof envelope bound to the expected task, run and verifier", async () => {
  const result = await verifyMissionProofEnvelope(envelope(), binding);
  if (!result.valid || !/^[a-f0-9]{64}$/.test(result.digest || "")) {
    throw new Error("Expected a valid SHA-256 proof digest");
  }
});

Deno.test("rejects proof envelopes bound to another task or run", async () => {
  const wrongTask = envelope();
  wrongTask.task_id = "44444444-4444-4444-8444-444444444444";
  const wrongRun = envelope();
  wrongRun.run_id = "55555555-5555-4555-8555-555555555555";
  for (const value of [wrongTask, wrongRun]) {
    const result = await verifyMissionProofEnvelope(value, binding);
    if (result.valid) throw new Error("Mismatched task/run proof was accepted");
  }
});

Deno.test("rejects outcome mismatches, duplicate checks and verifier-version mismatches", async () => {
  const wrongOutcome = envelope();
  wrongOutcome.checks[0].passed = false;
  const duplicate = envelope();
  duplicate.checks[1].id = duplicate.checks[0].id;
  const wrongVersion = envelope();
  wrongVersion.verifier_version = "9.9.9";
  for (const value of [wrongOutcome, duplicate, wrongVersion]) {
    const result = await verifyMissionProofEnvelope(value, binding);
    if (result.valid) throw new Error("Invalid proof envelope was accepted");
  }
});

Deno.test("rejects oversized and non-JSON proof payloads", () => {
  try {
    canonicalizeMissionProof({ evidence: "x".repeat(51_000) });
    throw new Error("Oversized proof payload was accepted");
  } catch (error) {
    if (!(error instanceof TypeError) || !error.message.includes("50 KB")) throw error;
  }
  try {
    canonicalizeMissionProof({ invalid: undefined });
    throw new Error("Non-JSON proof payload was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
});
