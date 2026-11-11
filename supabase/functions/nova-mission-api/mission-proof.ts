import { validateMissionToolPolicy, type MissionToolPolicy } from "./mission-tool-policy.ts";

export interface MissionProofEnvelope {
  schema_version: "nova.proof.v1";
  mission_id: string;
  task_id: string;
  run_id: string;
  verifier_id: string;
  verifier_version: string;
  observed_at: string;
  outcome: "passed" | "failed";
  checks: Array<{ id: string; passed: boolean; detail?: string }>;
  tool_policy?: MissionToolPolicy;
}

export interface MissionProofBinding {
  missionId: string;
  taskId: string;
  runId: string;
  verifierId: string;
  verifierVersion: string;
}

export interface MissionProofVerification {
  valid: boolean;
  digest: string | null;
  reason: string | null;
  verifierId: string | null;
  verifierVersion: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES = 50_000;
const MAX_CHECKS = 50;

function canonical(value: unknown, depth = 0): string {
  if (depth > 16) throw new TypeError("Proof evidence nesting is too deep");
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Proof evidence contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonical(item, depth + 1)).join(",") + "]";
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Proof evidence must contain plain JSON objects");
    }
    const record = value as Record<string, unknown>;
    return "{" + Object.keys(record).sort().map((key) =>
      JSON.stringify(key) + ":" + canonical(record[key], depth + 1)
    ).join(",") + "}";
  }
  throw new TypeError("Proof evidence contains a non-JSON value");
}

export function canonicalizeMissionProof(value: unknown): string {
  const result = canonical(value);
  if (new TextEncoder().encode(result).byteLength > MAX_BYTES) {
    throw new TypeError("Proof evidence exceeds 50 KB");
  }
  return result;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function invalid(reason: string): MissionProofVerification {
  return { valid: false, digest: null, reason, verifierId: null, verifierVersion: null };
}

/**
 * Validates the envelope's structure, task/run binding and deterministic digest.
 * This establishes integrity and scope, not the truth of an external-world claim.
 * Only a separately trusted adapter/verifier may decide that the checks are valid.
 */
export async function verifyMissionProofEnvelope(
  input: unknown,
  expected: MissionProofBinding,
): Promise<MissionProofVerification> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid("Evidence envelope must be an object");
  const value = input as Record<string, unknown>;
  if (value.schema_version !== "nova.proof.v1") return invalid("Unsupported proof schema");
  if (typeof value.mission_id !== "string" || !UUID.test(value.mission_id) ||
      typeof value.task_id !== "string" || !UUID.test(value.task_id) ||
      typeof value.run_id !== "string" || !UUID.test(value.run_id)) {
    return invalid("Proof mission, task and run identifiers must be UUIDs");
  }
  if (value.mission_id !== expected.missionId || value.task_id !== expected.taskId ||
      value.run_id !== expected.runId) return invalid("Proof is not bound to the expected mission, task and run");
  if (typeof value.verifier_id !== "string" || value.verifier_id.length < 1 || value.verifier_id.length > 80 ||
      value.verifier_id !== expected.verifierId) return invalid("Proof verifier identity does not match the trusted verifier");
  if (typeof value.verifier_version !== "string" || value.verifier_version.length < 1 || value.verifier_version.length > 40 ||
      value.verifier_version !== expected.verifierVersion) return invalid("Proof verifier version does not match the trusted verifier");
  if (value.verifier_id === "agents.tool-gates-policy") {
    if (!validateMissionToolPolicy(value.tool_policy)) return invalid("Trusted tool-gates proof must include a valid immutable tool policy snapshot");
  } else if (value.tool_policy !== undefined) {
    return invalid("Only the trusted tool-gates verifier may attach a tool policy snapshot");
  }
  if (typeof value.observed_at !== "string" || value.observed_at.length > 40 ||
      !Number.isFinite(Date.parse(value.observed_at))) return invalid("Proof observation timestamp is invalid");
  if (!Array.isArray(value.checks) || value.checks.length < 1 || value.checks.length > MAX_CHECKS) {
    return invalid("Proof must contain between 1 and 50 checks");
  }
  const ids = new Set<string>();
  for (const check of value.checks) {
    if (!check || typeof check !== "object" || Array.isArray(check)) return invalid("Proof check must be an object");
    const item = check as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.trim().length < 1 || item.id.length > 100 ||
        ids.has(item.id) || typeof item.passed !== "boolean" ||
        (item.detail !== undefined && (typeof item.detail !== "string" || item.detail.length > 1000))) {
      return invalid("Proof check fields are invalid or duplicated");
    }
    ids.add(item.id);
  }
  const checksPassed = value.checks.every((check) => (check as Record<string, unknown>).passed === true);
  if (value.outcome !== (checksPassed ? "passed" : "failed")) {
    return invalid("Proof outcome does not match its individual checks");
  }
  try {
    const serialized = canonicalizeMissionProof(value);
    return {
      valid: true,
      digest: await sha256(serialized),
      reason: null,
      verifierId: value.verifier_id,
      verifierVersion: value.verifier_version,
    };
  } catch (error) {
    return invalid(error instanceof Error ? error.message : "Proof evidence could not be canonicalized");
  }
}
