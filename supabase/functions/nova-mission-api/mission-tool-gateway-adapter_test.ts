import {
  loadMissionToolGatewayContext,
  reserveMissionToolAction,
  type MissionServiceRoleDatabase,
} from "./mission-tool-gateway-adapter.ts";

const UUIDS = {
  mission: "11111111-1111-4111-8111-111111111111",
  owner: "22222222-2222-4222-8222-222222222222",
  task: "33333333-3333-4333-8333-333333333333",
  run: "44444444-4444-4444-8444-444444444444",
};

function noRowsDb(): MissionServiceRoleDatabase {
  const query = {
    select() { return this; },
    eq() { return this; },
    in() { return this; },
    order() { return this; },
    limit() { return this; },
    maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    then(resolve: (value: { data: unknown; error: unknown }) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    },
  };
  return {
    from() { return query as unknown as ReturnType<MissionServiceRoleDatabase["from"]>; },
    rpc() { return Promise.resolve({ data: null, error: new Error("unexpected RPC") }); },
  };
}

Deno.test("trusted gateway adapter fails closed when any owner-scoped mission row is missing", async () => {
  let denied = false;
  try {
    await loadMissionToolGatewayContext(noRowsDb(), {
      missionId: UUIDS.mission, taskId: UUIDS.task, runId: UUIDS.run,
      ownerId: UUIDS.owner, workerId: "worker-a", leaseToken: "lease-a",
    });
  } catch (error) {
    denied = error instanceof Error && error.message.startsWith("Mission gateway context denied: trusted ") && error.message.endsWith(" row unavailable");
  }
  if (!denied) throw new Error("Missing owner-scoped mission row was not rejected");
});

Deno.test("trusted gateway adapter rejects malformed identifiers before querying", async () => {
  let queried = false;
  const db = noRowsDb();
  const guarded: MissionServiceRoleDatabase = {
    from(table) { queried = true; return db.from(table); },
    rpc(name, args) { return db.rpc(name, args); },
  };
  try {
    await loadMissionToolGatewayContext(guarded, {
      missionId: "not-a-uuid", taskId: UUIDS.task, runId: UUIDS.run,
      ownerId: UUIDS.owner, workerId: "worker-a", leaseToken: "lease-a",
    });
  } catch {
    if (queried) throw new Error("Malformed identifiers reached the database");
    return;
  }
  throw new Error("Malformed identifiers were accepted");
});

Deno.test("reservation adapter binds all fields to the trusted atomic RPC", async () => {
  const captured: { value: { name: string; args: Record<string, unknown> } | null } = { value: null };
  const db: MissionServiceRoleDatabase = {
    from() { throw new Error("No table reads expected"); },
    rpc(name, args) {
      captured.value = { name, args };
      return Promise.resolve({
        data: [{ action_id: "55555555-5555-4555-8555-555555555555", action_status: "reserved", replayed: false }],
        error: null,
      });
    },
  };
  const result = await reserveMissionToolAction(db, {
    runId: UUIDS.run, leaseToken: "lease-a", actionKey: "write-project-file",
    requestDigest: "a".repeat(64),
  });
  const call = captured.value as { name: string; args: Record<string, unknown> } | null;
  if (!call || call.name !== "nova_reserve_mission_action" ||
      call.args.p_run_id !== UUIDS.run || call.args.p_lease_token !== "lease-a" ||
      call.args.p_action_key !== "write-project-file" || call.args.p_request_digest !== "a".repeat(64) ||
      result.status !== "reserved" || result.replayed || result.actionId !== "55555555-5555-4555-8555-555555555555") {
    throw new Error("Reservation was not bound to the expected database RPC");
  }
});

Deno.test("reservation adapter rejects malformed or duplicate RPC responses", async () => {
  for (const data of [
    [{ action_id: "not-a-uuid", action_status: "reserved", replayed: false }],
    [{ action_id: "55555555-5555-4555-8555-555555555555", action_status: "executed", replayed: false }],
    [],
    [{ action_id: "55555555-5555-4555-8555-555555555555", action_status: "reserved", replayed: false },
     { action_id: "66666666-6666-4666-8666-666666666666", action_status: "reserved", replayed: false }],
  ]) {
    const db: MissionServiceRoleDatabase = {
      from() { throw new Error("No table reads expected"); },
      rpc() { return Promise.resolve({ data, error: null }); },
    };
    let denied = false;
    try {
      await reserveMissionToolAction(db, {
        runId: UUIDS.run, leaseToken: "lease-a", actionKey: "write-project-file",
        requestDigest: "a".repeat(64),
      });
    } catch { denied = true; }
    if (!denied) throw new Error("Malformed reservation response was accepted");
  }
});


import { buildMissionToolPolicyApprovalSummary } from "./mission-tool-gateway.ts";
import { verifyMissionProofEnvelope } from "./mission-proof.ts";

const FIXTURE = {
  mission: "11111111-1111-4111-8111-111111111111",
  owner: "22222222-2222-4222-8222-222222222222",
  activeTask: "33333333-3333-4333-8333-333333333333",
  activeRun: "44444444-4444-4444-8444-444444444444",
  approval: "55555555-5555-4555-8555-555555555555",
  toolTask: "66666666-6666-4666-8666-666666666666",
  toolRun: "77777777-7777-4777-8777-777777777777",
  toolProof: "88888888-8888-4888-8888-888888888888",
  permissionTask: "99999999-9999-4999-8999-999999999999",
  permissionRun: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  permissionProof: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  lease: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

const fixtureToolPolicy = {
  version: 1 as const,
  gates: [{
    id: "read-project-files", tool: "files.read", operation: "read",
    scope: { kind: "project" as const, ref: "nova-project" }, risk: "low" as const,
    approvalRequired: false, credentialBoundary: "user_session" as const,
    reason: "Read only files explicitly attached to this project.", sourceRefIds: ["mission-input"],
  }, {
    id: "send-approved-email", tool: "email.send", operation: "send",
    scope: { kind: "resource" as const, ref: "approved-recipient-list" }, risk: "high" as const,
    approvalRequired: true, credentialBoundary: "user_session" as const,
    reason: "Send only owner-approved content to approved recipients.", sourceRefIds: ["mission-input"],
  }],
};
const fixturePermissionPolicy = {
  permissions: [{
    id: "123e4567-e89b-42d3-a456-426614174000",
    scope: { kind: "project" as const, ref: "nova-project" }, actions: ["read"],
    approvalRequired: false, reason: "Read project resources explicitly named by the mission.",
    sourceRefIds: ["mission-input"] as ["mission-input"],
  }, {
    id: "123e4567-e89b-42d3-a456-426614174001",
    scope: { kind: "resource" as const, ref: "approved-recipient-list" }, actions: ["send"],
    approvalRequired: true, reason: "Send only to recipients approved by the owner.",
    sourceRefIds: ["mission-input"] as ["mission-input"],
  }],
};

function fixtureDb(tables: Record<string, Record<string, unknown>[]>): MissionServiceRoleDatabase {
  const database = {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      const memberships: Array<[string, unknown[]]> = [];
      let maximum = 1000;
      const query: any = {
        select() { return query; },
        eq(column: string, value: unknown) { filters.push([column, value]); return query; },
        in(column: string, values: unknown[]) { memberships.push([column, values]); return query; },
        order() { return query; },
        limit(count: number) { maximum = count; return query; },
        rows() {
          return (tables[table] || []).filter((row) =>
            filters.every(([column, value]) => row[column] === value) &&
            memberships.every(([column, values]) => values.includes(row[column]))
          ).slice(0, maximum);
        },
        maybeSingle() {
          const rows = query.rows();
          return Promise.resolve({ data: rows.length === 1 ? rows[0] : null, error: rows.length > 1 ? new Error("multiple rows") : null });
        },
        then(onfulfilled?: (value: { data: unknown; error: unknown }) => unknown, onrejected?: (reason: unknown) => unknown) {
          return Promise.resolve({ data: query.rows(), error: null }).then(onfulfilled, onrejected);
        },
      };
      return query;
    },
    rpc() { return Promise.resolve({ data: null, error: new Error("unexpected RPC") }); },
  };
  return database as unknown as MissionServiceRoleDatabase;
}

async function makeValidGatewayFixture() {
  const baseEnvelope = (taskId: string, runId: string, verifierId: string, policyKey: "tool_policy" | "permission_policy", policy: unknown) => ({
    schema_version: "nova.proof.v1" as const,
    mission_id: FIXTURE.mission,
    task_id: taskId,
    run_id: runId,
    verifier_id: verifierId,
    verifier_version: "1.0.0",
    observed_at: "2026-11-11T08:00:00.000Z",
    outcome: "passed" as const,
    checks: [{ id: "policy-validated", passed: true }],
    [policyKey]: policy,
  });
  const toolEnvelope = baseEnvelope(FIXTURE.toolTask, FIXTURE.toolRun, "agents.tool-gates-policy", "tool_policy", fixtureToolPolicy);
  const permissionEnvelope = baseEnvelope(FIXTURE.permissionTask, FIXTURE.permissionRun, "agents.permissions-least-privilege", "permission_policy", fixturePermissionPolicy);
  const [toolCheck, permissionCheck] = await Promise.all([
    verifyMissionProofEnvelope(toolEnvelope, {
      missionId: FIXTURE.mission, taskId: FIXTURE.toolTask, runId: FIXTURE.toolRun,
      verifierId: "agents.tool-gates-policy", verifierVersion: "1.0.0",
    }),
    verifyMissionProofEnvelope(permissionEnvelope, {
      missionId: FIXTURE.mission, taskId: FIXTURE.permissionTask, runId: FIXTURE.permissionRun,
      verifierId: "agents.permissions-least-privilege", verifierVersion: "1.0.0",
    }),
  ]);
  if (!toolCheck.valid || !permissionCheck.valid) throw new Error("Test fixture proof envelopes are invalid");
  const actionSummary = await buildMissionToolPolicyApprovalSummary(
    fixtureToolPolicy as Parameters<typeof buildMissionToolPolicyApprovalSummary>[0],
    fixturePermissionPolicy as Parameters<typeof buildMissionToolPolicyApprovalSummary>[1],
  );
  const tables: Record<string, Record<string, unknown>[]> = {
    nova_missions: [{ id: FIXTURE.mission, owner_id: FIXTURE.owner, state: "running" }],
    nova_mission_tasks: [
      { id: FIXTURE.activeTask, mission_id: FIXTURE.mission, owner_id: FIXTURE.owner, task_type: "agents.approved_steps", status: "running" },
      { id: FIXTURE.toolTask, mission_id: FIXTURE.mission, owner_id: FIXTURE.owner, task_type: "agents.tool_gates", status: "completed" },
      { id: FIXTURE.permissionTask, mission_id: FIXTURE.mission, owner_id: FIXTURE.owner, task_type: "agents.permissions", status: "completed" },
    ],
    nova_mission_execution_runs: [
      { id: FIXTURE.activeRun, mission_id: FIXTURE.mission, task_id: FIXTURE.activeTask, owner_id: FIXTURE.owner, approval_id: FIXTURE.approval, status: "running", worker_id: "worker-a", lease_token: FIXTURE.lease, lease_expires_at: "2030-01-01T00:00:00.000Z" },
      { id: FIXTURE.toolRun, mission_id: FIXTURE.mission, task_id: FIXTURE.toolTask, owner_id: FIXTURE.owner, status: "succeeded" },
      { id: FIXTURE.permissionRun, mission_id: FIXTURE.mission, task_id: FIXTURE.permissionTask, owner_id: FIXTURE.owner, status: "succeeded" },
    ],
    nova_mission_approvals: [{ id: FIXTURE.approval, mission_id: FIXTURE.mission, task_id: FIXTURE.activeTask, owner_id: FIXTURE.owner, status: "approved", action_summary: actionSummary }],
    nova_mission_proofs: [
      { id: FIXTURE.toolProof, mission_id: FIXTURE.mission, task_id: FIXTURE.toolTask, owner_id: FIXTURE.owner, proof_type: "trusted_verifier", verification_status: "passed", evidence_json: toolEnvelope, verified_at: "2026-11-11T08:00:01.000Z" },
      { id: FIXTURE.permissionProof, mission_id: FIXTURE.mission, task_id: FIXTURE.permissionTask, owner_id: FIXTURE.owner, proof_type: "trusted_verifier", verification_status: "passed", evidence_json: permissionEnvelope, verified_at: "2026-11-11T08:00:01.000Z" },
    ],
    nova_mission_proof_attestations: [
      { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", proof_id: FIXTURE.toolProof, mission_id: FIXTURE.mission, task_id: FIXTURE.toolTask, run_id: FIXTURE.toolRun, owner_id: FIXTURE.owner, verifier_id: "agents.tool-gates-policy", verifier_version: "1.0.0", evidence_digest: toolCheck.digest, envelope_json: toolEnvelope, outcome: "passed", canonicalization_version: "nova.cjson.v1", attested_at: "2026-11-11T08:00:02.000Z" },
      { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", proof_id: FIXTURE.permissionProof, mission_id: FIXTURE.mission, task_id: FIXTURE.permissionTask, run_id: FIXTURE.permissionRun, owner_id: FIXTURE.owner, verifier_id: "agents.permissions-least-privilege", verifier_version: "1.0.0", evidence_digest: permissionCheck.digest, envelope_json: permissionEnvelope, outcome: "passed", canonicalization_version: "nova.cjson.v1", attested_at: "2026-11-11T08:00:02.000Z" },
    ],
  };
  return { tables, actionSummary };
}

Deno.test("trusted gateway adapter assembles only a digest-matched, independently completed policy pair", async () => {
  const { tables } = await makeValidGatewayFixture();
  const context = await loadMissionToolGatewayContext(fixtureDb(tables), {
    missionId: FIXTURE.mission, taskId: FIXTURE.activeTask, runId: FIXTURE.activeRun,
    ownerId: FIXTURE.owner, workerId: "worker-a", leaseToken: FIXTURE.lease,
  });
  if (context.policyProof.taskType !== "agents.tool_gates" ||
      context.permissionProof.taskType !== "agents.permissions" ||
      context.policyProof.taskId === context.permissionProof.taskId ||
      context.policyProof.taskId === context.task.id ||
      context.permissionProof.taskId === context.task.id ||
      context.approval.actionSummary.length < 1) {
    throw new Error("Trusted policy context was not assembled with distinct, owner-bound tasks");
  }
});

Deno.test("trusted gateway adapter rejects proof digest tampering and incomplete policy task states", async () => {
  const tampered = await makeValidGatewayFixture();
  tampered.tables.nova_mission_proof_attestations[0].evidence_digest = "f".repeat(64);
  let digestDenied = false;
  try {
    await loadMissionToolGatewayContext(fixtureDb(tampered.tables), {
      missionId: FIXTURE.mission, taskId: FIXTURE.activeTask, runId: FIXTURE.activeRun,
      ownerId: FIXTURE.owner, workerId: "worker-a", leaseToken: FIXTURE.lease,
    });
  } catch { digestDenied = true; }
  if (!digestDenied) throw new Error("Tampered proof digest was accepted");

  const incomplete = await makeValidGatewayFixture();
  incomplete.tables.nova_mission_tasks[1].status = "running";
  let stateDenied = false;
  try {
    await loadMissionToolGatewayContext(fixtureDb(incomplete.tables), {
      missionId: FIXTURE.mission, taskId: FIXTURE.activeTask, runId: FIXTURE.activeRun,
      ownerId: FIXTURE.owner, workerId: "worker-a", leaseToken: FIXTURE.lease,
    });
  } catch { stateDenied = true; }
  if (!stateDenied) throw new Error("Incomplete policy task was accepted");
});

Deno.test("trusted gateway adapter rejects malformed lease and worker identifiers before querying", async () => {
  for (const override of [{ leaseToken: "not-a-uuid" }, { workerId: "bad worker id" }]) {
    let queried = false;
    const db = noRowsDb();
    const guarded: MissionServiceRoleDatabase = {
      from(table) { queried = true; return db.from(table); },
      rpc(name, args) { return db.rpc(name, args); },
    };
    try {
      await loadMissionToolGatewayContext(guarded, {
        missionId: UUIDS.mission, taskId: UUIDS.task, runId: UUIDS.run,
        ownerId: UUIDS.owner, workerId: "worker-a", leaseToken: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        ...override,
      });
    } catch {
      if (queried) throw new Error("Malformed worker lease data reached the database");
      continue;
    }
    throw new Error("Malformed worker lease data was accepted");
  }
});
