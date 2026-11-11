import { canonicalizeMissionProof } from "./mission-proof.ts";
import {
  validateMissionToolPolicy,
  validateMissionToolScope,
  type MissionToolGate,
  type MissionToolPolicy,
} from "./mission-tool-policy.ts";
import {
  validateMissionPermissionPolicy,
  type MissionPermissionPolicy,
} from "./mission-permission-policy.ts";
export type { MissionToolGate, MissionToolPolicy } from "./mission-tool-policy.ts";
export type { MissionPermissionPolicy } from "./mission-permission-policy.ts";

const SHA256 = /^[a-f0-9]{64}$/;

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
  permissionProof: { id: string; missionId: string; taskId: string; ownerId: string; taskType: string; status: string; outcome: string; verifierId: string; verifierVersion: string; runId: string; policy: unknown };
  permissionAttestation: { proofId: string; missionId: string; taskId: string; ownerId: string; runId: string; verifierId: string; verifierVersion: string; outcome: string };
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

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function missionToolPolicyDigest(policy: MissionToolPolicy): Promise<string> {
  return await sha256(canonicalizeMissionProof(policy));
}

/** Approval binds both independently verified policy snapshots by digest. */
export async function buildMissionToolPolicyApprovalSummary(
  policy: MissionToolPolicy,
  permissions: MissionPermissionPolicy,
): Promise<string> {
  const toolDigest = await missionToolPolicyDigest(policy);
  const permissionDigest = await sha256(canonicalizeMissionProof(permissions));
  const lines = policy.gates.map((gate) =>
    `T|${gate.tool}|${gate.operation}|${gate.scope.kind}:${gate.scope.ref}|${gate.risk}|${gate.approvalRequired ? "A" : "-"}`
  );
  const permissionLines = permissions.permissions.map((permission) =>
    `P|${permission.id}|${permission.scope.kind}:${permission.scope.ref}|${permission.actions.join(",")}|${permission.approvalRequired ? "A" : "-"}`
  );
  const summary = [
    "NOVA_TOOL_AND_PERMISSION_POLICY_V1",
    `Tool policy digest: ${toolDigest}`,
    `Permission policy digest: ${permissionDigest}`,
    "Allowed tool actions:",
    ...lines,
    "Granted permission actions:",
    ...permissionLines,
  ].join("\n");
  if (summary.length > 2000) {
    throw new TypeError("Combined tool and permission approval summary exceeds the database limit");
  }
  return summary;
}

type MissionPermissionAction = "read" | "send" | "create" | "update" | "delete" | "execute" | "publish" | "export";

function requiredPermissionAction(tool: string, operation: string): MissionPermissionAction | null {
  if (operation === "read" && tool.endsWith(".read")) return "read";
  if (operation === "write" && tool.endsWith(".write")) return "update";
  if (tool === "browser.submit" && operation === "submit") return "publish";
  if (tool === "email.send" && operation === "send") return "send";
  if (tool === "payments.create" && operation === "create") return "create";
  if (tool === "deployment.deploy" && operation === "deploy") return "execute";
  return null;
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
      context.task.taskType === "agents.permissions" ||
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
  if (!policyProof.id || !policyProof.taskId || !policyProof.runId ||
      policyProof.missionId !== context.mission.id ||
      policyProof.ownerId !== context.mission.ownerId ||
      policyProof.taskType !== "agents.tool_gates" ||
      policyProof.taskId === context.task.id ||
      policyProof.status !== "passed" || policyProof.outcome !== "passed" ||
      policyProof.verifierId !== "agents.tool-gates-policy" ||
      policyProof.verifierVersion !== "1.0.0" ||
      !attestation.proofId || attestation.proofId !== policyProof.id ||
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

  const permissionProof = context.permissionProof;
  const permissionAttestation = context.permissionAttestation;
  if (!permissionProof.id || !permissionProof.taskId || !permissionProof.runId ||
      permissionProof.missionId !== context.mission.id ||
      permissionProof.ownerId !== context.mission.ownerId ||
      permissionProof.taskType !== "agents.permissions" ||
      permissionProof.taskId === context.task.id ||
      permissionProof.taskId === policyProof.taskId ||
      permissionProof.status !== "passed" || permissionProof.outcome !== "passed" ||
      permissionProof.verifierId !== "agents.permissions-least-privilege" ||
      permissionProof.verifierVersion !== "1.0.0" ||
      !permissionAttestation.proofId || permissionAttestation.proofId !== permissionProof.id ||
      permissionAttestation.missionId !== permissionProof.missionId ||
      permissionAttestation.taskId !== permissionProof.taskId ||
      permissionAttestation.ownerId !== permissionProof.ownerId ||
      permissionAttestation.runId !== permissionProof.runId ||
      permissionAttestation.verifierId !== permissionProof.verifierId ||
      permissionAttestation.verifierVersion !== permissionProof.verifierVersion ||
      permissionAttestation.outcome !== "passed") {
    return denied("A matching passing, trusted permission-policy attestation is required");
  }
  if (!validateMissionPermissionPolicy(permissionProof.policy)) {
    return denied("Stored permission policy is invalid");
  }
  const permissions = permissionProof.policy;
  const policyDigest = await missionToolPolicyDigest(policy);
  const expectedSummary = await buildMissionToolPolicyApprovalSummary(policy, permissions);
  if (context.approval.actionSummary !== expectedSummary) {
    return denied("Owner approval is not bound to this exact tool policy");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(request.actionKey) ||
      !SHA256.test(request.requestDigest) ||
      !validateMissionToolScope(request.scope)) return denied("Tool action request is malformed");
  const gate = policy.gates.find((item) =>
    item.tool === request.tool && item.operation === request.operation &&
    item.scope.kind === request.scope.kind && item.scope.ref === request.scope.ref
  );
  if (!gate) return denied("No approved tool gate matches this exact action and scope");
  const permissionAction = requiredPermissionAction(request.tool, request.operation);
  if (!permissionAction) return denied("Tool operation has no explicit permission-action mapping");
  const permission = permissions.permissions.find((item) =>
    item.scope.kind === request.scope.kind && item.scope.ref === request.scope.ref &&
    item.actions.includes(permissionAction)
  );
  if (!permission) return denied("No matching permission grant authorizes this exact action and scope");
  if ((gate.approvalRequired || permission.approvalRequired) &&
      context.approval.status !== "approved") {
    return denied("The exact tool and permission action requires owner approval");
  }
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
