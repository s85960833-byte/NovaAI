import { RequestInputError } from "../nova-bi-api/request-input.ts";

export type MissionWorkspace = "learn" | "build" | "agents" | "intelligence";

export interface MissionInput {
  title: string;
  description: string;
  workspace: MissionWorkspace;
  idempotencyKey: string | null;
  plan: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function validateMissionInput(value: unknown): MissionInput {
  if (!isRecord(value)) {
    throw new RequestInputError("Mission request must be a JSON object", 400);
  }

  const allowedFields = new Set(["title", "description", "workspace", "idempotency_key", "plan"]);
  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    throw new RequestInputError("Mission request contains unsupported fields", 400);
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (title.length < 1 || title.length > 200) {
    throw new RequestInputError("Mission title must be 1 to 200 characters", 400);
  }

  const description = value.description === undefined ? "" : value.description;
  if (typeof description !== "string" || description.length > 10000) {
    throw new RequestInputError("Mission description must be a string up to 10000 characters", 400);
  }

  const workspace = value.workspace === undefined ? "agents" : value.workspace;
  if (!["learn", "build", "agents", "intelligence"].includes(String(workspace))) {
    throw new RequestInputError("Unsupported NOVA workspace", 400);
  }

  const rawKey = value.idempotency_key;
  const idempotencyKey = rawKey === undefined || rawKey === null ? null : rawKey;
  if (idempotencyKey !== null &&
      (typeof idempotencyKey !== "string" ||
       idempotencyKey.trim().length < 1 ||
       idempotencyKey.trim().length > 160)) {
    throw new RequestInputError("Idempotency key must be 1 to 160 characters", 400);
  }

  const rawPlan = value.plan === undefined ? {} : value.plan;
  if (!isRecord(rawPlan)) {
    throw new RequestInputError("Mission plan must be a JSON object", 400);
  }
  let planBytes = 0;
  try {
    planBytes = new TextEncoder().encode(JSON.stringify(rawPlan)).byteLength;
  } catch {
    throw new RequestInputError("Mission plan must be valid JSON data", 400);
  }
  if (planBytes > 100000) {
    throw new RequestInputError("Mission plan is too large", 413);
  }

  return {
    title,
    description,
    workspace: workspace as MissionWorkspace,
    idempotencyKey: idempotencyKey === null ? null : (idempotencyKey as string).trim(),
    plan: rawPlan,
  };
}
