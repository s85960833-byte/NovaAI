import { canonicalizeMissionProof } from "./mission-proof.ts";

const ALLOWED_TOOLS = new Set([
  "files.read", "files.write", "repo.read", "repo.write", "browser.read",
  "browser.submit", "database.read", "database.write", "email.send",
  "payments.create", "deployment.deploy",
]);
const SIDE_EFFECT_TOOLS = new Set([
  "files.write", "repo.write", "browser.submit", "database.write",
  "email.send", "payments.create", "deployment.deploy",
]);
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_REF = /^[a-z][a-z0-9_-]{1,63}$/;

export interface MissionToolGate {
  id: string;
  tool: string;
  operation: string;
  scope: { kind: "workspace" | "project" | "resource"; ref: string };
  risk: "low" | "elevated" | "high";
  approvalRequired: boolean;
  credentialBoundary: "none" | "user_session";
  reason: string;
  sourceRefIds: string[];
}

export interface MissionToolPolicy {
  version: 1;
  gates: readonly MissionToolGate[];
}

export interface MissionToolActionRequest {
  actionKey: string;
  tool: string;
  operation: string;
  scope: { kind: "workspace" | "project" | "resource"; ref: string };
  requestDigest: string;
}

export interface MissionToolGatewayContext {
  now?: Date;
  mission: { id: string; ownerId: string; state: string };
  task: { id: string; missionId: string; ownerId: string; taskType: string; status: string };
  run: { id: string; missionId: string; taskId: string; ownerId: string; approvalId: string; status: string; workerId: string; leaseToken: string; leaseExpiresAt: string };
  approval: { id: string; missionId: string; taskId: string; ownerId: string; status: string; actionSummary: string };
  policyProof: { id: string; missionId: string; taskId: string; ownerId: string; taskType: string; status: string; outcome: string; verifierId: string; verifierVersion: string; runId: string; policy: unknown };
  policyAttestation: { proofId: string; missionId: string; taskId: string; ownerId: string; runId: string; verifierId: string; verifierVersion: string; outcome: string };
}

export interface MissionToolReservation {
  actionId: string;
  status: "reserved" | "completed" | "uncertain";
  replayed: boolean;
}

export type MissionToolGatewayResult =
  | { authorized: true; executeNow: true; actionId: string; policyDigest: string; actionDigest: string }
  | { authorized: true; executeNow: false; actionId: string; status: "completed" | "reserved" | "uncertain"; reason: string; policyDigest: string }
  | { authorized: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, i) => key === expected[i]);
}

function operationMatches(tool: string, operation: string): boolean {
  return (tool.endsWith(".read") && operation === "read") ||
    (tool.endsWith(".write") && operation === "write") ||
    (tool === "browser.submit" && operation === "submit") ||
    (tool === "email.send" && operation === "send") ||
    (tool === "payments.create" && operation === "create") ||
    (tool === "deployment.deploy" && operation === "deploy");
}

function scopeValid(scope: unknown): scope is MissionToolGate["scope"] {
  if (!isRecord(scope) || !exactKeys(scope, ["kind", "ref"]) ||
      typeof scope.kind !== "string" ||
      !["workspace", "project", "resource"].includes(scope.kind) ||
      typeof scope.ref !== "string") return false;
  return scope.kind === "workspace"
    ? scope.ref === "current-workspace"
    : SAFE_REF.test(scope.ref) && !["all", "global"].includes(scope.ref);
}

export function validateMissionToolPolicy(value: unknown): value is MissionToolPolicy {
  if (!isRecord(value) || !exactKeys(value, ["version", "gates"]) ||
      value.version !== 1 || !Array.isArray(value.gates) ||
      value.gates.length < 1 || value.gates.length > 20) return false;
  const ids = new Set<string>();
  for (const raw of value.gates) {
    if (!isRecord(raw) || !exactKeys(raw, [
      "id", "tool", "operation", "scope", "risk", "approvalRequired",
      "credentialBoundary", "reason", "sourceRefIds",
    ]) ||
      typeof raw.id !== "string" || !/^[a-z][a-z0-9_-]{1,39}$/.test(raw.id) ||
      ids.has(raw.id) ||
      typeof raw.tool !== "string" || !ALLOWED_TOOLS.has(raw.tool) ||
      typeof raw.operation !== "string" || !operationMatches(raw.tool, raw.operation) ||
      !scopeValid(raw.scope) ||
      typeof raw.risk !== "string" || !["low", "elevated", "high"].includes(raw.risk) ||
      typeof raw.approvalRequired !== "boolean" ||
      typeof raw.credentialBoundary !== "string" ||
      !["none", "user_session"].includes(raw.credentialBoundary) ||
      typeof raw.reason !== "string" || raw.reason.trim().length < 10 || raw.reason.length > 300 ||
      !Array.isArray(raw.sourceRefIds) || raw.sourceRefIds.length !== 1 ||
      raw.sourceRefIds[0] !== "mission-input") return false;
    const needsApproval = SIDE_EFFECT_TOOLS.has(raw.tool) ||
      raw.risk === "elevated" || raw.risk === "high";
    if (needsApproval && raw.approvalRequired !== true) return false;
    ids.add(raw.id);
  }
  return true;
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function missionToolPolicyDigest(policy: MissionToolPolicy): Promise<string> {
  return await sha256(canonicalizeMissionProof(policy));
}

/** Human-readable approval text is cryptographically bound to the exact gate policy. */
export async function buildMissionToolPolicyApprovalSummary(policy: MissionToolPolicy): Promise<string> {
  const digest = await missionToolPolicyDigest(policy);
  const lines = policy.gates.map((gate) =>
    `- ${gate.tool} | ${gate.operation} | ${gate.scope.kind}:${gate.scope.ref} | ${gate.risk} | owner approval: ${gate.approvalRequired ? "required" : "not required"}`
  );
  return [
    "NOVA_TOOL_POLICY_V1",
    `Policy digest: ${digest}`,
    "Allowed tool actions:",
    ...lines,
  ].join("\n");
}

function denied(reason: string): MissionToolGatewayResult {
  return { authorized: false, reason };
}

/**
 * Fail-closed authorization preflight. The context MUST be loaded from trusted
 * service-role reads; the callback MUST call nova_reserve_mission_action.
 * This function never invokes a tool or performs an external side effect.
 */
export async function authorizeMissionToolAction(
  context: MissionToolGatewayContext,
  request: MissionToolActionRequest,
  reserveAction: (args: {
    runId: string;
    leaseToken: string;
    actionKey: string;
    requestDigest: string;
  }) => Promise<MissionToolReservation>,
): Promise<MissionToolGatewayResult> {
  const now = context.now ?? new Date();
  const expiresAt = Date.parse(context.run.leaseExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return denied("Worker lease is expired or invalid");
  if (context.mission.state !== "running" || context.task.status !== "running" ||
      context.run.status !== "running" || context.approval.status !== "approved") {
    return denied("Mission, task, run and owner approval must all be active");
  }
  if (context.task.taskType === "agents.tool_gates" ||
      context.task.missionId !== context.mission.id ||
      context.task.ownerId !== context.mission.ownerId ||
      context.run.missionId !== context.mission.id ||
      context.run.taskId !== context.task.id ||
      context.run.ownerId !== context.mission.ownerId ||
      context.approval.id !== context.run.approvalId ||
      context.approval.missionId !== context.mission.id ||
      context.approval.taskId !== context.task.id ||
      context.approval.ownerId !== context.mission.ownerId ||
      !context.run.workerId.trim() || !context.run.leaseToken) {
    return denied("Mission, task, owner, run or approval binding does not match");
  }
  const policyProof = context.policyProof;
  const attestation = context.policyAttestation;
  if (policyProof.missionId !== context.mission.id ||
      policyProof.ownerId !== context.mission.ownerId ||
      policyProof.taskType !== "agents.tool_gates" ||
      policyProof.status !== "passed" || policyProof.outcome !== "passed" ||
      policyProof.verifierId !== "agents.tool-gates-policy" ||
      policyProof.verifierVersion !== "1.0.0" ||
      attestation.proofId !== policyProof.id ||
      attestation.missionId !== policyProof.missionId ||
      attestation.taskId !== policyProof.taskId ||
      attestation.ownerId !== policyProof.ownerId ||
      attestation.runId !== policyProof.runId ||
      attestation.verifierId !== policyProof.verifierId ||
      attestation.verifierVersion !== policyProof.verifierVersion ||
      attestation.outcome !== "passed") {
    return denied("A matching passing, trusted tool-policy attestation is required");
  }
  if (!validateMissionToolPolicy(policyProof.policy)) return denied("Stored tool policy is invalid");
  const policy = policyProof.policy;
  const policyDigest = await missionToolPolicyDigest(policy);
  const expectedSummary = await buildMissionToolPolicyApprovalSummary(policy);
  if (context.approval.actionSummary !== expectedSummary) {
    return denied("Owner approval is not bound to this exact tool policy");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(request.actionKey) ||
      !SHA256.test(request.requestDigest) ||
      !scopeValid(request.scope)) return denied("Tool action request is malformed");
  const gate = policy.gates.find((item) =>
    item.tool === request.tool && item.operation === request.operation &&
    item.scope.kind === request.scope.kind && item.scope.ref === request.scope.ref
  );
  if (!gate) return denied("No approved tool gate matches this exact action and scope");
  if (gate.credentialBoundary === "none" && request.tool !== "files.read" &&
      request.tool !== "repo.read" && request.tool !== "browser.read" &&
      request.tool !== "database.read") {
    return denied("This tool requires an explicit user-session credential boundary");
  }
  const actionDigest = await sha256(canonicalizeMissionProof({
    schema: "nova.tool-action.v1",
    policyDigest,
    tool: request.tool,
    operation: request.operation,
    scope: request.scope,
    requestDigest: request.requestDigest,
  }));
  let reservation: MissionToolReservation;
  try {
    reservation = await reserveAction({
      runId: context.run.id,
      leaseToken: context.run.leaseToken,
      actionKey: request.actionKey,
      requestDigest: actionDigest,
    });
  } catch {
    return denied("The database rejected the action reservation; no tool may run");
  }
  if (!reservation || typeof reservation.actionId !== "string" ||
      !["reserved", "completed", "uncertain"].includes(reservation.status)) {
    return denied("The action reservation response is invalid");
  }
  if (reservation.replayed || reservation.status !== "reserved") {
    return {
      authorized: true,
      executeNow: false,
      actionId: reservation.actionId,
      status: reservation.status,
      reason: reservation.status === "completed"
        ? "This exact action was already completed; do not execute it again"
        : reservation.status === "uncertain"
        ? "This action has an uncertain outcome and requires reconciliation"
        : "This action key already has a reservation; do not execute it again",
      policyDigest,
    };
  }
  return {
    authorized: true,
    executeNow: true,
    actionId: reservation.actionId,
    policyDigest,
    actionDigest,
  };
}
