import { canonicalizeMissionProof, createMissionProofEnvelope, type MissionProofEnvelope } from "./mission-proof.ts";
import {
  MissionTaskRegistry,
  type MissionTaskDescriptor,
} from "./mission-task-registry.ts";

/**
 * One-shot worker orchestration boundary.
 *
 * This module deliberately does not poll, claim leases, start a process, or call
 * external tools. A trusted host must supply a previously claimed lease and
 * server-only persistence callbacks. Database lease fencing and proof nonce
 * idempotency remain authoritative across processes.
 */
export interface MissionWorkerClaim {
  missionId: string;
  taskId: string;
  runId: string;
  ownerId: string;
  workerId: string;
  leaseToken: string;
  taskType: string;
  inputSchemaVersion: number;
  input: Readonly<Record<string, unknown>>;
}

export interface MissionWorkerRuntimeDependencies {
  registry: MissionTaskRegistry;
  /** Re-check the exact lease against the database immediately before persistence. */
  assertLeaseCurrent(claim: MissionWorkerClaim): Promise<boolean>;
  /** Calls the trusted proof-ingress service; must not expose service credentials to task handlers. */
  persistProof(input: {
    claim: MissionWorkerClaim;
    envelope: MissionProofEnvelope;
  }): Promise<{ proofId: string; attestationId: string; digest: string }>;
}

export type MissionWorkerResult =
  | { status: "completed"; proofId: string; attestationId: string; digest: string }
  | { status: "denied"; reason: "invalid_claim" | "lease_not_current" | "task_not_registered" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKER_ID = /^[A-Za-z0-9._:-]{1,120}$/;
const inFlight = new Set<string>();

const CLAIM_KEYS = new Set([
  "missionId", "taskId", "runId", "ownerId", "workerId", "leaseToken",
  "taskType", "inputSchemaVersion", "input",
]);

function snapshotClaim(value: unknown): MissionWorkerClaim | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== CLAIM_KEYS.size ||
      keys.some((key) => typeof key !== "string" || !CLAIM_KEYS.has(key))) return null;
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) return null;
  }
  try {
    const snapshot: unknown = JSON.parse(canonicalizeMissionProof(value));
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
    return snapshot as MissionWorkerClaim;
  } catch {
    return null;
  }
}

function freezeClaim(value: MissionWorkerClaim): MissionWorkerClaim {
  const freeze = (item: unknown): void => {
    if (!item || typeof item !== "object" || Object.isFrozen(item)) return;
    for (const child of Object.values(item as Record<string, unknown>)) freeze(child);
    Object.freeze(item);
  };
  freeze(value);
  return value;
}

function validClaim(claim: MissionWorkerClaim): boolean {
  return !!claim && [claim.missionId, claim.taskId, claim.runId, claim.ownerId, claim.leaseToken]
    .every((value) => typeof value === "string" && UUID.test(value)) &&
    typeof claim.workerId === "string" && WORKER_ID.test(claim.workerId) &&
    typeof claim.taskType === "string" && /^[a-z][a-z0-9_.-]{1,79}$/.test(claim.taskType) &&
    Number.isSafeInteger(claim.inputSchemaVersion) && claim.inputSchemaVersion > 0 &&
    !!claim.input && typeof claim.input === "object" && !Array.isArray(claim.input);
}

/**
 * Executes exactly one already-authorized claim. Duplicate in-process run
 * attempts are rejected; cross-process duplicates are fenced by the DB lease
 * and proof-ingress nonce ledger. No automatic retry or external action occurs.
 */
export async function processClaimedMissionTask(
  claim: MissionWorkerClaim,
  dependencies: MissionWorkerRuntimeDependencies,
): Promise<MissionWorkerResult> {
  const snapshot = snapshotClaim(claim);
  if (!snapshot || !validClaim(snapshot) || !dependencies ||
      typeof dependencies.assertLeaseCurrent !== "function" ||
      typeof dependencies.persistProof !== "function" ||
      !(dependencies.registry instanceof MissionTaskRegistry)) {
    return { status: "denied", reason: "invalid_claim" };
  }
  // All asynchronous callbacks receive this immutable snapshot, never the
  // caller-owned claim object which could otherwise be mutated mid-execution.
  claim = freezeClaim(snapshot);

  const key = claim.runId;
  if (inFlight.has(key)) return { status: "denied", reason: "lease_not_current" };
  inFlight.add(key);
  try {
    if (!await dependencies.assertLeaseCurrent(claim)) {
      return { status: "denied", reason: "lease_not_current" };
    }

    const task: MissionTaskDescriptor = {
      id: claim.taskId,
      missionId: claim.missionId,
      runId: claim.runId,
      ownerId: claim.ownerId,
      taskType: claim.taskType,
      inputSchemaVersion: claim.inputSchemaVersion,
      input: claim.input,
    };

    let execution: Awaited<ReturnType<MissionTaskRegistry["executeAndVerify"]>>;
    try {
      execution = await dependencies.registry.executeAndVerify(task);
    } catch (error) {
      // Unknown task types are a normal fail-closed denial. Other handler or
      // verifier failures propagate so the host can record a bounded failure.
      if (error instanceof Error && error.name === "MissionTaskNotExecutableError") {
        return { status: "denied", reason: "task_not_registered" };
      }
      throw error;
    }

    if (!execution.verification.passed) {
      throw new Error("Mission task verifier did not pass; proof persistence refused");
    }
    // The lease may have expired while a handler was running. Never persist
    // completion under a stale claim.
    if (!await dependencies.assertLeaseCurrent(claim)) {
      return { status: "denied", reason: "lease_not_current" };
    }

    const envelope = createMissionProofEnvelope({
      mission_id: claim.missionId,
      task_id: claim.taskId,
      run_id: claim.runId,
      verifier_id: execution.verification.verifierId,
      verifier_version: execution.verification.verifierVersion,
      observed_at: execution.verification.observedAt,
      outcome: "passed",
      checks: execution.verification.checks.map((check) => ({ ...check })),
    }, { output: execution.result.output });

    const persisted = await dependencies.persistProof({ claim, envelope });
    if (!persisted || !UUID.test(persisted.proofId) ||
        !UUID.test(persisted.attestationId) || !/^[a-f0-9]{64}$/.test(persisted.digest)) {
      throw new Error("Trusted proof ingress returned an invalid persistence receipt");
    }
    return {
      status: "completed",
      proofId: persisted.proofId,
      attestationId: persisted.attestationId,
      digest: persisted.digest,
    };
  } finally {
    inFlight.delete(key);
  }
}
