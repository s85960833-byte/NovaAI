import {
  canonicalizeMissionProof,
  createMissionProofEnvelope,
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
  schema_version: "nova.proof.v2",
  output: { title: "Verified output", items: ["alpha", "beta"] },
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

Deno.test("requires the exact task output inside the signed proof envelope", async () => {
  const missing = envelope() as unknown as Record<string, unknown>;
  delete missing.output;
  const malformed = { ...envelope(), output: [] };
  for (const value of [missing, malformed]) {
    const result = await verifyMissionProofEnvelope(value, binding);
    if (result.valid) throw new Error("Missing or non-object task output was accepted");
  }
  const original = envelope();
  const changed = { ...original, output: { title: "Substituted output" } };
  const first = await verifyMissionProofEnvelope(original, binding);
  const second = await verifyMissionProofEnvelope(changed, binding);
  if (!first.valid || !second.valid || first.digest === second.digest) {
    throw new Error("Proof digest did not bind the exact task output");
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

Deno.test("rejects unrecognized assurance claims and unsupported envelope/check fields", async () => {
  const forgedAssurance = { ...envelope(), assurance_level: "external_verified" };
  const extraCheckField = {
    ...envelope(),
    checks: [{ id: "page-loaded", passed: true, evidence_url: "https://example.invalid" }],
  };
  for (const value of [forgedAssurance, extraCheckField]) {
    const result = await verifyMissionProofEnvelope(value, binding);
    if (result.valid) throw new Error("Unsupported proof claim or field was accepted");
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


const toolPolicy = {
  version: 1 as const,
  gates: [{
    id: "read-project-files",
    tool: "files.read",
    operation: "read",
    scope: { kind: "project" as const, ref: "nova-project" },
    risk: "low" as const,
    approvalRequired: false,
    credentialBoundary: "user_session" as const,
    reason: "Read only files explicitly attached to this project.",
    sourceRefIds: ["mission-input"],
  }, {
    id: "send-approved-email",
    tool: "email.send",
    operation: "send",
    scope: { kind: "resource" as const, ref: "approved-recipient-list" },
    risk: "high" as const,
    approvalRequired: true,
    credentialBoundary: "user_session" as const,
    reason: "Send only owner-approved content to approved recipients.",
    sourceRefIds: ["mission-input"],
  }],
};

const toolPolicyBinding = {
  ...binding,
  verifierId: "agents.tool-gates-policy",
  verifierVersion: "1.0.0",
};

Deno.test("trusted tool-gates proof persists its exact validated policy snapshot in the signed envelope", async () => {
  const value = {
    ...envelope(),
    verifier_id: toolPolicyBinding.verifierId,
    verifier_version: toolPolicyBinding.verifierVersion,
    tool_policy: toolPolicy,
  };
  const result = await verifyMissionProofEnvelope(value, toolPolicyBinding);
  if (!result.valid || !/^[a-f0-9]{64}$/.test(result.digest || "")) {
    throw new Error("A valid tool policy snapshot was not accepted: " + result.reason);
  }
});

Deno.test("tool-gates proof rejects missing or malformed policy snapshots and other verifiers cannot attach one", async () => {
  const missing = {
    ...envelope(),
    verifier_id: toolPolicyBinding.verifierId,
    verifier_version: toolPolicyBinding.verifierVersion,
  };
  const malformed = {
    ...missing,
    tool_policy: {
      version: 1,
      gates: [{
        id: "unrestricted-shell",
        tool: "shell.exec",
        operation: "execute",
        scope: { kind: "workspace", ref: "current-workspace" },
        risk: "high",
        approvalRequired: true,
        credentialBoundary: "user_session",
        reason: "Run unrestricted shell commands for the agent.",
        sourceRefIds: ["mission-input"],
      }],
    },
  };
  const smuggled = { ...envelope(), tool_policy: toolPolicy };
  for (const [value, expected] of [
    [missing, toolPolicyBinding],
    [malformed, toolPolicyBinding],
    [smuggled, binding],
  ] as const) {
    const result = await verifyMissionProofEnvelope(value, expected);
    if (result.valid) throw new Error("Invalid or smuggled tool policy snapshot was accepted");
  }
});


const permissionPolicy = {
  permissions: [{
    id: "123e4567-e89b-42d3-a456-426614174000",
    scope: { kind: "project" as const, ref: "nova-project" },
    actions: ["read"],
    approvalRequired: false,
    reason: "Read resources explicitly within this named project.",
    sourceRefIds: ["mission-input"] as ["mission-input"],
  }],
};
const permissionPolicyBinding = {
  ...binding,
  verifierId: "agents.permissions-least-privilege",
  verifierVersion: "1.0.0",
};

Deno.test("trusted permissions proof persists its exact validated permission snapshot in the signed envelope", async () => {
  const value = {
    ...envelope(),
    verifier_id: permissionPolicyBinding.verifierId,
    verifier_version: permissionPolicyBinding.verifierVersion,
    permission_policy: permissionPolicy,
  };
  const result = await verifyMissionProofEnvelope(value, permissionPolicyBinding);
  if (!result.valid || !/^[a-f0-9]{64}$/.test(result.digest || "")) {
    throw new Error("A valid permission policy snapshot was not accepted: " + result.reason);
  }
});

Deno.test("permission proofs reject missing or malformed snapshots and other verifiers cannot attach them", async () => {
  const missing = {
    ...envelope(),
    verifier_id: permissionPolicyBinding.verifierId,
    verifier_version: permissionPolicyBinding.verifierVersion,
  };
  const malformed = {
    ...missing,
    permission_policy: {
      permissions: [{
        id: "123e4567-e89b-42d3-a456-426614174001",
        scope: { kind: "workspace", ref: "global" },
        actions: ["admin"],
        approvalRequired: false,
        reason: "Allow all unrestricted administrative actions.",
        sourceRefIds: ["mission-input"],
      }],
    },
  };
  const smuggled = { ...envelope(), permission_policy: permissionPolicy };
  for (const [value, expected] of [
    [missing, permissionPolicyBinding],
    [malformed, permissionPolicyBinding],
    [smuggled, binding],
  ] as const) {
    const result = await verifyMissionProofEnvelope(value, expected);
    if (result.valid) throw new Error("Invalid or smuggled permission policy snapshot was accepted");
  }
});


Deno.test("proof builder copies output only from the immutable task execution result", async () => {
  const taskResult = Object.freeze({
    output: Object.freeze({ reportId: "report-123", findings: Object.freeze(["a", "b"]) }),
  });
  const fields = {
    mission_id: binding.missionId,
    task_id: binding.taskId,
    run_id: binding.runId,
    verifier_id: binding.verifierId,
    verifier_version: binding.verifierVersion,
    observed_at: "2026-11-10T11:00:00.000Z",
    outcome: "passed" as const,
    checks: [{ id: "report-verified", passed: true }],
  };
  const built = createMissionProofEnvelope(fields, taskResult);
  if (canonicalizeMissionProof(built.output) !== canonicalizeMissionProof(taskResult.output)) {
    throw new Error("Proof builder substituted the task output");
  }
  const verified = await verifyMissionProofEnvelope(built, binding);
  if (!verified.valid) throw new Error("Proof builder emitted an invalid envelope: " + verified.reason);

  let rejected = false;
  try {
    createMissionProofEnvelope(
      { ...fields, output: { forged: true } } as unknown as Omit<MissionProofEnvelope, "schema_version" | "output">,
      taskResult,
    );
  } catch { rejected = true; }
  if (!rejected) throw new Error("Proof builder accepted caller-supplied output");

  let getterRejected = false;
  const hostileOutput: Record<string, unknown> = {};
  Object.defineProperty(hostileOutput, "secret", {
    enumerable: true,
    get() { throw new Error("getter must not execute"); },
  });
  try {
    createMissionProofEnvelope(fields, { output: hostileOutput });
  } catch { getterRejected = true; }
  if (!getterRejected) throw new Error("Proof builder accepted accessor-backed output");

  let sparseRejected = false;
  try {
    createMissionProofEnvelope(fields, { output: { items: new Array(2) } });
  } catch { sparseRejected = true; }
  if (!sparseRejected) throw new Error("Proof builder accepted a sparse output array");

  let deeplyNested: unknown = "leaf";
  for (let depth = 0; depth < 18; depth++) deeplyNested = [deeplyNested];
  let depthRejected = false;
  try {
    createMissionProofEnvelope(fields, { output: { nested: deeplyNested } });
  } catch { depthRejected = true; }
  if (!depthRejected) throw new Error("Proof builder accepted output nested beyond the depth limit");
});
