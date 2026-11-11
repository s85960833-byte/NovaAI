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
