import { validateMissionToolPolicy } from "./mission-tool-policy.ts";
import {
  authorizeMissionToolAction,
  buildMissionToolPolicyApprovalSummary,
  type MissionToolGatewayContext,
  type MissionToolPolicy,
} from "./mission-tool-gateway.ts";
import type { MissionPermissionPolicy } from "./mission-permission-policy.ts";

const fixedNow = new Date("2026-11-11T12:00:00.000Z");
const permissionPolicy: MissionPermissionPolicy = {
  permissions: [{
    id: "123e4567-e89b-42d3-a456-426614174000",
    scope: { kind: "project", ref: "nova-project" },
    actions: ["read"],
    approvalRequired: false,
    reason: "Read files explicitly belonging to this named project.",
    sourceRefIds: ["mission-input"],
  }, {
    id: "123e4567-e89b-42d3-a456-426614174001",
    scope: { kind: "resource", ref: "approved-recipient-list" },
    actions: ["send"],
    approvalRequired: true,
    reason: "Send only content to the specifically approved recipients.",
    sourceRefIds: ["mission-input"],
  }],
};

const policy: MissionToolPolicy = {
  version: 1,
  gates: [{
    id: "read-project-files",
    tool: "files.read",
    operation: "read",
    scope: { kind: "project", ref: "nova-project" },
    risk: "low",
    approvalRequired: false,
    credentialBoundary: "user_session",
    reason: "Read only files explicitly attached to this project.",
    sourceRefIds: ["mission-input"],
  }, {
    id: "send-approved-email",
    tool: "email.send",
    operation: "send",
    scope: { kind: "resource", ref: "approved-recipient-list" },
    risk: "high",
    approvalRequired: true,
    credentialBoundary: "user_session",
    reason: "Send only owner-approved content to approved recipients.",
    sourceRefIds: ["mission-input"],
  }],
};

async function makeContext(): Promise<MissionToolGatewayContext> {
  return {
    now: fixedNow,
    mission: { id: "mission-1", ownerId: "owner-1", state: "running" },
    task: { id: "task-2", missionId: "mission-1", ownerId: "owner-1", taskType: "agents.approved_steps", status: "running" },
    run: {
      id: "run-2", missionId: "mission-1", taskId: "task-2", ownerId: "owner-1",
      approvalId: "approval-2", status: "running", workerId: "worker-test",
      leaseToken: "lease-token-test", leaseExpiresAt: "2026-11-11T12:05:00.000Z",
    },
    approval: {
      id: "approval-2", missionId: "mission-1", taskId: "task-2", ownerId: "owner-1",
      status: "approved", actionSummary: await buildMissionToolPolicyApprovalSummary(policy, permissionPolicy),
    },
    policyProof: {
      id: "proof-policy", missionId: "mission-1", taskId: "task-policy", ownerId: "owner-1",
      taskType: "agents.tool_gates", status: "passed", outcome: "passed",
      verifierId: "agents.tool-gates-policy", verifierVersion: "1.0.0",
      runId: "run-policy", policy: structuredClone(policy),
    },
    policyAttestation: {
      proofId: "proof-policy", missionId: "mission-1", taskId: "task-policy",
      ownerId: "owner-1", runId: "run-policy",
      verifierId: "agents.tool-gates-policy", verifierVersion: "1.0.0", outcome: "passed",
    },
    permissionProof: {
      id: "proof-permissions", missionId: "mission-1", taskId: "task-permissions", ownerId: "owner-1",
      taskType: "agents.permissions", status: "passed", outcome: "passed",
      verifierId: "agents.permissions-least-privilege", verifierVersion: "1.0.0",
      runId: "run-permissions", policy: structuredClone(permissionPolicy),
    },
    permissionAttestation: {
      proofId: "proof-permissions", missionId: "mission-1", taskId: "task-permissions",
      ownerId: "owner-1", runId: "run-permissions",
      verifierId: "agents.permissions-least-privilege", verifierVersion: "1.0.0", outcome: "passed",
    },
  };
}

const request = {
  actionKey: "send-customer-update-1",
  tool: "email.send",
  operation: "send",
  scope: { kind: "resource" as const, ref: "approved-recipient-list" },
  requestDigest: "a".repeat(64),
};

Deno.test("runtime tool gateway allows only a policy-bound approved action with a fresh lease", async () => {
  const context = await makeContext();
  let reservations = 0;
  const result = await authorizeMissionToolAction(context, request, async (args) => {
    reservations++;
    if (args.runId !== "run-2" || args.leaseToken !== "lease-token-test" ||
        args.actionKey !== request.actionKey || !/^[a-f0-9]{64}$/.test(args.requestDigest)) {
      throw new Error("Reservation arguments were not bound to the active action");
    }
    return { actionId: "action-1", status: "reserved", replayed: false };
  });
  if (!result.authorized || !result.executeNow || reservations !== 1) {
    throw new Error("A valid owner-approved action was not authorized");
  }
});

Deno.test("runtime tool gateway denies stale leases, rejected approvals and policy-summary mismatch", async () => {
  const expired = await makeContext();
  expired.run.leaseExpiresAt = "2026-11-11T11:59:59.000Z";
  let called = 0;
  const reserve = async () => {
    called++;
    return { actionId: "a", status: "reserved" as const, replayed: false };
  };
  if ((await authorizeMissionToolAction(expired, request, reserve)).authorized) {
    throw new Error("Expired lease was accepted");
  }
  const rejected = await makeContext();
  rejected.approval.status = "rejected";
  if ((await authorizeMissionToolAction(rejected, request, reserve)).authorized) {
    throw new Error("Rejected approval was accepted");
  }
  const mismatch = await makeContext();
  mismatch.approval.actionSummary = "Approved all tools";
  if ((await authorizeMissionToolAction(mismatch, request, reserve)).authorized || called !== 0) {
    throw new Error("A policy-summary mismatch reached reservation");
  }
});

Deno.test("runtime tool gateway denies unknown tools, broader scopes and unapproved side effects", async () => {
  const context = await makeContext();
  let called = 0;
  const reserve = async () => {
    called++;
    return { actionId: "a", status: "reserved" as const, replayed: false };
  };
  if ((await authorizeMissionToolAction(context, { ...request, tool: "shell.exec" }, reserve)).authorized) {
    throw new Error("Unknown tool was accepted");
  }
  if ((await authorizeMissionToolAction(context, { ...request, scope: { kind: "workspace", ref: "current-workspace" } }, reserve)).authorized) {
    throw new Error("Broader scope was accepted");
  }
  const badPolicy = await makeContext();
  (badPolicy.policyProof.policy as MissionToolPolicy).gates[1].approvalRequired = false;
  if ((await authorizeMissionToolAction(badPolicy, request, reserve)).authorized || called !== 0) {
    throw new Error("Policy without side-effect approval was accepted");
  }
});

Deno.test("runtime tool gateway never re-executes replayed, completed or uncertain actions", async () => {
  for (const status of ["reserved", "completed", "uncertain"] as const) {
    const context = await makeContext();
    const result = await authorizeMissionToolAction(context, request, async () => ({
      actionId: "action-replay", status, replayed: true,
    }));
    if (!result.authorized || result.executeNow || result.status !== status) {
      throw new Error("Replay state " + status + " was not safely blocked: " + JSON.stringify(result));
    }
  }
});

Deno.test("runtime tool gateway requires matching verifier attestation and task/run ownership", async () => {
  const badProof = await makeContext();
  badProof.policyAttestation.verifierId = "untrusted";
  if ((await authorizeMissionToolAction(badProof, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("Untrusted policy attestation was accepted");

  const mismatchedTask = await makeContext();
  mismatchedTask.policyAttestation.taskId = "another-policy-task";
  if ((await authorizeMissionToolAction(mismatchedTask, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("Policy attestation for another task was accepted");

  const mismatchedRun = await makeContext();
  mismatchedRun.policyAttestation.runId = "another-policy-run";
  if ((await authorizeMissionToolAction(mismatchedRun, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("Policy attestation for another run was accepted");

  const sameTask = await makeContext();
  sameTask.policyProof.taskId = sameTask.task.id;
  sameTask.policyAttestation.taskId = sameTask.task.id;
  if ((await authorizeMissionToolAction(sameTask, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("A task was allowed to authorize itself using its own tool-gates proof");

  const crossOwner = await makeContext();
  crossOwner.run.ownerId = "another-owner";
  if ((await authorizeMissionToolAction(crossOwner, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("Cross-owner run was accepted");
});


Deno.test("tool policy limits keep the owner approval summary within the database contract", async () => {
  const gates = Array.from({ length: 16 }, (_, index) => ({
    id: "gate-" + String(index).padStart(2, "0"),
    tool: "deployment.deploy",
    operation: "deploy",
    scope: { kind: "resource" as const, ref: "r".repeat(48) },
    risk: "high" as const,
    approvalRequired: true,
    credentialBoundary: "user_session" as const,
    reason: "Deploy only the explicitly approved release target.",
    sourceRefIds: ["mission-input"],
  }));
  const bounded: MissionToolPolicy = { version: 1, gates };
  if (!validateMissionToolPolicy(bounded)) {
    throw new Error("Maximum supported tool policy was rejected");
  }
  const summary = await buildMissionToolPolicyApprovalSummary(bounded, permissionPolicy);
  if (summary.length > 2000) {
    throw new Error("Maximum supported policy summary exceeds approval storage limit: " + summary.length);
  }
  const tooMany: MissionToolPolicy = {
    version: 1,
    gates: [...gates, { ...gates[0], id: "gate-16" }],
  };
  if (validateMissionToolPolicy(tooMany)) {
    throw new Error("Policy exceeding the approval summary gate limit was accepted");
  }
});

Deno.test("runtime tool gateway requires a distinct passing permission proof and exact grant", async () => {
  const missing = await makeContext();
  missing.permissionProof.status = "failed";
  if ((await authorizeMissionToolAction(missing, request, async () => {
    throw new Error("Must not reserve without a passing permission proof");
  })).authorized) throw new Error("Missing passing permission proof was accepted");

  const crossMission = await makeContext();
  crossMission.permissionProof.missionId = "another-mission";
  if ((await authorizeMissionToolAction(crossMission, request, async () => {
    throw new Error("Must not reserve cross-mission permissions");
  })).authorized) throw new Error("Cross-mission permission proof was accepted");

  const sameTask = await makeContext();
  sameTask.permissionProof.taskId = sameTask.task.id;
  sameTask.permissionAttestation.taskId = sameTask.task.id;
  if ((await authorizeMissionToolAction(sameTask, request, async () => {
    throw new Error("Must not reserve self-authorized task");
  })).authorized) throw new Error("Active task self-authorized through its permission proof");

  const insufficient = await makeContext();
  (insufficient.permissionProof.policy as MissionPermissionPolicy).permissions[1].actions = ["read"];
  if ((await authorizeMissionToolAction(insufficient, request, async () => {
    throw new Error("Must not reserve without send permission");
  })).authorized) throw new Error("Tool gate bypassed missing send permission");

  const scopeMismatch = await makeContext();
  (scopeMismatch.permissionProof.policy as MissionPermissionPolicy).permissions[1].scope.ref = "other-list";
  if ((await authorizeMissionToolAction(scopeMismatch, request, async () => {
    throw new Error("Must not reserve wrong permission scope");
  })).authorized) throw new Error("Permission for a different scope was accepted");

  const approvalMismatch = await makeContext();
  approvalMismatch.approval.actionSummary = "Tool gates approved without permission grants";
  if ((await authorizeMissionToolAction(approvalMismatch, request, async () => {
    throw new Error("Must not reserve with unbound owner approval");
  })).authorized) throw new Error("Approval not bound to both policy snapshots was accepted");
});
