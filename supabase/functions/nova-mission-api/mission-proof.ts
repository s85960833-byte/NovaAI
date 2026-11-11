import { validateMissionToolPolicy, type MissionToolPolicy } from "./mission-tool-policy.ts";
import {
  validateMissionPermissionPolicy,
  type MissionPermissionPolicy,
} from "./mission-permission-policy.ts";

export interface MissionProofEnvelope {
  schema_version: "nova.proof.v2";
  output: Record<string, unknown>;
  mission_id: string;
  task_id: string;
  run_id: string;
  verifier_id: string;
  verifier_version: string;
  observed_at: string;
  outcome: "passed" | "failed";
  checks: Array<{ id: string; passed: boolean; detail?: string }>;
  tool_policy?: MissionToolPolicy;
  permission_policy?: MissionPermissionPolicy;
}


function cloneProofOutput(value: unknown, depth = 0, ancestors = new Set<object>()): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new TypeError("Task output must be a plain JSON object");
  }
  if (depth > 16 || ancestors.has(value)) throw new TypeError("Task output is too deep or cyclic");
  ancestors.add(value);
  try {
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) throw new TypeError("Task output cannot contain symbol keys");
    const copy: Record<string, unknown> = {};
    for (const key of keys as string[]) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") {
        throw new TypeError("Task output contains a prototype-sensitive key");
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
        throw new TypeError("Task output must contain enumerable data properties only");
      }
      const child = descriptor.value;
      if (child === null || typeof child === "string" || typeof child === "boolean" ||
          (typeof child === "number" && Number.isFinite(child))) {
        copy[key] = child;
      } else if (Array.isArray(child)) {
        if (Object.getPrototypeOf(child) !== Array.prototype || child.length > 50000) {
          throw new TypeError("Task output contains an invalid array");
        }
        const arrayKeys = Reflect.ownKeys(child);
        if (arrayKeys.some((item) => item !== "length" &&
            (typeof item !== "string" || !/^(0|[1-9]\d*)$/.test(item) || Number(item) >= child.length))) {
          throw new TypeError("Task output array contains extra properties");
        }
        const arrayCopy: unknown[] = [];
        for (let index = 0; index < child.length; index++) {
          const item = Object.getOwnPropertyDescriptor(child, String(index));
          if (!item || !item.enumerable || !("value" in item)) {
            throw new TypeError("Task output arrays must be dense data arrays");
          }
          const nested = item.value;
          if (nested && typeof nested === "object") {
            arrayCopy.push(cloneProofValue(nested, depth + 1, ancestors));
          } else if (nested === null || typeof nested === "string" || typeof nested === "boolean" ||
              (typeof nested === "number" && Number.isFinite(nested))) {
            arrayCopy.push(nested);
          } else {
            throw new TypeError("Task output contains a non-JSON value");
          }
        }
        copy[key] = arrayCopy;
      } else if (child && typeof child === "object") {
        copy[key] = cloneProofValue(child, depth + 1, ancestors);
      } else {
        throw new TypeError("Task output contains a non-JSON value");
      }
    }
    return copy;
  } finally {
    ancestors.delete(value);
  }
}

function cloneProofValue(value: unknown, depth: number, ancestors: Set<object>): unknown {
  if (depth > 16) throw new TypeError("Task output is too deep or cyclic");
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || value.length > 50000 ||
        ancestors.has(value)) throw new TypeError("Task output contains an invalid array");
    ancestors.add(value);
    try {
      const keys = Reflect.ownKeys(value);
      if (keys.some((key) => key !== "length" &&
          (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))) {
        throw new TypeError("Task output array contains extra properties");
      }
      const items: unknown[] = [];
      for (let i = 0; i < value.length; i++) {
        const d = Object.getOwnPropertyDescriptor(value, String(i));
        if (!d || !d.enumerable || !("value" in d)) throw new TypeError("Task output arrays must be dense");
        const v = d.value;
        if (v && typeof v === "object") items.push(cloneProofValue(v, depth + 1, ancestors));
        else if (v === null || typeof v === "string" || typeof v === "boolean" ||
            (typeof v === "number" && Number.isFinite(v))) items.push(v);
        else throw new TypeError("Task output contains a non-JSON value");
      }
      return items;
    } finally { ancestors.delete(value); }
  }
  return cloneProofOutput(value, depth, ancestors);
}

export type MissionProofEnvelopeFields = Omit<MissionProofEnvelope, "schema_version" | "output">;

/**
 * Builds a v2 envelope from the immutable execution result returned by the
 * task registry. Callers cannot supply or substitute a separate output value.
 */
export function createMissionProofEnvelope(
  fields: MissionProofEnvelopeFields,
  result: { readonly output: Readonly<Record<string, unknown>> },
): MissionProofEnvelope {
  if (!fields || typeof fields !== "object" || Array.isArray(fields) ||
      Object.prototype.hasOwnProperty.call(fields, "output")) {
    throw new TypeError("Proof fields must not supply a task output");
  }
  const output = cloneProofOutput(result?.output);
  canonicalizeMissionProof(output);
  const envelope = {
    schema_version: "nova.proof.v2" as const,
    ...fields,
    output,
  };
  // Reject accidental extra fields before a caller signs or persists the proof.
  const allowed = new Set([
    "schema_version", "mission_id", "task_id", "run_id", "verifier_id",
    "verifier_version", "observed_at", "outcome", "checks", "tool_policy",
    "permission_policy", "output",
  ]);
  if (Object.keys(envelope).some((key) => !allowed.has(key))) {
    throw new TypeError("Proof fields contain unsupported properties");
  }
  canonicalizeMissionProof(envelope);
  return envelope;
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
  const allowedEnvelopeKeys = new Set([
    "schema_version", "mission_id", "task_id", "run_id", "verifier_id", "output",
    "verifier_version", "observed_at", "outcome", "checks", "tool_policy",
    "permission_policy",
  ]);
  if (Object.keys(value).some((key) => !allowedEnvelopeKeys.has(key))) {
    return invalid("Proof envelope contains unsupported fields");
  }
  if (value.schema_version !== "nova.proof.v2") return invalid("Unsupported proof schema");
  if (typeof value.mission_id !== "string" || !UUID.test(value.mission_id) ||
      typeof value.task_id !== "string" || !UUID.test(value.task_id) ||
      typeof value.run_id !== "string" || !UUID.test(value.run_id)) {
    return invalid("Proof mission, task and run identifiers must be UUIDs");
  }
  if (value.mission_id !== expected.missionId || value.task_id !== expected.taskId ||
      value.run_id !== expected.runId) return invalid("Proof is not bound to the expected mission, task and run");
  if (!value.output || typeof value.output !== "object" || Array.isArray(value.output)) {
    return invalid("Proof must include the exact verified task output");
  }
  if (typeof value.verifier_id !== "string" || value.verifier_id.length < 1 || value.verifier_id.length > 80 ||
      value.verifier_id !== expected.verifierId) return invalid("Proof verifier identity does not match the trusted verifier");
  if (typeof value.verifier_version !== "string" || value.verifier_version.length < 1 || value.verifier_version.length > 40 ||
      value.verifier_version !== expected.verifierVersion) return invalid("Proof verifier version does not match the trusted verifier");
  if (value.verifier_id === "agents.tool-gates-policy") {
    if (!validateMissionToolPolicy(value.tool_policy)) return invalid("Trusted tool-gates proof must include a valid immutable tool policy snapshot");
  } else if (value.tool_policy !== undefined) {
    return invalid("Only the trusted tool-gates verifier may attach a tool policy snapshot");
  }
  if (value.verifier_id === "agents.permissions-least-privilege") {
    if (!validateMissionPermissionPolicy(value.permission_policy)) return invalid("Trusted permissions proof must include a valid immutable permission policy snapshot");
  } else if (value.permission_policy !== undefined) {
    return invalid("Only the trusted permissions verifier may attach a permission policy snapshot");
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
    if (Object.keys(item).some((key) => !["id", "passed", "detail"].includes(key))) {
      return invalid("Proof check contains unsupported fields");
    }
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
