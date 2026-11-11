import {
  type MissionExecutionResult,
  type MissionTaskDescriptor,
  type MissionTaskInputSchema,
  type MissionTaskVerifier,
  type MissionVerificationResult,
} from "./mission-task-registry.ts";

/**
 * First task-specific verifier contract.
 *
 * This verifier independently checks the structure and provenance binding of a
 * learning topic sequence. It proves that the sequence is tied to the exact
 * mission input and is internally coherent; it does NOT claim to fact-check
 * educational content or validate external sources.
 */
const TOPIC_SEQUENCE_VERIFIER_ID = "learn.topic-sequence-structure";
const TOPIC_SEQUENCE_VERIFIER_VERSION = "1.0.0";
const UUID_LIKE_ID = /^[a-z][a-z0-9_-]{1,39}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

type Topic = {
  id: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  prerequisiteIds: string[];
  sourceRefIds: string[];
};

type TopicSequenceOutput = { topics: Topic[] };
type TopicSequenceEvidence = {
  sourceBindings: Array<{
    id: string;
    kind: "mission_input";
    locator: "mission.input.description";
    sha256: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function isStringArray(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max &&
    value.every((item) => typeof item === "string");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export const learnTopicSequenceInputV1: MissionTaskInputSchema = Object.freeze({
  version: 1,
  validate(value: unknown): value is Readonly<Record<string, unknown>> {
    return isRecord(value) && hasExactKeys(value, ["description"]) &&
      typeof value.description === "string" &&
      value.description.trim().length >= 1 &&
      value.description.length <= 2000;
  },
});

function failedResult(
  observedAt: string,
  checks: Array<{ id: string; passed: boolean; detail?: string }>,
  verifierId = TOPIC_SEQUENCE_VERIFIER_ID,
  verifierVersion = TOPIC_SEQUENCE_VERIFIER_VERSION,
): MissionVerificationResult {
  return {
    passed: checks.every((check) => check.passed),
    verifierId,
    verifierVersion,
    checks,
    observedAt,
  };
}

export function createLearnTopicSequenceVerifier(
  clock: () => Date = () => new Date(),
): MissionTaskVerifier {
  return Object.freeze({
    id: TOPIC_SEQUENCE_VERIFIER_ID,
    version: TOPIC_SEQUENCE_VERIFIER_VERSION,
    async verify(
      task: MissionTaskDescriptor,
      result: MissionExecutionResult,
    ): Promise<MissionVerificationResult> {
      const observedAt = clock().toISOString();
      const checks: Array<{ id: string; passed: boolean; detail?: string }> = [];
      const inputValid = learnTopicSequenceInputV1.validate(task.input);
      checks.push({
        id: "input-contract",
        passed: inputValid && task.taskType === "learn.topic_sequence" &&
          task.inputSchemaVersion === learnTopicSequenceInputV1.version,
        detail: "Task must use the version-1 learning topic sequence input contract",
      });

      const output = result.output;
      const evidence = result.evidence;
      const outputValid = isRecord(output) && hasExactKeys(output, ["topics"]) &&
        Array.isArray(output.topics);
      const topics = outputValid ? output.topics as unknown[] : [];
      checks.push({
        id: "topic-count",
        passed: topics.length >= 3 && topics.length <= 20,
        detail: "A sequence must contain between 3 and 20 topics",
      });

      let topicsValid = outputValid && topics.length >= 3 && topics.length <= 20;
      const seenIds = new Set<string>();
      const earlierIds = new Set<string>();
      const parsedTopics: Topic[] = [];
      if (topicsValid) {
        for (const value of topics) {
          if (!isRecord(value) ||
              !hasExactKeys(value, [
                "id", "title", "objective", "estimatedMinutes",
                "prerequisiteIds", "sourceRefIds",
              ]) ||
              typeof value.id !== "string" || !UUID_LIKE_ID.test(value.id) ||
              typeof value.title !== "string" || value.title.trim().length < 3 ||
              value.title.length > 120 ||
              typeof value.objective !== "string" || value.objective.trim().length < 10 ||
              value.objective.length > 500 ||
              !Number.isSafeInteger(value.estimatedMinutes) ||
              (value.estimatedMinutes as number) < 1 ||
              (value.estimatedMinutes as number) > 480 ||
              !isStringArray(value.prerequisiteIds, 20) ||
              !isStringArray(value.sourceRefIds, 10)) {
            topicsValid = false;
            break;
          }
          const topic = value as unknown as Topic;
          if (seenIds.has(topic.id) ||
              new Set(topic.prerequisiteIds).size !== topic.prerequisiteIds.length ||
              new Set(topic.sourceRefIds).size !== topic.sourceRefIds.length ||
              topic.prerequisiteIds.some((id) => !earlierIds.has(id))) {
            topicsValid = false;
            break;
          }
          seenIds.add(topic.id);
          earlierIds.add(topic.id);
          parsedTopics.push(topic);
        }
      }
      checks.push({
        id: "topic-shape-and-uniqueness",
        passed: topicsValid && parsedTopics.length === topics.length,
        detail: "Topics must have bounded fields and unique identifiers",
      });
      checks.push({
        id: "prerequisite-order",
        passed: topicsValid,
        detail: "Prerequisites must refer only to topics earlier in the sequence",
      });

      const sourceBindings = isRecord(evidence) && Array.isArray(evidence.sourceBindings)
        ? evidence.sourceBindings
        : [];
      const evidenceValid = isRecord(evidence) &&
        hasExactKeys(evidence, ["sourceBindings"]) &&
        sourceBindings.length === 1;
      let provenanceValid = false;
      if (evidenceValid && inputValid) {
        const binding = sourceBindings[0];
        if (isRecord(binding) &&
            hasExactKeys(binding, ["id", "kind", "locator", "sha256"]) &&
            binding.id === "mission-input" &&
            binding.kind === "mission_input" &&
            binding.locator === "mission.input.description" &&
            typeof binding.sha256 === "string" && SHA256.test(binding.sha256)) {
          const expectedDigest = await sha256(task.input.description as string);
          provenanceValid = binding.sha256 === expectedDigest;
        }
      }
      checks.push({
        id: "input-provenance-binding",
        passed: provenanceValid,
        detail: "Evidence must bind to the exact mission input description digest",
      });

      const sourceCoverageValid = provenanceValid && topicsValid &&
        parsedTopics.every((topic) =>
          topic.sourceRefIds.length === 1 &&
          topic.sourceRefIds[0] === "mission-input"
        );
      checks.push({
        id: "topic-source-coverage",
        passed: sourceCoverageValid,
        detail: "Every topic must reference the verified mission-input binding",
      });

      return failedResult(observedAt, checks);
    },
  });
}


/**
 * Build requirements verifier: validates a bounded requirements contract,
 * acceptance criteria and binding to the exact mission input. It does not
 * certify that requirements are complete for a real-world product.
 */
const BUILD_REQUIREMENTS_VERIFIER_ID = "build.requirements-structure";
const BUILD_REQUIREMENTS_VERIFIER_VERSION = "1.0.0";
const PRIORITIES = new Set(["critical", "high", "medium", "low"]);

type BuildRequirement = {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  acceptanceCriteria: string[];
  sourceRefIds: string[];
};

export const buildRequirementsInputV1: MissionTaskInputSchema = Object.freeze({
  version: 1,
  validate(value: unknown): value is Readonly<Record<string, unknown>> {
    return isRecord(value) && hasExactKeys(value, ["description"]) &&
      typeof value.description === "string" &&
      value.description.trim().length >= 1 &&
      value.description.length <= 2000;
  },
});

export function createBuildRequirementsVerifier(
  clock: () => Date = () => new Date(),
): MissionTaskVerifier {
  return Object.freeze({
    id: BUILD_REQUIREMENTS_VERIFIER_ID,
    version: BUILD_REQUIREMENTS_VERIFIER_VERSION,
    async verify(
      task: MissionTaskDescriptor,
      result: MissionExecutionResult,
    ): Promise<MissionVerificationResult> {
      const observedAt = clock().toISOString();
      const checks: Array<{ id: string; passed: boolean; detail?: string }> = [];
      const inputValid = buildRequirementsInputV1.validate(task.input);
      checks.push({
        id: "input-contract",
        passed: inputValid && task.taskType === "build.requirements" &&
          task.inputSchemaVersion === buildRequirementsInputV1.version,
        detail: "Task must use the version-1 build requirements input contract",
      });

      const output = result.output;
      const outputValid = isRecord(output) && hasExactKeys(output, ["requirements"]) &&
        Array.isArray(output.requirements);
      const requirements = outputValid ? output.requirements as unknown[] : [];
      checks.push({
        id: "requirement-count",
        passed: requirements.length >= 3 && requirements.length <= 15,
        detail: "A requirements brief must contain between 3 and 15 requirements",
      });

      let shapeValid = outputValid && requirements.length >= 3 && requirements.length <= 15;
      const seenIds = new Set<string>();
      const parsed: BuildRequirement[] = [];
      if (shapeValid) {
        for (const value of requirements) {
          if (!isRecord(value) ||
              !hasExactKeys(value, [
                "id", "title", "description", "priority",
                "acceptanceCriteria", "sourceRefIds",
              ]) ||
              typeof value.id !== "string" || !UUID_LIKE_ID.test(value.id) ||
              typeof value.title !== "string" || value.title.trim().length < 3 ||
              value.title.length > 100 ||
              typeof value.description !== "string" || value.description.trim().length < 10 ||
              value.description.length > 500 ||
              typeof value.priority !== "string" || !PRIORITIES.has(value.priority) ||
              !isStringArray(value.acceptanceCriteria, 5) ||
              value.acceptanceCriteria.length < 1 ||
              value.acceptanceCriteria.some((criterion) =>
                criterion.trim().length < 10 || criterion.length > 240
              ) ||
              !isStringArray(value.sourceRefIds, 5)) {
            shapeValid = false;
            break;
          }
          const item = value as unknown as BuildRequirement;
          if (seenIds.has(item.id) ||
              new Set(item.acceptanceCriteria).size !== item.acceptanceCriteria.length ||
              new Set(item.sourceRefIds).size !== item.sourceRefIds.length) {
            shapeValid = false;
            break;
          }
          seenIds.add(item.id);
          parsed.push(item);
        }
      }
      checks.push({
        id: "requirement-shape-and-uniqueness",
        passed: shapeValid && parsed.length === requirements.length,
        detail: "Requirements must have bounded fields, valid priorities and unique IDs",
      });
      checks.push({
        id: "acceptance-criteria",
        passed: shapeValid && parsed.every((item) =>
          item.acceptanceCriteria.length >= 1 &&
          item.acceptanceCriteria.every((criterion) => criterion.trim().length >= 10)
        ),
        detail: "Every requirement must include concrete, bounded acceptance criteria",
      });

      const evidence = result.evidence;
      const sourceBindings = isRecord(evidence) && Array.isArray(evidence.sourceBindings)
        ? evidence.sourceBindings
        : [];
      const evidenceValid = isRecord(evidence) &&
        hasExactKeys(evidence, ["sourceBindings"]) &&
        sourceBindings.length === 1;
      let provenanceValid = false;
      if (evidenceValid && inputValid) {
        const binding = sourceBindings[0];
        if (isRecord(binding) &&
            hasExactKeys(binding, ["id", "kind", "locator", "sha256"]) &&
            binding.id === "mission-input" &&
            binding.kind === "mission_input" &&
            binding.locator === "mission.input.description" &&
            typeof binding.sha256 === "string" && SHA256.test(binding.sha256)) {
          provenanceValid = binding.sha256 === await sha256(task.input.description as string);
        }
      }
      checks.push({
        id: "input-provenance-binding",
        passed: provenanceValid,
        detail: "Evidence must bind to the exact mission input description digest",
      });
      checks.push({
        id: "requirement-source-coverage",
        passed: provenanceValid && shapeValid &&
          parsed.every((item) => item.sourceRefIds.length === 1 &&
            item.sourceRefIds[0] === "mission-input"),
        detail: "Every requirement must reference the verified mission-input binding",
      });
      return failedResult(
        observedAt,
        checks,
        BUILD_REQUIREMENTS_VERIFIER_ID,
        BUILD_REQUIREMENTS_VERIFIER_VERSION,
      );
    },
  });
}
