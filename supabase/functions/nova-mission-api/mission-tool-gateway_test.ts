import {
  authorizeMissionToolAction,
  buildMissionToolPolicyApprovalSummary,
  type MissionToolGatewayContext,
  type MissionToolPolicy,
} from "./mission-tool-gateway.ts";

const fixedNow = new Date("2026-11-11T12:00:00.000Z");
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
      status: "approved", actionSummary: await buildMissionToolPolicyApprovalSummary(policy),
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

  const crossOwner = await makeContext();
  crossOwner.run.ownerId = "another-owner";
  if ((await authorizeMissionToolAction(crossOwner, request, async () => {
    throw new Error("Must not reserve");
  })).authorized) throw new Error("Cross-owner run was accepted");
});
