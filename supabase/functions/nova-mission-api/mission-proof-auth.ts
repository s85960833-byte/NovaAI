import { canonicalizeMissionProof } from "./mission-proof.ts";

export interface VerifierSignatureInput {
  secret: string;
  timestamp: string;
  nonce: string;
  workerId: string;
  leaseToken: string;
  envelope: unknown;
  signature: string;
  nowSeconds?: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

export interface TrustedMissionVerifier {
  version: string;
  secret: string;
}

/** Resolve only an explicitly configured own property; never trust inherited object keys. */
export function resolveMissionVerifierConfig(
  raw: string,
  verifierId: string,
  verifierVersion: string,
): TrustedMissionVerifier | null {
  if (!raw || raw.length > 16_384 || !verifierId || verifierId.length > 80 ||
      !verifierVersion || verifierVersion.length > 40) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const config = parsed as Record<string, unknown>;
  if (!Object.hasOwn(config, verifierId)) return null;
  const candidate = config[verifierId];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const entry = candidate as Record<string, unknown>;
  const keys = Object.keys(entry).sort();
  if (keys.length !== 2 || keys[0] !== "secret" || keys[1] !== "version" ||
      typeof entry.version !== "string" || entry.version !== verifierVersion ||
      typeof entry.secret !== "string" || entry.secret.length < 32 || entry.secret.length > 4096) {
    return null;
  }
  return { version: entry.version, secret: entry.secret };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

/**
 * Authenticates a verifier service, not the truth of its claims.
 * The caller must still run an independently reviewed verifier over inspectable evidence.
 */
export async function verifyMissionVerifierSignature(input: VerifierSignatureInput): Promise<boolean> {
  if (!input.secret || input.secret.length < 32 ||
      !/^\d{10}$/.test(input.timestamp) ||
      !UUID.test(input.nonce) ||
      !UUID.test(input.leaseToken) ||
      !/^[A-Za-z0-9._:-]{1,120}$/.test(input.workerId) ||
      !/^[a-f0-9]{64}$/i.test(input.signature)) return false;

  const timestamp = Number(input.timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > 300) return false;

  let canonicalEnvelope: string;
  try {
    canonicalEnvelope = canonicalizeMissionProof(input.envelope);
  } catch {
    return false;
  }
  const message = JSON.stringify([input.timestamp, input.nonce, input.workerId, input.leaseToken, canonicalEnvelope]);
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(input.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return constantTimeEqual(toHex(new Uint8Array(mac)), input.signature.toLowerCase());
}
