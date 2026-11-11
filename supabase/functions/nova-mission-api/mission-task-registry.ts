import { canonicalizeMissionProof } from "./mission-proof.ts";

/**
 * Fail-closed registry for future NOVA Mission workers.
 *
 * No task type is executable unless an explicit input schema, handler and
 * independent verifier are registered by trusted server code. This module
 * performs no I/O, does not claim leases, and has no default handlers.
 */
export interface MissionTaskDescriptor {
  id: string;
  missionId: string;
  runId: string;
  ownerId: string;
  taskType: string;
  inputSchemaVersion: number;
  input: Readonly<Record<string, unknown>>;
}

export interface MissionTaskInputSchema {
  /** Positive integer that is stored with the task input and matched at execution time. */
  readonly version: number;
  /** Must reject unknown fields and values outside this task type's contract. */
  validate(input: unknown): input is Readonly<Record<string, unknown>>;
}

export interface MissionExecutionResult {
  output: Readonly<Record<string, unknown>>;
  evidence: Readonly<Record<string, unknown>>;
}

export interface MissionVerificationResult {
  passed: boolean;
  verifierId: string;
  verifierVersion: string;
  checks: ReadonlyArray<{ id: string; passed: boolean; detail?: string }>;
  observedAt: string;
}

export interface MissionTaskHandler {
  execute(task: MissionTaskDescriptor): Promise<MissionExecutionResult>;
}

export interface MissionTaskVerifier {
  readonly id: string;
  readonly version: string;
  verify(
    task: MissionTaskDescriptor,
    result: MissionExecutionResult,
  ): Promise<MissionVerificationResult>;
}

interface RegisteredTaskType {
  inputSchema: MissionTaskInputSchema;
  inputSchemaVersion: number;
  validateInput: MissionTaskInputSchema["validate"];
  handler: MissionTaskHandler;
  execute: MissionTaskHandler["execute"];
  verifier: MissionTaskVerifier;
  verify: MissionTaskVerifier["verify"];
  verifierId: string;
  verifierVersion: string;
}

export class MissionTaskNotExecutableError extends Error {
  constructor(taskType: string, reason: string) {
    super('Mission task type "' + taskType + '" is not executable: ' + reason);
    this.name = "MissionTaskNotExecutableError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertPlainJsonData(
  value: unknown,
  depth = 0,
  ancestors = new Set<object>(),
): void {
  if (depth > 16) throw new TypeError("JSON data nesting is too deep");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object") throw new TypeError("Value is not plain JSON data");
  if (ancestors.has(value)) throw new TypeError("JSON data must not contain cycles");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        throw new TypeError("JSON arrays must use the standard array prototype");
      }
      if (value.length > 50000) throw new TypeError("JSON array is too large");
      const ownKeys = Reflect.ownKeys(value);
      if (ownKeys.some((key) => key !== "length" &&
          (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) ||
           Number(key) >= value.length))) {
        throw new TypeError("JSON arrays must not contain custom properties");
      }
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
          throw new TypeError("JSON arrays must be dense data arrays");
        }
        assertPlainJsonData(descriptor.value, depth + 1, ancestors);
      }
      return;
    }
    if (!isRecord(value)) {
      throw new TypeError("JSON objects must be plain records");
    }
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string")) {
      throw new TypeError("JSON objects must not contain symbol keys");
    }
    for (const key of ownKeys as string[]) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") {
        throw new TypeError("JSON objects must not contain prototype-sensitive keys");
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
        throw new TypeError("JSON objects must contain enumerable data properties only");
      }
      assertPlainJsonData(descriptor.value, depth + 1, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function snapshotRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new TypeError(label + " must be a plain JSON object");
  assertPlainJsonData(value);
  let serialized: string;
  try {
    serialized = canonicalizeMissionProof(value);
  } catch {
    throw new TypeError(label + " must be bounded, acyclic JSON data");
  }
  const snapshot: unknown = JSON.parse(serialized);
  if (!isRecord(snapshot)) throw new TypeError(label + " must be a plain JSON object");
  return deepFreeze(snapshot);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidCheck(value: unknown): value is { id: string; passed: boolean; detail?: string } {
  if (!isRecord(value) || typeof value.id !== "string" ||
      !/^[a-z][a-z0-9_.-]{0,79}$/.test(value.id) ||
      typeof value.passed !== "boolean") return false;
  return value.detail === undefined ||
    (typeof value.detail === "string" && value.detail.length <= 1000);
}

export class MissionTaskRegistry {
  readonly #registrations = new Map<string, RegisteredTaskType>();

  register(
    taskType: string,
    inputSchema: MissionTaskInputSchema,
    handler: MissionTaskHandler,
    verifier: MissionTaskVerifier,
  ): void {
    const key = taskType.trim();
    if (!/^[a-z][a-z0-9_.-]{1,79}$/.test(key)) {
      throw new TypeError("Task type must be a bounded lowercase identifier");
    }
    if (this.#registrations.has(key)) {
      throw new Error('Task type "' + key + '" is already registered');
    }
    if (!inputSchema || !Number.isSafeInteger(inputSchema.version) ||
        inputSchema.version < 1 || inputSchema.version > 1000 ||
        typeof inputSchema.validate !== "function") {
      throw new TypeError("A versioned task input schema is required");
    }
    if (!handler || typeof handler.execute !== "function") {
      throw new TypeError("A trusted task handler is required");
    }
    if (!verifier || typeof verifier.verify !== "function" ||
        typeof verifier.id !== "string" ||
        !/^[a-z][a-z0-9_.-]{1,79}$/.test(verifier.id) ||
        typeof verifier.version !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9._+-]{0,39}$/.test(verifier.version)) {
      throw new TypeError("A bounded, versioned independent trusted verifier is required");
    }
    // Capture version, identity and method references at registration. A
    // later mutation of a configuration object must not swap the trusted code
    // or verifier identity underneath an in-flight task.
    this.#registrations.set(key, {
      inputSchema,
      inputSchemaVersion: inputSchema.version,
      validateInput: inputSchema.validate,
      handler,
      execute: handler.execute,
      verifier,
      verify: verifier.verify,
      verifierId: verifier.id,
      verifierVersion: verifier.version,
    });
  }

  has(taskType: string): boolean {
    return this.#registrations.has(taskType);
  }

  async executeAndVerify(task: MissionTaskDescriptor): Promise<{
    result: MissionExecutionResult;
    verification: MissionVerificationResult;
  }> {
    // Detach caller-owned objects before the first await. The handler and verifier
    // receive the same frozen task snapshot, preventing descriptor TOCTOU changes.
    if (!isRecord(task)) throw new TypeError("Mission task descriptor is invalid");
    const taskSnapshot = snapshotRecord(task, "Mission task descriptor") as unknown as MissionTaskDescriptor;
    if (!/^[a-z][a-z0-9_.-]{1,79}$/.test(taskSnapshot.taskType) ||
        !Number.isSafeInteger(taskSnapshot.inputSchemaVersion) ||
        !isRecord(taskSnapshot.input) || !UUID.test(taskSnapshot.id) ||
        !UUID.test(taskSnapshot.missionId) || !UUID.test(taskSnapshot.runId) ||
        !UUID.test(taskSnapshot.ownerId)) {
      throw new TypeError("Mission task descriptor is invalid");
    }

    const registration = this.#registrations.get(taskSnapshot.taskType);
    if (!registration) {
      throw new MissionTaskNotExecutableError(
        taskSnapshot.taskType,
        "no input schema, handler and independent verifier are registered",
      );
    }

    if (taskSnapshot.inputSchemaVersion !== registration.inputSchemaVersion) {
      throw new TypeError("Mission task input schema version is unsupported");
    }

    let inputIsValid = false;
    try {
      inputIsValid = registration.validateInput.call(registration.inputSchema, taskSnapshot.input) === true;
    } catch {
      inputIsValid = false;
    }
    if (!inputIsValid) {
      throw new TypeError("Mission task input does not match its registered schema");
    }

    const rawResult = await registration.execute.call(registration.handler, taskSnapshot);
    if (!isRecord(rawResult)) {
      throw new TypeError("Task handler returned an invalid result envelope");
    }
    // Validate the complete envelope before reading output/evidence so accessors,
    // hidden properties and non-JSON values cannot run during property access.
    assertPlainJsonData(rawResult);
    if (!isRecord(rawResult.output) || !isRecord(rawResult.evidence)) {
      throw new TypeError("Task handler returned an invalid result envelope");
    }
    // Snapshot handler output before verification; the verifier cannot be shown
    // a moving object that the handler or another reference can mutate.
    const result = deepFreeze({
      output: snapshotRecord(rawResult.output, "Task output"),
      evidence: snapshotRecord(rawResult.evidence, "Task evidence"),
    }) as MissionExecutionResult;
    const rawVerification = await registration.verify.call(registration.verifier, taskSnapshot, result);
    // Detach verifier-owned objects too: callers must not be able to mutate the
    // attestation after validation, and the verifier cannot mutate it later.
    const verification = snapshotRecord(rawVerification, "Task verification") as unknown as MissionVerificationResult;
    if (verification.verifierId !== registration.verifierId ||
        verification.verifierVersion !== registration.verifierVersion ||
        !Array.isArray(verification.checks) || verification.checks.length < 1 ||
        verification.checks.length > 50 ||
        !verification.checks.every(isValidCheck) ||
        new Set(verification.checks.map((check) => check.id)).size !== verification.checks.length ||
        verification.passed !== verification.checks.every((check) => check.passed === true) ||
        typeof verification.observedAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(verification.observedAt) ||
        !Number.isFinite(Date.parse(verification.observedAt))) {
      throw new TypeError("Trusted verifier returned an invalid or inconsistent attestation");
    }
    return { result, verification };
  }
}

/** Safe default: every task remains non-executable until a reviewed adapter is added. */
export const missionTaskRegistry = new MissionTaskRegistry();
