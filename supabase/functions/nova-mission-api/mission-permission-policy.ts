export interface MissionPermission {
  id: string;
  scope: { kind: "workspace" | "project" | "resource"; ref: string };
  actions: readonly ("read" | "create" | "update" | "delete" | "execute" | "publish" | "send" | "export")[];
  approvalRequired: boolean;
  reason: string;
  sourceRefIds: readonly ["mission-input"];
}

export interface MissionPermissionPolicy {
  permissions: readonly MissionPermission[];
}

const ACTIONS = new Set([
  "read", "create", "update", "delete", "execute", "publish", "send", "export",
]);
const SENSITIVE_ACTIONS = new Set(["delete", "execute", "publish", "send", "export"]);
const UUID_LIKE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_SCOPE_REF = /^[a-z][a-z0-9_-]{1,47}$/;

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

export function validateMissionPermissionScope(
  value: unknown,
): value is MissionPermission["scope"] {
  if (!isRecord(value) || !exactKeys(value, ["kind", "ref"]) ||
      typeof value.kind !== "string" ||
      !["workspace", "project", "resource"].includes(value.kind) ||
      typeof value.ref !== "string") return false;
  return value.kind === "workspace"
    ? value.ref === "current-workspace"
    : SAFE_SCOPE_REF.test(value.ref) && !["all", "global", "*"].includes(value.ref);
}

/** Strict runtime counterpart of the agents.permissions verifier output. */
export function validateMissionPermissionPolicy(value: unknown): value is MissionPermissionPolicy {
  if (!isRecord(value) || !exactKeys(value, ["permissions"]) ||
      !Array.isArray(value.permissions) ||
      value.permissions.length < 1 || value.permissions.length > 20) return false;
  const ids = new Set<string>();
  for (const raw of value.permissions) {
    if (!isRecord(raw) || !exactKeys(raw, [
      "id", "scope", "actions", "approvalRequired", "reason", "sourceRefIds",
    ]) ||
        typeof raw.id !== "string" || !UUID_LIKE_ID.test(raw.id) || ids.has(raw.id) ||
        !validateMissionPermissionScope(raw.scope) ||
        !Array.isArray(raw.actions) || raw.actions.length < 1 || raw.actions.length > 8 ||
        typeof raw.approvalRequired !== "boolean" ||
        typeof raw.reason !== "string" || raw.reason.trim().length < 10 || raw.reason.length > 300 ||
        !Array.isArray(raw.sourceRefIds) || raw.sourceRefIds.length !== 1 ||
        raw.sourceRefIds[0] !== "mission-input") return false;
    const actions = raw.actions;
    if (new Set(actions).size !== actions.length ||
        !actions.every((action) => typeof action === "string" && ACTIONS.has(action))) return false;
    if (actions.some((action) => SENSITIVE_ACTIONS.has(action)) &&
        raw.approvalRequired !== true) return false;
    ids.add(raw.id);
  }
  return true;
}
