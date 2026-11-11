import { hasExactTrustedMissionProofRequestShape } from "./mission-proof-request.ts";

Deno.test("accepts only the exact trusted proof request contract", () => {
  const valid = {
    envelope: { schema_version: "nova.proof.v1" },
    worker_id: "worker-01",
    lease_token: "33333333-3333-4333-8333-333333333333",
  };
  if (!hasExactTrustedMissionProofRequestShape(valid)) {
    throw new Error("Valid proof request shape was rejected");
  }
});

Deno.test("rejects missing, extra, array and primitive trusted proof request bodies", () => {
  const invalid: unknown[] = [
    { envelope: {}, worker_id: "worker-01" },
    { envelope: {}, worker_id: "worker-01", lease_token: "lease", extra: true },
    { envelope: {}, worker_id: "worker-01", lease_token: "lease", debug: "override" },
    [],
    null,
    "not-an-object",
    42,
  ];
  for (const value of invalid) {
    if (hasExactTrustedMissionProofRequestShape(value)) {
      throw new Error("Invalid proof request shape was accepted");
    }
  }
});

Deno.test("rejects prototype-like extra JSON keys", () => {
  const value = JSON.parse('{"envelope":{},"worker_id":"worker-01","lease_token":"lease","__proto__":{"admin":true}}');
  if (hasExactTrustedMissionProofRequestShape(value)) {
    throw new Error("Prototype-like extra request key was accepted");
  }
});
