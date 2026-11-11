import {
  MissionTaskNotExecutableError,
  MissionTaskRegistry,
  type MissionTaskDescriptor,
  type MissionTaskInputSchema,
  type MissionVerificationResult,
} from "./mission-task-registry.ts";

const emptyObjectV1: MissionTaskInputSchema = {
  version: 1,
  validate(value): value is Readonly<Record<string, unknown>> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null) &&
      Object.keys(value).length === 0;
  },
};

const task: MissionTaskDescriptor = {
  id: "22222222-2222-4222-8222-222222222222",
  missionId: "11111111-1111-4111-8111-111111111111",
  runId: "33333333-3333-4333-8333-333333333333",
  ownerId: "44444444-4444-4444-8444-444444444444",
  taskType: "test.safe-check",
  inputSchemaVersion: 1,
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

Deno.test("execution requires a versioned schema, handler and independent verifier", async () => {
  const registry = new MissionTaskRegistry();
  let handlerCalls = 0;
  let verifierCalls = 0;
  registry.register("test.safe-check", emptyObjectV1, {
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

Deno.test("rejects schema-version mismatches and unknown input fields before handler execution", async () => {
  const registry = new MissionTaskRegistry();
  let handlerCalls = 0;
  registry.register("test.safe-check", emptyObjectV1, {
    async execute() {
      handlerCalls++;
      return { output: {}, evidence: {} };
    },
  }, {
    id: "test.schema-verifier",
    version: "1.0.0",
    async verify() {
      return {
        passed: true,
        verifierId: "test.schema-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "valid", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });

  const invalidDescriptors = [
    { ...task, inputSchemaVersion: 2 },
    { ...task, input: { unexpected: true } },
  ];
  for (const descriptor of invalidDescriptors) {
    try {
      await registry.executeAndVerify(descriptor);
      throw new Error("An incompatible task input was accepted");
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
  if (handlerCalls !== 0) {
    throw new Error("The handler ran before schema version and input validation");
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
  registry.register("test.safe-check", emptyObjectV1, handler, verifier);
  try {
    registry.register("test.safe-check", emptyObjectV1, handler, verifier);
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
  const malformedChecks: unknown[][] = [
    [{ id: "valid", passed: true }, { id: "valid", passed: true }],
    [{ id: "valid", passed: "true" }],
    [{ id: "INVALID ID", passed: true }],
    [{ id: "valid", passed: true, detail: "x".repeat(1001) }],
  ];
  for (const checks of malformedChecks) {
    const registry = new MissionTaskRegistry();
    registry.register("test.safe-check", emptyObjectV1, {
      async execute() { return { output: {}, evidence: {} }; },
    }, {
      id: "test.strict-verifier",
      version: "1.0.0",
      async verify() {
        return {
          passed: true,
          verifierId: "test.strict-verifier",
          verifierVersion: "1.0.0",
          checks: checks as unknown as MissionVerificationResult["checks"],
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
  registry.register("test.safe-check", emptyObjectV1, {
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

Deno.test("rejects malformed task, mission, run and owner identifiers before handler execution", async () => {
  const registry = new MissionTaskRegistry();
  let handlerCalls = 0;
  registry.register("test.safe-check", emptyObjectV1, {
    async execute() {
      handlerCalls++;
      return { output: {}, evidence: {} };
    },
  }, {
    id: "test.uuid-verifier",
    version: "1.0.0",
    async verify() {
      return {
        passed: true,
        verifierId: "test.uuid-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "valid", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });

  const malformed: MissionTaskDescriptor[] = [
    { ...task, id: "not-a-uuid" },
    { ...task, missionId: "not-a-uuid" },
    { ...task, runId: "not-a-uuid" },
    { ...task, ownerId: "not-a-uuid" },
  ];
  for (const descriptor of malformed) {
    try {
      await registry.executeAndVerify(descriptor);
      throw new Error("Malformed task binding was accepted");
    } catch (error) {
      if (!(error instanceof TypeError) || !error.message.includes("descriptor is invalid")) throw error;
    }
  }
  if (handlerCalls !== 0) {
    throw new Error("Handler ran before malformed UUID bindings were rejected");
  }
});


Deno.test("handler and verifier receive detached immutable task and evidence snapshots", async () => {
  const registry = new MissionTaskRegistry();
  let verifierSawOriginalBinding = false;
  let verifierSawFrozenEvidence = false;
  registry.register("test.safe-check", emptyObjectV1, {
    async execute(receivedTask) {
      if (!Object.isFrozen(receivedTask) || !Object.isFrozen(receivedTask.input)) {
        throw new Error("Handler received a mutable task descriptor");
      }
      try {
        (receivedTask as { missionId: string }).missionId =
          "99999999-9999-4999-8999-999999999999";
      } catch {
        // Frozen objects reject mutation in strict mode; the original value must remain.
      }
      return { output: { status: "ok" }, evidence: { artifact: { id: "artifact-1" } } };
    },
  }, {
    id: "test.immutable-verifier",
    version: "1.0.0",
    async verify(receivedTask, result) {
      verifierSawOriginalBinding =
        receivedTask.missionId === task.missionId &&
        Object.isFrozen(receivedTask) &&
        Object.isFrozen(receivedTask.input);
      verifierSawFrozenEvidence =
        Object.isFrozen(result) &&
        Object.isFrozen(result.evidence) &&
        Object.isFrozen(result.evidence.artifact);
      try {
        (result.evidence.artifact as { id: string }).id = "tampered";
      } catch {
        // Verifier cannot rewrite the evidence snapshot it is evaluating.
      }
      return {
        passed: true,
        verifierId: "test.immutable-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "immutable-snapshot", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });

  const result = await registry.executeAndVerify(task);
  if (!verifierSawOriginalBinding || !verifierSawFrozenEvidence ||
      result.result.evidence.artifact === undefined ||
      (result.result.evidence.artifact as { id: string }).id !== "artifact-1") {
    throw new Error("Task or evidence changed across the handler/verifier trust boundary");
  }
});


Deno.test("returns a detached immutable verifier attestation snapshot", async () => {
  const registry = new MissionTaskRegistry();
  const verifierOwned = {
    passed: true,
    verifierId: "test.attestation-snapshot",
    verifierVersion: "1.0.0",
    checks: [{ id: "evidence-bound", passed: true, detail: "verified" }],
    observedAt: "2026-11-10T12:00:00.000Z",
  };
  registry.register("test.safe-check", emptyObjectV1, {
    async execute() {
      return { output: { ok: true }, evidence: { source: "test" } };
    },
  }, {
    id: verifierOwned.verifierId,
    version: verifierOwned.verifierVersion,
    async verify() {
      return verifierOwned;
    },
  });

  const result = await registry.executeAndVerify(task);
  verifierOwned.checks[0].detail = "changed-after-return";
  if (!Object.isFrozen(result.verification) ||
      !Object.isFrozen(result.verification.checks) ||
      !Object.isFrozen(result.verification.checks[0]) ||
      result.verification.checks[0].detail !== "verified") {
    throw new Error("Returned attestation was mutable or aliased to verifier-owned data");
  }
});


Deno.test("registration pins schema version, adapter methods and verifier identity", async () => {
  const registry = new MissionTaskRegistry();
  const schema: MissionTaskInputSchema = {
    version: 1,
    validate(value): value is Readonly<Record<string, unknown>> {
      return value !== null && typeof value === "object" &&
        !Array.isArray(value) && Object.keys(value).length === 0;
    },
  };
  let originalHandlerCalls = 0;
  let originalVerifierCalls = 0;
  const handler = {
    async execute() {
      originalHandlerCalls++;
      return { output: { ok: true }, evidence: { source: "pinned" } };
    },
  };
  const verifier = {
    id: "test.pinned-verifier",
    version: "1.0.0",
    async verify(): Promise<MissionVerificationResult> {
      originalVerifierCalls++;
      return {
        passed: true,
        verifierId: "test.pinned-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "pinned", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  };
  registry.register("test.safe-check", schema, handler, verifier);

  // Simulate accidental mutation of shared configuration after registration.
  Reflect.set(schema, "version", 2);
  Reflect.set(schema, "validate", () => false);
  Reflect.set(handler, "execute", async () => {
    throw new Error("Handler method was replaced after registration");
  });
  Reflect.set(verifier, "id", "test.forged-verifier");
  Reflect.set(verifier, "version", "9.9.9");
  Reflect.set(verifier, "verify", async () => {
    throw new Error("Verifier method was replaced after registration");
  });

  const result = await registry.executeAndVerify(task);
  if (!result.verification.passed ||
      result.verification.verifierId !== "test.pinned-verifier" ||
      result.verification.verifierVersion !== "1.0.0" ||
      originalHandlerCalls !== 1 || originalVerifierCalls !== 1) {
    throw new Error("Registered task adapter identity changed after registration");
  }
});


Deno.test("snapshot boundary rejects getters, symbol keys and sparse or decorated arrays", async () => {
  const registry = new MissionTaskRegistry();
  let handlerCalls = 0;
  let getterCalls = 0;
  registry.register("test.safe-check", {
    version: 1,
    validate(value): value is Readonly<Record<string, unknown>> {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    },
  }, {
    async execute() {
      handlerCalls++;
      return { output: {}, evidence: {} };
    },
  }, {
    id: "test.json-shape-verifier",
    version: "1.0.0",
    async verify(): Promise<MissionVerificationResult> {
      return {
        passed: true,
        verifierId: "test.json-shape-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "json-shape", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });

  const accessorInput: Record<string, unknown> = {};
  Object.defineProperty(accessorInput, "danger", {
    enumerable: true,
    get() {
      getterCalls++;
      return true;
    },
  });
  const symbolInput = { safe: true };
  Object.defineProperty(symbolInput, Symbol("hidden"), { value: true, enumerable: true });
  const hiddenInput = { safe: true };
  Object.defineProperty(hiddenInput, "hidden", { value: true, enumerable: false });
  const prototypeSensitiveInput = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>;
  const sparseArray = new Array(2);
  const decoratedArray: unknown[] = [true];
  (decoratedArray as unknown[] & { extra?: boolean }).extra = true;
  const customPrototypeArray: unknown[] = [true];
  Object.setPrototypeOf(customPrototypeArray, { custom: true });
  const invalidInputs = [
    accessorInput,
    symbolInput,
    hiddenInput,
    prototypeSensitiveInput,
    { values: sparseArray },
    { values: decoratedArray },
    { values: customPrototypeArray },
  ];

  for (const input of invalidInputs) {
    try {
      await registry.executeAndVerify({ ...task, input });
      throw new Error("Non-JSON data shape crossed the snapshot boundary");
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
  if (getterCalls !== 0 || handlerCalls !== 0) {
    throw new Error("Untrusted accessors executed or handler ran before JSON shape validation");
  }
});


Deno.test("registration rejects unbounded or malformed verifier identities", () => {
  const invalidIdentities = [
    { id: "Invalid Uppercase", version: "1.0.0" },
    { id: "test.valid-verifier", version: " " },
    { id: "x".repeat(81), version: "1.0.0" },
    { id: "test.valid-verifier", version: "v".repeat(41) },
  ];
  for (const identity of invalidIdentities) {
    const registry = new MissionTaskRegistry();
    try {
      registry.register("test.safe-check", emptyObjectV1, {
        async execute() { return { output: {}, evidence: {} }; },
      }, {
        ...identity,
        async verify(): Promise<MissionVerificationResult> {
          return {
            passed: true,
            verifierId: identity.id,
            verifierVersion: identity.version,
            checks: [{ id: "valid", passed: true }],
            observedAt: "2026-11-10T12:00:00.000Z",
          };
        },
      });
      throw new Error("Malformed verifier identity was accepted");
    } catch (error) {
      if (!(error instanceof TypeError) ||
          !error.message.includes("independent trusted verifier")) throw error;
    }
  }
});


Deno.test("handler result envelope accessors are rejected before verifier execution", async () => {
  const registry = new MissionTaskRegistry();
  let getterCalls = 0;
  let verifierCalls = 0;
  const envelope: Record<string, unknown> = {};
  Object.defineProperty(envelope, "output", {
    enumerable: true,
    get() {
      getterCalls++;
      return {};
    },
  });
  Object.defineProperty(envelope, "evidence", {
    enumerable: true,
    value: {},
  });
  registry.register("test.safe-check", emptyObjectV1, {
    async execute() {
      return envelope as unknown as { output: Record<string, unknown>; evidence: Record<string, unknown> };
    },
  }, {
    id: "test.envelope-verifier",
    version: "1.0.0",
    async verify() {
      verifierCalls++;
      return {
        passed: true,
        verifierId: "test.envelope-verifier",
        verifierVersion: "1.0.0",
        checks: [{ id: "never-reached", passed: true }],
        observedAt: "2026-11-10T12:00:00.000Z",
      };
    },
  });
  try {
    await registry.executeAndVerify(task);
    throw new Error("Accessor-bearing handler envelope was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  if (getterCalls !== 0 || verifierCalls !== 0) {
    throw new Error("Handler envelope accessor executed or verifier ran before rejection");
  }
});
