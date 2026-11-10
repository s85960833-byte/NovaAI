/**
 * Fail-closed registry for future NOVA Mission workers.
 *
 * No task type is executable unless both a handler and an independent verifier
 * are explicitly registered by trusted server code. This module performs no I/O,
 * does not claim leases, and has no default handlers.
 */
export interface MissionTaskDescriptor {
  id: string;
  missionId: string;
  runId: string;
  ownerId: string;
  taskType: string;
  input: Readonly<Record<string, unknown>>;
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

export class MissionTaskNotExecutableError extends Error {
  constructor(taskType: string, reason: string) {
    super(`Mission task type "${taskType}" is not executable: ${reason}`);
    this.name = "MissionTaskNotExecutableError";
  }
}

export class MissionTaskRegistry {
  readonly #handlers = new Map<string, MissionTaskHandler>();
  readonly #verifiers = new Map<string, MissionTaskVerifier>();

  register(taskType: string, handler: MissionTaskHandler, verifier: MissionTaskVerifier): void {
    const key = taskType.trim();
    if (!/^[a-z][a-z0-9_.-]{1,79}$/.test(key)) {
      throw new TypeError("Task type must be a bounded lowercase identifier");
    }
    if (this.#handlers.has(key) || this.#verifiers.has(key)) {
      throw new Error(`Task type "${key}" is already registered`);
    }
    if (!handler || typeof handler.execute !== "function") {
      throw new TypeError("A trusted task handler is required");
    }
    if (!verifier || typeof verifier.verify !== "function" ||
        typeof verifier.id !== "string" || !verifier.id.trim() ||
        typeof verifier.version !== "string" || !verifier.version.trim()) {
      throw new TypeError("An independent trusted verifier is required");
    }
    this.#handlers.set(key, handler);
    this.#verifiers.set(key, verifier);
  }

  has(taskType: string): boolean {
    return this.#handlers.has(taskType) && this.#verifiers.has(taskType);
  }

  async executeAndVerify(task: MissionTaskDescriptor): Promise<{
    result: MissionExecutionResult;
    verification: MissionVerificationResult;
  }> {
    const handler = this.#handlers.get(task.taskType);
    const verifier = this.#verifiers.get(task.taskType);
    if (!handler || !verifier) {
      throw new MissionTaskNotExecutableError(task.taskType, "no handler and independent verifier are registered");
    }
    const result = await handler.execute(task);
    if (!result || typeof result !== "object" ||
        !result.output || typeof result.output !== "object" ||
        !result.evidence || typeof result.evidence !== "object") {
      throw new TypeError("Task handler returned an invalid result envelope");
    }
    const verification = await verifier.verify(task, result);
    if (!verification || verification.verifierId !== verifier.id ||
        verification.verifierVersion !== verifier.version ||
        !Array.isArray(verification.checks) || verification.checks.length < 1 ||
        verification.checks.length > 50 ||
        verification.passed !== verification.checks.every((check) => check.passed === true) ||
        !Number.isFinite(Date.parse(verification.observedAt))) {
      throw new TypeError("Trusted verifier returned an invalid or inconsistent attestation");
    }
    return { result, verification };
  }
}

/** Safe default: every task remains non-executable until a reviewed adapter is added. */
export const missionTaskRegistry = new MissionTaskRegistry();
