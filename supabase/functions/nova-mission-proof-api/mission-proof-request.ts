export class MissionProofRequestInputError extends Error {
  constructor(message: string, readonly status: 400 | 413) {
    super(message);
    this.name = "MissionProofRequestInputError";
  }
}

export async function readTrustedMissionProofRequest(
  request: Request,
  maxBytes = 70_000,
): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (!Number.isSafeInteger(declared) || declared < 0) {
    throw new MissionProofRequestInputError("Request content length is invalid", 400);
  }
  if (declared > maxBytes) {
    throw new MissionProofRequestInputError("Request body is too large", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new MissionProofRequestInputError("Request body is required", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new MissionProofRequestInputError("Request body is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new MissionProofRequestInputError("Request body must be valid UTF-8 JSON", 400);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new MissionProofRequestInputError("Request body must be a JSON object", 400);
  }
  return parsed as Record<string, unknown>;
}

export function hasExactTrustedMissionProofRequestShape(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const keys = Object.keys(input);
  const required = ["envelope", "worker_id", "lease_token"];
  return keys.length === required.length && required.every((key) =>
    Object.prototype.hasOwnProperty.call(input, key)
  );
}
