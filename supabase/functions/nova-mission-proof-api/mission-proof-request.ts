export function hasExactTrustedMissionProofRequestShape(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const keys = Object.keys(input);
  const required = ["envelope", "worker_id", "lease_token"];
  return keys.length === required.length && required.every((key) =>
    Object.prototype.hasOwnProperty.call(input, key)
  );
}
