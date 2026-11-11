import {
  createBuildRequirementsVerifier,
  createLearnTopicSequenceVerifier,
  buildRequirementsInputV1,
  learnTopicSequenceInputV1,
} from "./mission-task-verifiers.ts";
import {
  MissionTaskRegistry,
  type MissionTaskDescriptor,
} from "./mission-task-registry.ts";

const fixedNow = new Date("2026-11-11T10:00:00.000Z");

const task: MissionTaskDescriptor = {
  id: "22222222-2222-4222-8222-222222222222",
  missionId: "11111111-1111-4111-8111-111111111111",
  runId: "33333333-3333-4333-8333-333333333333",
  ownerId: "44444444-4444-4444-8444-444444444444",
  taskType: "learn.topic_sequence",
  inputSchemaVersion: 1,
  input: { description: "Build a beginner-friendly sequence for learning algebra." },
};

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function makeTopics() {
  return [
    {
      id: "variables",
      title: "Understand variables",
      objective: "Explain how letters represent changing or unknown values.",
      estimatedMinutes: 25,
      prerequisiteIds: [],
      sourceRefIds: ["mission-input"],
    },
    {
      id: "expressions",
      title: "Build algebraic expressions",
      objective: "Translate simple verbal statements into algebraic expressions.",
      estimatedMinutes: 35,
      prerequisiteIds: ["variables"],
      sourceRefIds: ["mission-input"],
    },
    {
      id: "equations",
      title: "Solve one-step equations",
      objective: "Use inverse operations to solve and check one-step equations.",
      estimatedMinutes: 40,
      prerequisiteIds: ["variables", "expressions"],
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makeResult(description = task.input.description as string) {
  return {
    output: { topics: makeTopics() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(description),
      }],
    },
  };
}

Deno.test("learning topic sequence verifier validates a bounded prerequisite graph and input binding", async () => {
  const verifier = createLearnTopicSequenceVerifier(() => fixedNow);
  const result = await verifier.verify(task, await makeResult());
  if (!result.passed || result.checks.some((check) => !check.passed) ||
      result.verifierId !== "learn.topic-sequence-structure" ||
      result.verifierVersion !== "1.0.0" ||
      result.observedAt !== fixedNow.toISOString()) {
    throw new Error("A valid topic sequence did not pass its task-specific verifier");
  }
});

Deno.test("learning topic sequence input schema rejects unknown or unbounded fields", () => {
  if (!learnTopicSequenceInputV1.validate(task.input)) {
    throw new Error("The exact version-1 description input should be accepted");
  }
  if (learnTopicSequenceInputV1.validate({ description: "valid", extra: true }) ||
      learnTopicSequenceInputV1.validate({ description: " " }) ||
      learnTopicSequenceInputV1.validate({ description: "x".repeat(2001) })) {
    throw new Error("Unknown, blank or oversized task input was accepted");
  }
});

Deno.test("learning topic sequence verifier rejects forged and missing input provenance", async () => {
  const verifier = createLearnTopicSequenceVerifier(() => fixedNow);
  const valid = await makeResult();
  const forged = structuredClone(valid);
  forged.evidence.sourceBindings[0].sha256 = "a".repeat(64);
  const forgedResult = await verifier.verify(task, forged);
  if (forgedResult.passed ||
      forgedResult.checks.find((check) => check.id === "input-provenance-binding")?.passed) {
    throw new Error("Forged source digest was accepted");
  }

  const missing = await verifier.verify(task, {
    output: valid.output,
    evidence: {},
  });
  if (missing.passed ||
      missing.checks.find((check) => check.id === "input-provenance-binding")?.passed) {
    throw new Error("Missing provenance evidence was accepted");
  }
});

Deno.test("learning topic sequence verifier rejects contradictory prerequisites and duplicate IDs", async () => {
  const verifier = createLearnTopicSequenceVerifier(() => fixedNow);
  const contradictory = await makeResult();
  contradictory.output.topics[1].prerequisiteIds = ["not-yet-defined"];
  const result = await verifier.verify(task, contradictory);
  if (result.passed ||
      result.checks.find((check) => check.id === "prerequisite-order")?.passed) {
    throw new Error("A forward or missing prerequisite reference was accepted");
  }

  const duplicate = await makeResult();
  duplicate.output.topics[2].id = duplicate.output.topics[1].id;
  const duplicateResult = await verifier.verify(task, duplicate);
  if (duplicateResult.passed ||
      duplicateResult.checks.find((check) => check.id === "topic-shape-and-uniqueness")?.passed) {
    throw new Error("Duplicate topic identifiers were accepted");
  }
});

Deno.test("learning topic sequence verifier rejects malformed and excessive topic payloads", async () => {
  const verifier = createLearnTopicSequenceVerifier(() => fixedNow);
  const malformed = await makeResult();
  (malformed.output.topics[0] as unknown as { estimatedMinutes: number }).estimatedMinutes = 0;
  const malformedResult = await verifier.verify(task, malformed);
  if (malformedResult.passed) throw new Error("Invalid topic duration was accepted");

  const excessive = await makeResult();
  excessive.output.topics = Array.from({ length: 21 }, (_, index) => ({
    id: "topic-" + index,
    title: "Topic " + index,
    objective: "Explain a sufficiently bounded learning objective.",
    estimatedMinutes: 20,
    prerequisiteIds: index ? ["topic-" + (index - 1)] : [],
    sourceRefIds: ["mission-input"],
  }));
  const excessiveResult = await verifier.verify(task, excessive);
  if (excessiveResult.passed ||
      excessiveResult.checks.find((check) => check.id === "topic-count")?.passed) {
    throw new Error("An oversized topic sequence was accepted");
  }
});


Deno.test("learning topic sequence verifier integrates with the fail-closed task registry", async () => {
  const registry = new MissionTaskRegistry();
  const validResult = await makeResult();
  registry.register(
    "learn.topic_sequence",
    learnTopicSequenceInputV1,
    {
      async execute() {
        return validResult;
      },
    },
    createLearnTopicSequenceVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(task);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "learn.topic-sequence-structure" ||
      execution.verification.checks.length !== 6) {
    throw new Error("The task-specific verifier did not pass through the registry contract");
  }
});


const buildTask: MissionTaskDescriptor = {
  ...task,
  taskType: "build.requirements",
};

function makeRequirements() {
  return [
    {
      id: "account-access",
      title: "Account access",
      description: "Users can securely access their own account and workspace.",
      priority: "critical",
      acceptanceCriteria: ["A signed-in user can open their own workspace."],
      sourceRefIds: ["mission-input"],
    },
    {
      id: "responsive-layout",
      title: "Responsive layout",
      description: "The interface adapts to narrow mobile and desktop viewports.",
      priority: "high",
      acceptanceCriteria: ["Primary actions remain visible at a 360px viewport."],
      sourceRefIds: ["mission-input"],
    },
    {
      id: "error-feedback",
      title: "Error feedback",
      description: "Recoverable failures provide clear and actionable feedback.",
      priority: "medium",
      acceptanceCriteria: ["A failed request shows a retryable error message."],
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makeBuildResult() {
  const description = buildTask.input.description as string;
  return {
    output: { requirements: makeRequirements() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(description),
      }],
    },
  };
}

Deno.test("build requirements verifier validates bounded requirements and input provenance", async () => {
  const verifier = createBuildRequirementsVerifier(() => fixedNow);
  const result = await verifier.verify(buildTask, await makeBuildResult());
  if (!result.passed || result.checks.length !== 6 ||
      result.verifierId !== "build.requirements-structure" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("A valid build requirements brief did not pass");
  }
});

Deno.test("build requirements input schema rejects unknown and oversized fields", () => {
  if (!buildRequirementsInputV1.validate(buildTask.input) ||
      buildRequirementsInputV1.validate({ description: "valid", ownerId: "forged" }) ||
      buildRequirementsInputV1.validate({ description: "x".repeat(2001) })) {
    throw new Error("Invalid build requirements input was accepted");
  }
});

Deno.test("build requirements verifier rejects missing criteria, invalid priority and forged provenance", async () => {
  const verifier = createBuildRequirementsVerifier(() => fixedNow);
  const noCriteria = await makeBuildResult();
  noCriteria.output.requirements[0].acceptanceCriteria = [];
  if ((await verifier.verify(buildTask, noCriteria)).passed) {
    throw new Error("Requirement without acceptance criteria was accepted");
  }

  const badPriority = await makeBuildResult();
  (badPriority.output.requirements[0] as unknown as { priority: string }).priority = "urgent-ish";
  if ((await verifier.verify(buildTask, badPriority)).passed) {
    throw new Error("Unknown requirement priority was accepted");
  }

  const forged = await makeBuildResult();
  forged.evidence.sourceBindings[0].sha256 = "f".repeat(64);
  const forgedResult = await verifier.verify(buildTask, forged);
  if (forgedResult.passed ||
      forgedResult.checks.find((check) => check.id === "input-provenance-binding")?.passed) {
    throw new Error("Forged build requirements provenance was accepted");
  }
});

Deno.test("build requirements verifier rejects duplicate requirement identifiers", async () => {
  const verifier = createBuildRequirementsVerifier(() => fixedNow);
  const result = await makeBuildResult();
  result.output.requirements[2].id = result.output.requirements[1].id;
  const checked = await verifier.verify(buildTask, result);
  if (checked.passed ||
      checked.checks.find((check) => check.id === "requirement-shape-and-uniqueness")?.passed) {
    throw new Error("Duplicate requirement identifiers were accepted");
  }
});

Deno.test("build requirements verifier integrates with the fail-closed task registry", async () => {
  const registry = new MissionTaskRegistry();
  const result = await makeBuildResult();
  registry.register(
    "build.requirements",
    buildRequirementsInputV1,
    { async execute() { return result; } },
    createBuildRequirementsVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(buildTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "build.requirements-structure" ||
      execution.verification.checks.length !== 6) {
    throw new Error("Build requirements verifier did not pass through registry validation");
  }
});
