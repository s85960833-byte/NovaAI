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
    denied = error instanceof Error && error.message.includes("trusted nova_missions row unavailable");
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
