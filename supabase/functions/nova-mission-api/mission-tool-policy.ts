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

const ALLOWED_TOOLS = new Set([
  "files.read", "files.write", "repo.read", "repo.write", "browser.read",
  "browser.submit", "database.read", "database.write", "email.send",
  "payments.create", "deployment.deploy",
]);
const SIDE_EFFECT_TOOLS = new Set([
  "files.write", "repo.write", "browser.submit", "database.write",
  "email.send", "payments.create", "deployment.deploy",
]);
const SAFE_REF = /^[a-z][a-z0-9_-]{1,63}$/;

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

export function validateMissionToolScope(scope: unknown): scope is MissionToolGate["scope"] {
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
      !validateMissionToolScope(raw.scope) ||
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
