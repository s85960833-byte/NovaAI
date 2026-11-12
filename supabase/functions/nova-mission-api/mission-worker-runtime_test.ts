import {
  processClaimedMissionTask,
  type MissionWorkerClaim,
} from "./mission-worker-runtime.ts";
import { MissionTaskRegistry, type MissionTaskInputSchema } from "./mission-task-registry.ts";

const claim: MissionWorkerClaim = {
  missionId: "11111111-1111-4111-8111-111111111111",
  taskId: "22222222-2222-4222-8222-222222222222",
  runId: "33333333-3333-4333-8333-333333333333",
  ownerId: "44444444-4444-4444-8444-444444444444",
  workerId: "worker.test-1",
  leaseToken: "55555555-5555-4555-8555-555555555555",
  taskType: "test.safe-check",
  inputSchemaVersion: 1,
  input: {},
};
const schema: MissionTaskInputSchema = {
  version: 1,
  validate(value): value is Readonly<Record<string, unknown>> {
    return !!value && typeof value === "object" && !Array.isArray(value) &&
      Object.keys(value).length === 0;
  },
};
function registry() {
  const value = new MissionTaskRegistry();
  value.register("test.safe-check", schema, {
    async execute() { return { output: { ok: true }, evidence: { source: "fixture" } }; },
  }, {
    id: "test.independent-verifier",
    version: "1.0.0",
    async verify() {
      return {
        passed: true, verifierId: "test.independent-verifier", verifierVersion: "1.0.0",
        checks: [{ id: "output.valid", passed: true }],
        observedAt: "2026-11-12T12:00:00.000Z",
      };
    },
  });
  return value;
}

Deno.test("worker persists proof only after a current lease and independent passing verification", async () => {
  let leaseChecks = 0, persisted = 0;
  const result = await processClaimedMissionTask(claim, {
    registry: registry(),
    async assertLeaseCurrent() { leaseChecks++; return true; },
    async persistProof({ envelope }) {
      persisted++;
      if (envelope.outcome !== "passed" || envelope.output.ok !== true) throw new Error("bad proof");
      return {
        proofId: "66666666-6666-4666-8666-666666666666",
        attestationId: "77777777-7777-4777-8777-777777777777",
        digest: "a".repeat(64),
      };
    },
  });
  if (result.status !== "completed" || persisted !== 1 || leaseChecks !== 2) {
    throw new Error("Expected lease checks before execution and proof persistence");
  }
});

Deno.test("worker refuses to start on a stale lease", async () => {
  let executed = 0, persisted = 0;
  const r = new MissionTaskRegistry();
  r.register("test.safe-check", schema, {
    async execute() { executed++; return { output: {}, evidence: {} }; },
  }, {
    id: "test.verifier", version: "1",
    async verify() { return { passed: true, verifierId: "test.verifier", verifierVersion: "1",
      checks: [{ id: "ok", passed: true }], observedAt: "2026-11-12T12:00:00.000Z" }; },
  });
  const result = await processClaimedMissionTask(claim, {
    registry: r,
    async assertLeaseCurrent() { return false; },
    async persistProof() { persisted++; return {} as never; },
  });
  if (result.status !== "denied" || result.reason !== "lease_not_current" || executed || persisted) {
    throw new Error("Stale lease reached task execution or proof persistence");
  }
});

Deno.test("worker rechecks lease after handler and before proof persistence", async () => {
  let checks = 0, persisted = 0;
  const result = await processClaimedMissionTask(claim, {
    registry: registry(),
    async assertLeaseCurrent() { checks++; return checks === 1; },
    async persistProof() { persisted++; return {} as never; },
  });
  if (result.status !== "denied" || result.reason !== "lease_not_current" || checks !== 2 || persisted) {
    throw new Error("Expired lease was allowed to persist a proof");
  }
});

Deno.test("unregistered tasks fail closed without proof persistence", async () => {
  let persisted = 0;
  const result = await processClaimedMissionTask({ ...claim, taskType: "build.implementation" }, {
    registry: new MissionTaskRegistry(),
    async assertLeaseCurrent() { return true; },
    async persistProof() { persisted++; return {} as never; },
  });
  if (result.status !== "denied" || result.reason !== "task_not_registered" || persisted) {
    throw new Error("Unregistered task was not denied");
  }
});

Deno.test("invalid worker claims are denied before callbacks", async () => {
  let called = 0;
  const result = await processClaimedMissionTask({ ...claim, leaseToken: "not-a-uuid" }, {
    registry: registry(),
    async assertLeaseCurrent() { called++; return true; },
    async persistProof() { called++; return {} as never; },
  });
  if (result.status !== "denied" || result.reason !== "invalid_claim" || called) {
    throw new Error("Invalid claim reached trusted callbacks");
  }
});

Deno.test("worker rejects a concurrent duplicate run in the same isolate", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let executions = 0, persisted = 0;
  const r = new MissionTaskRegistry();
  r.register("test.safe-check", schema, {
    async execute() { executions++; await gate; return { output: { ok: true }, evidence: {} }; },
  }, {
    id: "test.independent-verifier", version: "1.0.0",
    async verify() { return { passed: true, verifierId: "test.independent-verifier",
      verifierVersion: "1.0.0", checks: [{ id: "ok", passed: true }],
      observedAt: "2026-11-12T12:00:00.000Z" }; },
  });
  const deps = {
    registry: r,
    async assertLeaseCurrent() { return true; },
    async persistProof() {
      persisted++;
      return { proofId: "66666666-6666-4666-8666-666666666666",
        attestationId: "77777777-7777-4777-8777-777777777777", digest: "b".repeat(64) };
    },
  };
  const first = processClaimedMissionTask(claim, deps);
  await Promise.resolve();
  const second = await processClaimedMissionTask(claim, deps);
  if (second.status !== "denied" || second.reason !== "lease_not_current") {
    release();
    throw new Error("Concurrent duplicate run was not denied");
  }
  release();
  const firstResult = await first;
  if (firstResult.status !== "completed" || executions !== 1 || persisted !== 1) {
    throw new Error("Concurrent duplicate executed or persisted more than once");
  }
});
