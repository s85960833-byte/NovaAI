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
