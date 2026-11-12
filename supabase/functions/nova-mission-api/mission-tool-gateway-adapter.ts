import {
  buildMissionToolPolicyApprovalSummary,
  type MissionToolGatewayContext,
  type MissionToolReservation,
} from "./mission-tool-gateway.ts";
import {
  canonicalizeMissionProof,
  verifyMissionProofEnvelope,
} from "./mission-proof.ts";
import { validateMissionToolPolicy } from "./mission-tool-policy.ts";
import { validateMissionPermissionPolicy } from "./mission-permission-policy.ts";

interface DbResult {
  data: unknown;
  error: unknown;
}
interface DbQuery extends PromiseLike<DbResult> {
  select(columns: string): DbQuery;
  eq(column: string, value: unknown): DbQuery;
  in(column: string, values: unknown[]): DbQuery;
  order(column: string, options: { ascending: boolean }): DbQuery;
  limit(count: number): DbQuery;
  maybeSingle(): PromiseLike<DbResult>;
}
export interface MissionServiceRoleDatabase {
  from(table: string): DbQuery;
  rpc(name: string, args: Record<string, unknown>): PromiseLike<DbResult>;
}

export interface MissionGatewayLoadInput {
  missionId: string;
  taskId: string;
  runId: string;
  ownerId: string;
  workerId: string;
  leaseToken: string;
}

type Row = Record<string, unknown>;
const TOOL_VERIFIER = "agents.tool-gates-policy";
const PERMISSION_VERIFIER = "agents.permissions-least-privilege";
const VERIFIER_VERSION = "1.0.0";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Row | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Row;
}
function str(row: Row, key: string): string | null {
  return typeof row[key] === "string" ? row[key] as string : null;
}
function fail(message: string): never {
  throw new Error("Mission gateway context denied: " + message);
}
async function one(db: MissionServiceRoleDatabase, table: string, columns: string, filters: Array<[string, unknown]>): Promise<Row> {
  let query = db.from(table).select(columns);
  for (const [column, value] of filters) query = query.eq(column, value);
  const result = await query.maybeSingle();
  if (result.error || !record(result.data)) fail("trusted " + table + " row unavailable");
  return result.data as Row;
}
async function many(db: MissionServiceRoleDatabase, table: string, columns: string, filters: Array<[string, unknown]>, orderBy?: string): Promise<Row[]> {
  let query = db.from(table).select(columns);
  for (const [column, value] of filters) query = query.eq(column, value);
  if (orderBy) query = query.order(orderBy, { ascending: false });
  const result = await query.limit(101);
  if (result.error || !Array.isArray(result.data) || result.data.length > 100) {
    fail("trusted " + table + " result is unavailable or ambiguous");
  }
  const rows = result.data.map(record);
  if (rows.some((row) => row === null)) fail("trusted " + table + " contains malformed rows");
  return rows as Row[];
}
async function byIds(db: MissionServiceRoleDatabase, table: string, columns: string, field: string, ids: string[]): Promise<Row[]> {
  if (!ids.length) return [];
  const result = await db.from(table).select(columns).in(field, ids).limit(101);
  if (result.error || !Array.isArray(result.data) || result.data.length > 100) {
    fail("trusted " + table + " batch read failed");
  }
  const rows = result.data.map(record);
  if (rows.some((row) => row === null)) fail("trusted " + table + " contains malformed rows");
  return rows as Row[];
}

interface VerifiedPolicy {
  proof: Row;
  attestation: Row;
  task: Row;
  run: Row;
  policy: unknown;
}
async function verifiedPolicies(
  db: MissionServiceRoleDatabase,
  missionId: string,
  ownerId: string,
  verifierId: string,
  taskType: string,
): Promise<VerifiedPolicy[]> {
  const attestations = await many(db, "nova_mission_proof_attestations",
    "id,proof_id,mission_id,task_id,run_id,owner_id,verifier_id,verifier_version,evidence_digest,envelope_json,outcome,canonicalization_version",
    [["mission_id", missionId], ["owner_id", ownerId], ["verifier_id", verifierId], ["outcome", "passed"]],
    "attested_at");
  const candidates = attestations.filter((item) =>
    str(item, "mission_id") === missionId && str(item, "owner_id") === ownerId &&
    str(item, "verifier_id") === verifierId && str(item, "verifier_version") === VERIFIER_VERSION &&
    str(item, "outcome") === "passed" && str(item, "canonicalization_version") === "nova.cjson.v1" &&
    UUID.test(str(item, "proof_id") || "") && UUID.test(str(item, "task_id") || "") &&
    UUID.test(str(item, "run_id") || "") && /^[a-f0-9]{64}$/.test(str(item, "evidence_digest") || "")
  );
  const proofIds = [...new Set(candidates.map((item) => str(item, "proof_id")!))];
  const taskIds = [...new Set(candidates.map((item) => str(item, "task_id")!))];
  const runIds = [...new Set(candidates.map((item) => str(item, "run_id")!))];
  const [proofs, tasks, runs] = await Promise.all([
    byIds(db, "nova_mission_proofs", "id,mission_id,task_id,owner_id,proof_type,verification_status,evidence_json,verified_at", "id", proofIds),
    byIds(db, "nova_mission_tasks", "id,mission_id,owner_id,task_type,status", "id", taskIds),
    byIds(db, "nova_mission_execution_runs", "id,mission_id,task_id,owner_id,status", "id", runIds),
  ]);
  const proofMap = new Map(proofs.map((item) => [str(item, "id"), item]));
  const taskMap = new Map(tasks.map((item) => [str(item, "id"), item]));
  const runMap = new Map(runs.map((item) => [str(item, "id"), item]));
  const verified: VerifiedPolicy[] = [];
  for (const attestation of candidates) {
    const proofId = str(attestation, "proof_id")!;
    const taskId = str(attestation, "task_id")!;
    const runId = str(attestation, "run_id")!;
    const proof = proofMap.get(proofId);
    const task = taskMap.get(taskId);
    const run = runMap.get(runId);
    if (!proof || !task || !run ||
        str(proof, "mission_id") !== missionId || str(proof, "task_id") !== taskId ||
        str(proof, "owner_id") !== ownerId || str(proof, "proof_type") !== "trusted_verifier" ||
        str(proof, "verification_status") !== "passed" || !str(proof, "verified_at") ||
        str(task, "mission_id") !== missionId || str(task, "owner_id") !== ownerId ||
        str(task, "task_type") !== taskType || str(task, "status") !== "completed" ||
        str(run, "mission_id") !== missionId || str(run, "task_id") !== taskId ||
        str(run, "owner_id") !== ownerId || str(run, "status") !== "succeeded") continue;
    const envelope = record(attestation.envelope_json);
    const evidence = record(proof.evidence_json);
    if (!envelope || !evidence) continue;
    try {
      if (canonicalizeMissionProof(envelope) !== canonicalizeMissionProof(evidence)) continue;
      const check = await verifyMissionProofEnvelope(envelope, {
        missionId, taskId, runId, verifierId, verifierVersion: VERIFIER_VERSION,
      });
      if (!check.valid || check.digest !== str(attestation, "evidence_digest")) continue;
      const policy = verifierId === TOOL_VERIFIER ? envelope.tool_policy : envelope.permission_policy;
      if (verifierId === TOOL_VERIFIER ? !validateMissionToolPolicy(policy) : !validateMissionPermissionPolicy(policy)) continue;
      verified.push({ proof, attestation, task, run, policy });
    } catch {
      // Any malformed or non-canonical proof is excluded; the caller fails closed.
    }
  }
  return verified;
}

/**
 * Loads gateway authority exclusively through the supplied service-role database client.
 * It re-hashes both signed envelopes, verifies their proof/task/run rows, and requires
 * exactly one policy pair whose combined digest matches the immutable owner approval.
 */
export async function loadMissionToolGatewayContext(
  serviceRoleDb: MissionServiceRoleDatabase,
  input: MissionGatewayLoadInput,
): Promise<MissionToolGatewayContext> {
  if (![input.missionId, input.taskId, input.runId, input.ownerId, input.leaseToken].every((value) => UUID.test(value)) ||
      !/^[A-Za-z0-9._:-]{1,120}$/.test(input.workerId)) {
    fail("request identifiers or worker lease are malformed");
  }
  const [mission, task, run] = await Promise.all([
    one(serviceRoleDb, "nova_missions", "id,owner_id,state", [["id", input.missionId], ["owner_id", input.ownerId]]),
    one(serviceRoleDb, "nova_mission_tasks", "id,mission_id,owner_id,task_type,status", [["id", input.taskId], ["mission_id", input.missionId], ["owner_id", input.ownerId]]),
    one(serviceRoleDb, "nova_mission_execution_runs", "id,mission_id,task_id,owner_id,approval_id,status,worker_id,lease_token,lease_expires_at", [["id", input.runId], ["mission_id", input.missionId], ["task_id", input.taskId], ["owner_id", input.ownerId]]),
  ]);
  const leaseExpiry = Date.parse(str(run, "lease_expires_at") || "");
  if (str(mission, "id") !== input.missionId || str(mission, "owner_id") !== input.ownerId ||
      str(mission, "state") !== "running" ||
      str(task, "id") !== input.taskId || (str(task, "task_type") === "agents.tool_gates" || str(task, "task_type") === "agents.permissions") ||
      str(task, "mission_id") !== input.missionId || str(task, "owner_id") !== input.ownerId ||
      str(task, "status") !== "running" ||
      str(run, "id") !== input.runId || str(run, "mission_id") !== input.missionId ||
      str(run, "task_id") !== input.taskId || str(run, "owner_id") !== input.ownerId ||
      str(run, "status") !== "running" ||
      str(run, "worker_id") !== input.workerId || str(run, "lease_token") !== input.leaseToken ||
      !Number.isFinite(leaseExpiry) || leaseExpiry <= Date.now() ||
      !str(run, "approval_id")) fail("active mission, task, run or worker lease does not match");
  const approval = await one(serviceRoleDb, "nova_mission_approvals",
    "id,mission_id,task_id,owner_id,status,action_summary,decided_by,decided_at",
    [["id", str(run, "approval_id")], ["mission_id", input.missionId], ["task_id", input.taskId], ["owner_id", input.ownerId]]);
  if (str(approval, "id") !== str(run, "approval_id") ||
      str(approval, "status") !== "approved" || str(approval, "decided_by") !== input.ownerId ||
      !str(approval, "decided_at") || !str(approval, "action_summary")) {
    fail("owner approval is missing, rejected or not bound to this task");
  }
  const [toolPolicies, permissionPolicies] = await Promise.all([
    verifiedPolicies(serviceRoleDb, input.missionId, input.ownerId, TOOL_VERIFIER, "agents.tool_gates"),
    verifiedPolicies(serviceRoleDb, input.missionId, input.ownerId, PERMISSION_VERIFIER, "agents.permissions"),
  ]);
  const matches: Array<{ tool: VerifiedPolicy; permission: VerifiedPolicy }> = [];
  for (const tool of toolPolicies) {
    for (const permission of permissionPolicies) {
      if (str(tool.task, "id") === str(permission.task, "id") ||
          str(tool.task, "id") === input.taskId || str(permission.task, "id") === input.taskId) continue;
      const expected = await buildMissionToolPolicyApprovalSummary(
        tool.policy as Parameters<typeof buildMissionToolPolicyApprovalSummary>[0],
        permission.policy as Parameters<typeof buildMissionToolPolicyApprovalSummary>[1],
      );
      if (expected === str(approval, "action_summary")) matches.push({ tool, permission });
    }
  }
  if (matches.length !== 1) fail("owner approval must bind exactly one independently verified tool and permission policy pair");
  const { tool, permission } = matches[0];
  return {
    mission: { id: input.missionId, ownerId: input.ownerId, state: str(mission, "state") || "" },
    task: { id: input.taskId, missionId: input.missionId, ownerId: input.ownerId, taskType: str(task, "task_type") || "", status: str(task, "status") || "" },
    run: {
      id: input.runId, missionId: input.missionId, taskId: input.taskId, ownerId: input.ownerId,
      approvalId: str(run, "approval_id")!, status: str(run, "status") || "",
      workerId: str(run, "worker_id")!, leaseToken: str(run, "lease_token")!,
      leaseExpiresAt: str(run, "lease_expires_at")!,
    },
    approval: {
      id: str(approval, "id")!, missionId: input.missionId, taskId: input.taskId,
      ownerId: input.ownerId, status: str(approval, "status")!,
      actionSummary: str(approval, "action_summary")!,
    },
    policyProof: {
      id: str(tool.proof, "id")!, missionId: input.missionId, taskId: str(tool.proof, "task_id")!,
      ownerId: input.ownerId, taskType: "agents.tool_gates", status: str(tool.proof, "verification_status")!,
      outcome: str(tool.attestation, "outcome")!, verifierId: TOOL_VERIFIER, verifierVersion: VERIFIER_VERSION,
      runId: str(tool.attestation, "run_id")!, policy: tool.policy,
    },
    policyAttestation: {
      proofId: str(tool.attestation, "proof_id")!, missionId: input.missionId,
      taskId: str(tool.attestation, "task_id")!, ownerId: input.ownerId,
      runId: str(tool.attestation, "run_id")!, verifierId: TOOL_VERIFIER,
      verifierVersion: VERIFIER_VERSION, outcome: str(tool.attestation, "outcome")!,
    },
    permissionProof: {
      id: str(permission.proof, "id")!, missionId: input.missionId, taskId: str(permission.proof, "task_id")!,
      ownerId: input.ownerId, taskType: "agents.permissions", status: str(permission.proof, "verification_status")!,
      outcome: str(permission.attestation, "outcome")!, verifierId: PERMISSION_VERIFIER, verifierVersion: VERIFIER_VERSION,
      runId: str(permission.attestation, "run_id")!, policy: permission.policy,
    },
    permissionAttestation: {
      proofId: str(permission.attestation, "proof_id")!, missionId: input.missionId,
      taskId: str(permission.attestation, "task_id")!, ownerId: input.ownerId,
      runId: str(permission.attestation, "run_id")!, verifierId: PERMISSION_VERIFIER,
      verifierVersion: VERIFIER_VERSION, outcome: str(permission.attestation, "outcome")!,
    },
  };
}

/** The reservation RPC is the final database-side lease/idempotency fence. */
export async function reserveMissionToolAction(
  serviceRoleDb: MissionServiceRoleDatabase,
  args: { runId: string; leaseToken: string; actionKey: string; requestDigest: string },
): Promise<MissionToolReservation> {
  if (!UUID.test(args.runId) || !UUID.test(args.leaseToken) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(args.actionKey) ||
      !/^[a-f0-9]{64}$/.test(args.requestDigest)) {
    throw new Error("Trusted action reservation arguments are malformed");
  }
  const result = await serviceRoleDb.rpc("nova_reserve_mission_action", {
    p_run_id: args.runId,
    p_lease_token: args.leaseToken,
    p_action_key: args.actionKey,
    p_request_digest: args.requestDigest,
  });
  if (result.error || !Array.isArray(result.data) || result.data.length !== 1) {
    throw new Error("Trusted action reservation RPC failed or returned an invalid result");
  }
  const row = record(result.data[0]);
  const actionId = row && str(row, "action_id");
  const status = row && str(row, "action_status");
  if (!actionId || !UUID.test(actionId) ||
      !["reserved", "completed", "uncertain"].includes(status || "") ||
      typeof row?.replayed !== "boolean") {
    throw new Error("Trusted action reservation RPC response is malformed");
  }
  return { actionId, status: status as MissionToolReservation["status"], replayed: row.replayed as boolean };
}
