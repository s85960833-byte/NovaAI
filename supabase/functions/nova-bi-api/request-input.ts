export class RequestInputError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RequestInputError";
    this.status = status;
  }
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    throw new RequestInputError("Request body must be valid JSON", 400);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RequestInputError("Request body must be a JSON object", 400);
  }
  return parsed as Record<string, unknown>;
}
