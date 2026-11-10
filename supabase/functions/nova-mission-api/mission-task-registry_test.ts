import {
  MissionTaskNotExecutableError,
  MissionTaskRegistry,
  type MissionTaskDescriptor,
} from "./mission-task-registry.ts";

const task: MissionTaskDescriptor = {
  id: "22222222-2222-4222-8222-222222222222",
  missionId: "11111111-1111-4111-8111-111111111111",
  runId: "33333333-3333-4333-8333-333333333333",
  ownerId: "44444444-4444-4444-8444-444444444444",
  taskType: "test.safe-check",
  input: {},
};

Deno.test("registry denies every task type by default", async () => {
  const registry = new MissionTaskRegistry();
  try {
    await registry.executeAndVerify(task);
    throw new Error("Unregistered task was executed");
  } catch (error) {
    if (!(error instanceof MissionTaskNotExecutableError)) throw error;
  }
});

Deno.test("execution requires both a handler and independent verifier", async () => {
  const registry = new MissionTaskRegistry();
  let handlerCalls = 0;
  let verifierCalls = 0;
  registry.register("test.safe-check", {
    async execute() {
      handlerCalls++;
      return { output: { ok: true }, evidence: { observed: true } };
    },
  }, {
    id: "test.independent-verifier",
    version: "1.0.0",
    async verify() {
      verifierCalls++;
      return {
        passed: true,
        verifierId: "test.independent-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "independent-check", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });
  const result = await registry.executeAndVerify(task);
  if (!result.verification.passed || handlerCalls !== 1 || verifierCalls !== 1) {
    throw new Error("Expected one handler execution and one independent verification");
  }
});

Deno.test("rejects duplicate task types and inconsistent verifier results", async () => {
  const registry = new MissionTaskRegistry();
  const handler = { async execute() { return { output: {}, evidence: {} }; } };
  const verifier = {
    id: "test.verifier", version: "1",
    async verify() {
      return {
        passed: true, verifierId: "forged", verifierVersion: "1",
        checks: [{ id: "check", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  };
  registry.register("test.safe-check", handler, verifier);
  try {
    registry.register("test.safe-check", handler, verifier);
    throw new Error("Duplicate task type was accepted");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("already registered")) throw error;
  }
  try {
    await registry.executeAndVerify(task);
    throw new Error("Verifier identity mismatch was accepted");
  } catch (error) {
    if (!(error instanceof TypeError) || !error.message.includes("invalid or inconsistent")) throw error;
  }
});


Deno.test("rejects malformed, duplicate or non-ISO verifier checks", async () => {
  for (const checks of [
    [{ id: "valid", passed: true }, { id: "valid", passed: true }],
    [{ id: "valid", passed: "true" }],
    [{ id: "INVALID ID", passed: true }],
    [{ id: "valid", passed: true, detail: "x".repeat(1001) }],
  ]) {
    const registry = new MissionTaskRegistry();
    registry.register("test.safe-check", {
      async execute() { return { output: {}, evidence: {} }; },
    }, {
      id: "test.strict-verifier",
      version: "1.0.0",
      async verify() {
        return {
          passed: true,
          verifierId: "test.strict-verifier",
          verifierVersion: "1.0.0",
          checks,
          observedAt: "2026-11-10T12:00:00.000Z",
        };
      },
    });
    try {
      await registry.executeAndVerify(task);
      throw new Error("Malformed verifier checks were unexpectedly accepted");
    } catch (error) {
      if (!(error instanceof TypeError) || !error.message.includes("invalid or inconsistent")) throw error;
    }
  }
  const registry = new MissionTaskRegistry();
  registry.register("test.safe-check", {
    async execute() { return { output: {}, evidence: {} }; },
  }, {
    id: "test.strict-verifier",
    version: "1.0.0",
    async verify() {
      return {
        passed: true,
        verifierId: "test.strict-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "valid", passed: true }],
        observedAt: "November 10, 2026",
      };
    },
  });
  try {
    await registry.executeAndVerify(task);
    throw new Error("Non-ISO verifier timestamp was unexpectedly accepted");
  } catch (error) {
    if (!(error instanceof TypeError) || !error.message.includes("invalid or inconsistent")) throw error;
  }
});
