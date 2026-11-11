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


import {
  MissionProofRequestInputError,
  readTrustedMissionProofRequest,
} from "./mission-proof-request.ts";

Deno.test("bounded proof parser accepts a valid JSON object", async () => {
  const request = new Request("https://example.test/proof", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ envelope: {}, worker_id: "worker-01", lease_token: "lease" }),
  });
  const parsed = await readTrustedMissionProofRequest(request);
  if (parsed.worker_id !== "worker-01") throw new Error("Valid request was not parsed");
});

Deno.test("bounded proof parser returns 400 for empty, malformed and non-object bodies", async () => {
  const cases = [
    new Request("https://example.test/proof", { method: "POST" }),
    new Request("https://example.test/proof", { method: "POST", body: "{" }),
    new Request("https://example.test/proof", { method: "POST", body: "[]" }),
    new Request("https://example.test/proof", { method: "POST", body: "null" }),
  ];
  for (const request of cases) {
    try {
      await readTrustedMissionProofRequest(request);
      throw new Error("Invalid request body was accepted");
    } catch (error) {
      if (!(error instanceof MissionProofRequestInputError) || error.status !== 400) throw error;
    }
  }
});

Deno.test("bounded proof parser rejects invalid UTF-8 with 400", async () => {
  const request = new Request("https://example.test/proof", {
    method: "POST",
    body: new Uint8Array([0xff, 0xfe]),
  });
  try {
    await readTrustedMissionProofRequest(request);
    throw new Error("Invalid UTF-8 was accepted");
  } catch (error) {
    if (!(error instanceof MissionProofRequestInputError) || error.status !== 400) throw error;
  }
});

Deno.test("bounded proof parser returns 413 for declared oversized bodies", async () => {
  const request = new Request("https://example.test/proof", {
    method: "POST",
    headers: { "content-length": "101" },
    body: "{}",
  });
  try {
    await readTrustedMissionProofRequest(request, 100);
    throw new Error("Declared oversized body was accepted");
  } catch (error) {
    if (!(error instanceof MissionProofRequestInputError) || error.status !== 413) throw error;
  }
});

Deno.test("bounded proof parser returns 413 for streamed oversized bodies", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(101));
      controller.close();
    },
  });
  const request = new Request("https://example.test/proof", { method: "POST", body });
  try {
    await readTrustedMissionProofRequest(request, 100);
    throw new Error("Streamed oversized body was accepted");
  } catch (error) {
    if (!(error instanceof MissionProofRequestInputError) || error.status !== 413) throw error;
  }
});
