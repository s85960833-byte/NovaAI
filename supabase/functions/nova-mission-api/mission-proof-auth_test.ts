import { resolveMissionVerifierConfig, verifyMissionVerifierSignature } from "./mission-proof-auth.ts";

const workerId = "nova-worker-v1";
const leaseToken = "55555555-5555-4555-8555-555555555555";
const nonce = "66666666-6666-4666-8666-666666666666";
const secret = "test-verifier-secret-that-is-at-least-32-bytes";
const envelope = {
  schema_version: "nova.proof.v1",
  mission_id: "11111111-1111-4111-8111-111111111111",
  task_id: "22222222-2222-4222-8222-222222222222",
  run_id: "33333333-3333-4333-8333-333333333333",
  verifier_id: "nova.integration",
  verifier_version: "1.0.0",
  observed_at: "2026-11-11T00:00:00.000Z",
  outcome: "passed",
  checks: [{ id: "evidence-reviewed", passed: true }],
};

async function sign(timestamp: string, value = envelope, signedNonce = nonce): Promise<string> {
  const { canonicalizeMissionProof } = await import("./mission-proof.ts");
  const message = JSON.stringify([timestamp, signedNonce, workerId, leaseToken, canonicalizeMissionProof(value)]);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(mac), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.test("accepts a fresh signature over the canonical proof and active lease binding", async () => {
  const timestamp = "1794355200";
  const signature = await sign(timestamp);
  const ok = await verifyMissionVerifierSignature({
    secret, timestamp, nonce, workerId, leaseToken, envelope, signature, nowSeconds: 1794355200,
  });
  if (!ok) throw new Error("Expected valid verifier signature");
});

Deno.test("rejects changed evidence, stale timestamps and malformed lease bindings", async () => {
  const timestamp = "1794355200";
  const signature = await sign(timestamp);
  const changed = { ...envelope, outcome: "failed" };
  const cases = [
    { secret, timestamp, nonce, workerId, leaseToken, envelope: changed, signature, nowSeconds: 1794355200 },
    { secret, timestamp, nonce, workerId, leaseToken, envelope, signature, nowSeconds: 1794355601 },
    { secret, timestamp, nonce, workerId, leaseToken: "not-a-uuid", envelope, signature, nowSeconds: 1794355200 },
  ];
  for (const input of cases) {
    if (await verifyMissionVerifierSignature(input)) throw new Error("Invalid verifier signature was accepted");
  }
});


Deno.test("trusted verifier config requires an explicit own key and exact schema", () => {
  const secret = "a-configured-secret-that-is-long-enough-for-hmac";
  const valid = JSON.stringify({
    "learn.topic-sequence-structure": { version: "1.0.0", secret },
  });
  const resolved = resolveMissionVerifierConfig(valid, "learn.topic-sequence-structure", "1.0.0");
  if (!resolved || resolved.secret !== secret) throw new Error("Expected explicitly configured verifier");

  for (const verifierId of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
    if (resolveMissionVerifierConfig(valid, verifierId, "1.0.0")) {
      throw new Error(`Inherited verifier key was accepted: ${verifierId}`);
    }
  }
  const invalidConfigs = [
    "{",
    "[]",
    "null",
    JSON.stringify({ "learn.topic-sequence-structure": { version: "2.0.0", secret } }),
    JSON.stringify({ "learn.topic-sequence-structure": { version: "1.0.0", secret, extra: true } }),
    JSON.stringify({ "learn.topic-sequence-structure": { version: "1.0.0", secret: "short" } }),
  ];
  for (const config of invalidConfigs) {
    if (resolveMissionVerifierConfig(config, "learn.topic-sequence-structure", "1.0.0")) {
      throw new Error("Malformed or unapproved verifier config was accepted");
    }
  }
});

Deno.test("binds the nonce to the verifier signature", async () => {
  const timestamp = "1794355200";
  const signature = await sign(timestamp);
  const alternateNonce = "77777777-7777-4777-8777-777777777777";
  const accepted = await verifyMissionVerifierSignature({
    secret, timestamp, nonce, workerId, leaseToken, envelope, signature, nowSeconds: 1794355200,
  });
  const replayWithDifferentNonce = await verifyMissionVerifierSignature({
    secret, timestamp, nonce: alternateNonce, workerId, leaseToken, envelope, signature, nowSeconds: 1794355200,
  });
  if (!accepted) throw new Error("Expected signature with original nonce to pass");
  if (replayWithDifferentNonce) throw new Error("Signature was accepted after nonce substitution");
});

