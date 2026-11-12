import { validateMissionToolPolicy } from "./mission-tool-policy.ts";
import {
  createBuildRequirementsVerifier,
  createBuildDesignFlowVerifier,
  createLearnAssessmentVerifier,
  createLearnGoalClarificationVerifier,
  createLearnPracticeMaterialVerifier,
  createIntelligenceDefineMetricsVerifier,
  createAgentsPermissionsVerifier,
  createAgentsToolGatesVerifier,
  createLearnTopicSequenceVerifier,
  buildRequirementsInputV1,
  buildDesignFlowInputV1,
  learnAssessmentInputV1,
  learnGoalClarificationInputV1,
  learnPracticeMaterialInputV1,
  intelligenceDefineMetricsInputV1,
  agentsPermissionsInputV1,
  agentsToolGatesInputV1,
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
    throw new Error("A valid build requirements brief did not pass: " + JSON.stringify(result));
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
    throw new Error("Build requirements verifier did not pass through registry validation: " + JSON.stringify(execution.verification));
  }
});


const assessmentTask: MissionTaskDescriptor = {
  ...task,
  taskType: "learn.assessment",
};

function makeQuestions() {
  return [
    {
      id: "question-one",
      prompt: "Which statement best describes a controlled experiment?",
      options: [
        { id: "option-a", text: "A test that changes several variables at once." },
        { id: "option-b", text: "A test that changes one variable while controlling others." },
        { id: "option-c", text: "A test that does not record observations." },
      ],
      correctOptionId: "option-b",
      explanation: "A controlled experiment isolates the effect of one variable.",
      difficulty: "introductory",
      sourceRefIds: ["mission-input"],
    },
    {
      id: "question-two",
      prompt: "Why should observations be recorded consistently?",
      options: [
        { id: "option-a", text: "To make comparisons more reliable." },
        { id: "option-b", text: "To avoid collecting any evidence." },
      ],
      correctOptionId: "option-a",
      explanation: "Consistent records help compare observations using the same method.",
      difficulty: "standard",
      sourceRefIds: ["mission-input"],
    },
    {
      id: "question-three",
      prompt: "What is the purpose of repeating a measurement?",
      options: [
        { id: "option-a", text: "To guarantee the preferred result." },
        { id: "option-b", text: "To assess variation and improve confidence." },
      ],
      correctOptionId: "option-b",
      explanation: "Repeated measurements help reveal variation in collected data.",
      difficulty: "advanced",
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makeAssessmentResult() {
  return {
    output: { questions: makeQuestions() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(assessmentTask.input.description as string),
      }],
    },
  };
}

Deno.test("learning assessment verifier validates answer keys and input provenance", async () => {
  const verifier = createLearnAssessmentVerifier(() => fixedNow);
  const result = await verifier.verify(assessmentTask, await makeAssessmentResult());
  if (!result.passed || result.checks.length !== 6 ||
      result.verifierId !== "learn.assessment-structure" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("A valid assessment did not pass: " + JSON.stringify(result));
  }
});

Deno.test("learning assessment input schema rejects unknown and oversized fields", () => {
  if (!learnAssessmentInputV1.validate(assessmentTask.input) ||
      learnAssessmentInputV1.validate({ description: "valid", ownerId: "forged" }) ||
      learnAssessmentInputV1.validate({ description: "x".repeat(2001) })) {
    throw new Error("Invalid assessment input was accepted");
  }
});

Deno.test("learning assessment verifier rejects missing and ambiguous answer keys", async () => {
  const verifier = createLearnAssessmentVerifier(() => fixedNow);
  const missing = await makeAssessmentResult();
  missing.output.questions[0].correctOptionId = "unknown-option";
  if ((await verifier.verify(assessmentTask, missing)).passed) {
    throw new Error("An answer key outside the option list was accepted");
  }

  const duplicate = await makeAssessmentResult();
  duplicate.output.questions[0].options.push({
    id: duplicate.output.questions[0].correctOptionId,
    text: "A second option with the same identifier.",
  });
  if ((await verifier.verify(assessmentTask, duplicate)).passed) {
    throw new Error("Duplicate option identifiers were accepted");
  }
});

Deno.test("learning assessment verifier rejects duplicate question IDs and forged provenance", async () => {
  const verifier = createLearnAssessmentVerifier(() => fixedNow);
  const duplicate = await makeAssessmentResult();
  duplicate.output.questions[2].id = duplicate.output.questions[1].id;
  if ((await verifier.verify(assessmentTask, duplicate)).passed) {
    throw new Error("Duplicate question identifiers were accepted");
  }

  const forged = await makeAssessmentResult();
  forged.evidence.sourceBindings[0].sha256 = "f".repeat(64);
  const checked = await verifier.verify(assessmentTask, forged);
  if (checked.passed ||
      checked.checks.find((check) => check.id === "input-provenance-binding")?.passed) {
    throw new Error("Forged assessment provenance was accepted");
  }
});

Deno.test("learning assessment verifier integrates with the fail-closed task registry", async () => {
  const registry = new MissionTaskRegistry();
  const result = await makeAssessmentResult();
  registry.register(
    "learn.assessment",
    learnAssessmentInputV1,
    { async execute() { return result; } },
    createLearnAssessmentVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(assessmentTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "learn.assessment-structure" ||
      execution.verification.checks.length !== 6) {
    throw new Error("Assessment verifier failed registry integration: " +
      JSON.stringify(execution.verification));
  }
});


const goalTask: MissionTaskDescriptor = {
  ...task,
  taskType: "learn.goal_clarification",
};

async function makeGoalResult() {
  return {
    output: {
      goal: "Build a reliable beginner algebra study routine.",
      successCriteria: [
        "Complete a short practice set on each planned study day.",
        "Explain each solved equation and check the result.",
      ],
      constraints: ["Keep each study session within 30 minutes."],
      sourceRefIds: ["mission-input"],
    },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(goalTask.input.description as string),
      }],
    },
  };
}

Deno.test("learning goal clarification verifier validates the goal contract and provenance", async () => {
  const verifier = createLearnGoalClarificationVerifier(() => fixedNow);
  const result = await verifier.verify(goalTask, await makeGoalResult());
  if (!result.passed || result.checks.length !== 5 ||
      result.verifierId !== "learn.goal-clarification-structure" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("A valid goal clarification did not pass: " + JSON.stringify(result));
  }
});

Deno.test("learning goal clarification verifier rejects missing criteria and malformed constraints", async () => {
  const verifier = createLearnGoalClarificationVerifier(() => fixedNow);
  const missing = await makeGoalResult();
  missing.output.successCriteria = [];
  if ((await verifier.verify(goalTask, missing)).passed) {
    throw new Error("A goal without success criteria was accepted");
  }
  const malformed = await makeGoalResult();
  malformed.output.constraints = [" "];
  if ((await verifier.verify(goalTask, malformed)).passed) {
    throw new Error("A blank constraint was accepted");
  }
});

Deno.test("learning goal clarification verifier rejects forged and missing provenance", async () => {
  const verifier = createLearnGoalClarificationVerifier(() => fixedNow);
  const forged = await makeGoalResult();
  forged.evidence.sourceBindings[0].sha256 = "e".repeat(64);
  if ((await verifier.verify(goalTask, forged)).passed) {
    throw new Error("Forged goal clarification provenance was accepted");
  }
  const missing = await makeGoalResult();
  missing.evidence = { sourceBindings: [] };
  if ((await verifier.verify(goalTask, missing)).passed) {
    throw new Error("Missing goal clarification provenance was accepted");
  }
});

Deno.test("learning goal clarification verifier integrates with the fail-closed registry", async () => {
  const registry = new MissionTaskRegistry();
  const result = await makeGoalResult();
  registry.register(
    "learn.goal_clarification",
    learnGoalClarificationInputV1,
    { async execute() { return result; } },
    createLearnGoalClarificationVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(goalTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "learn.goal-clarification-structure" ||
      execution.verification.checks.length !== 5) {
    throw new Error("Goal clarification registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});


const designFlowTask: MissionTaskDescriptor = {
  ...task,
  taskType: "build.design_flow",
};

const validFlowOutput = {
  startScreenId: "home",
  screens: [
    { id: "home", title: "Home screen" },
    { id: "details", title: "Details screen" },
    { id: "complete", title: "Completion screen" },
  ],
  edges: [
    { from: "home", to: "details" },
    { from: "details", to: "complete" },
  ],
};

async function makeDesignFlowResult() {
  return {
    output: structuredClone(validFlowOutput),
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(designFlowTask.input.description as string),
      }],
    },
  };
}

Deno.test("build design flow verifier accepts a connected directed navigation graph", async () => {
  const verifier = createBuildDesignFlowVerifier(() => fixedNow);
  const result = await verifier.verify(designFlowTask, await makeDesignFlowResult());
  if (!result.passed || result.checks.length !== 5 ||
      result.verifierId !== "build.design-flow-graph" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("A valid design flow did not pass: " + JSON.stringify(result));
  }
});

Deno.test("build design flow verifier rejects duplicate IDs and invalid destinations", async () => {
  const verifier = createBuildDesignFlowVerifier(() => fixedNow);
  const duplicate = await makeDesignFlowResult();
  duplicate.output.screens[1].id = "home";
  if ((await verifier.verify(designFlowTask, duplicate)).passed) {
    throw new Error("Duplicate screen IDs were accepted");
  }
  const dangling = await makeDesignFlowResult();
  dangling.output.edges[0].to = "missing-screen";
  if ((await verifier.verify(designFlowTask, dangling)).passed) {
    throw new Error("An edge to a missing screen was accepted");
  }
});

Deno.test("build design flow verifier rejects unreachable screens and invalid starts", async () => {
  const verifier = createBuildDesignFlowVerifier(() => fixedNow);
  const unreachable = await makeDesignFlowResult();
  unreachable.output.edges = [{ from: "home", to: "details" }];
  if ((await verifier.verify(designFlowTask, unreachable)).passed) {
    throw new Error("An unreachable screen was accepted");
  }
  const invalidStart = await makeDesignFlowResult();
  invalidStart.output.startScreenId = "unknown";
  if ((await verifier.verify(designFlowTask, invalidStart)).passed) {
    throw new Error("An unknown start screen was accepted");
  }
});

Deno.test("build design flow verifier rejects forged provenance and integrates with registry", async () => {
  const verifier = createBuildDesignFlowVerifier(() => fixedNow);
  const forged = await makeDesignFlowResult();
  forged.evidence.sourceBindings[0].sha256 = "a".repeat(64);
  if ((await verifier.verify(designFlowTask, forged)).passed) {
    throw new Error("Forged design-flow provenance was accepted");
  }

  const registry = new MissionTaskRegistry();
  const result = await makeDesignFlowResult();
  registry.register(
    "build.design_flow",
    buildDesignFlowInputV1,
    { async execute() { return result; } },
    createBuildDesignFlowVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(designFlowTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "build.design-flow-graph" ||
      execution.verification.checks.length !== 5) {
    throw new Error("Design-flow registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});


const practiceMaterialTask: MissionTaskDescriptor = {
  ...task,
  taskType: "learn.practice_material",
};

function validPracticeMaterials() {
  return [
    {
      id: "example-one",
      title: "Worked algebra example",
      instructions: "Read the worked example and identify each inverse operation used.",
      activityType: "worked_example",
      estimatedMinutes: 12,
      sourceRefIds: ["mission-input"],
    },
    {
      id: "practice-one",
      title: "Solve short equations",
      instructions: "Solve five one-step equations and check each answer by substitution.",
      activityType: "practice",
      estimatedMinutes: 20,
      sourceRefIds: ["mission-input"],
    },
    {
      id: "reflection-one",
      title: "Reflect on the method",
      instructions: "Explain which step was most difficult and how you checked your result.",
      activityType: "reflection",
      estimatedMinutes: 8,
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makePracticeMaterialResult() {
  return {
    output: { materials: validPracticeMaterials() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(practiceMaterialTask.input.description as string),
      }],
    },
  };
}

Deno.test("learning practice-material verifier accepts bounded activities with required coverage", async () => {
  const verifier = createLearnPracticeMaterialVerifier(() => fixedNow);
  const result = await verifier.verify(practiceMaterialTask, await makePracticeMaterialResult());
  if (!result.passed || result.checks.length !== 4 ||
      result.verifierId !== "learn.practice-material-structure" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("Valid practice materials did not pass: " + JSON.stringify(result));
  }
});

Deno.test("learning practice-material verifier rejects duplicate IDs and malformed activities", async () => {
  const verifier = createLearnPracticeMaterialVerifier(() => fixedNow);
  const duplicate = await makePracticeMaterialResult();
  duplicate.output.materials[1].id = duplicate.output.materials[0].id;
  if ((await verifier.verify(practiceMaterialTask, duplicate)).passed) {
    throw new Error("Duplicate material IDs were accepted");
  }
  const malformed = await makePracticeMaterialResult();
  malformed.output.materials[1].activityType = "untrusted_type";
  if ((await verifier.verify(practiceMaterialTask, malformed)).passed) {
    throw new Error("Unknown activity type was accepted");
  }
});

Deno.test("learning practice-material verifier requires both practice and worked example", async () => {
  const verifier = createLearnPracticeMaterialVerifier(() => fixedNow);
  const missingPractice = await makePracticeMaterialResult();
  missingPractice.output.materials[1].activityType = "reflection";
  if ((await verifier.verify(practiceMaterialTask, missingPractice)).passed) {
    throw new Error("A material set without a practice activity was accepted");
  }
  const missingExample = await makePracticeMaterialResult();
  missingExample.output.materials[0].activityType = "project";
  if ((await verifier.verify(practiceMaterialTask, missingExample)).passed) {
    throw new Error("A material set without a worked example was accepted");
  }
});

Deno.test("learning practice-material verifier rejects forged provenance and integrates with registry", async () => {
  const verifier = createLearnPracticeMaterialVerifier(() => fixedNow);
  const forged = await makePracticeMaterialResult();
  forged.evidence.sourceBindings[0].sha256 = "b".repeat(64);
  if ((await verifier.verify(practiceMaterialTask, forged)).passed) {
    throw new Error("Forged practice-material provenance was accepted");
  }

  const registry = new MissionTaskRegistry();
  const result = await makePracticeMaterialResult();
  registry.register(
    "learn.practice_material",
    learnPracticeMaterialInputV1,
    { async execute() { return result; } },
    createLearnPracticeMaterialVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(practiceMaterialTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "learn.practice-material-structure" ||
      execution.verification.checks.length !== 4) {
    throw new Error("Practice-material registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});


const defineMetricsTask: MissionTaskDescriptor = {
  ...task,
  taskType: "intelligence.define_metrics",
};

function validMetricDefinitions() {
  return [
    {
      id: "monthly-revenue",
      name: "Monthly revenue",
      businessQuestion: "How much revenue was recognized in each month?",
      metricKind: "currency",
      numeratorDefinition: "sum of recognized invoice amounts",
      denominatorDefinition: "not_applicable",
      formula: "sum of recognized invoice amounts",
      unit: "INR",
      grain: "one record per calendar month",
      reportingPeriod: "monthly",
      sourceFieldRefs: ["invoices.amount"],
    },
    {
      id: "payment-rate",
      name: "Invoice payment rate",
      businessQuestion: "What share of issued invoices were paid in full?",
      metricKind: "rate",
      numeratorDefinition: "count of invoices paid in full",
      denominatorDefinition: "count of invoices issued",
      formula: "(count of invoices paid in full) / (count of invoices issued)",
      unit: "percent",
      grain: "one record per calendar month",
      reportingPeriod: "monthly",
      sourceFieldRefs: ["invoices.status", "invoices.issued_at"],
    },
  ];
}

async function makeDefineMetricsResult() {
  return {
    output: { metrics: validMetricDefinitions() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(defineMetricsTask.input.description as string),
      }],
    },
  };
}

Deno.test("intelligence metric verifier accepts explicit KPI semantics and source fields", async () => {
  const verifier = createIntelligenceDefineMetricsVerifier(() => fixedNow);
  const result = await verifier.verify(defineMetricsTask, await makeDefineMetricsResult());
  if (!result.passed || result.checks.length !== 5 ||
      result.verifierId !== "intelligence.metric-definition-contract" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("Valid metric definitions did not pass: " + JSON.stringify(result));
  }
});

Deno.test("intelligence metric verifier rejects inconsistent formulas and invalid source references", async () => {
  const verifier = createIntelligenceDefineMetricsVerifier(() => fixedNow);
  const formula = await makeDefineMetricsResult();
  formula.output.metrics[1].formula = "paid / all";
  if ((await verifier.verify(defineMetricsTask, formula)).passed) {
    throw new Error("An inconsistent metric formula was accepted");
  }
  const source = await makeDefineMetricsResult();
  source.output.metrics[0].sourceFieldRefs = ["unqualified"];
  if ((await verifier.verify(defineMetricsTask, source)).passed) {
    throw new Error("An invalid source field reference was accepted");
  }
});

Deno.test("intelligence metric verifier rejects duplicate IDs and incomplete definitions", async () => {
  const verifier = createIntelligenceDefineMetricsVerifier(() => fixedNow);
  const duplicate = await makeDefineMetricsResult();
  duplicate.output.metrics[1].id = duplicate.output.metrics[0].id;
  if ((await verifier.verify(defineMetricsTask, duplicate)).passed) {
    throw new Error("Duplicate metric IDs were accepted");
  }
  const incomplete = await makeDefineMetricsResult();
  incomplete.output.metrics[0].grain = " ";
  if ((await verifier.verify(defineMetricsTask, incomplete)).passed) {
    throw new Error("A metric without a grain was accepted");
  }
});

Deno.test("intelligence metric verifier rejects forged provenance and integrates with registry", async () => {
  const verifier = createIntelligenceDefineMetricsVerifier(() => fixedNow);
  const forged = await makeDefineMetricsResult();
  forged.evidence.sourceBindings[0].sha256 = "c".repeat(64);
  if ((await verifier.verify(defineMetricsTask, forged)).passed) {
    throw new Error("Forged metric-definition provenance was accepted");
  }

  const registry = new MissionTaskRegistry();
  const result = await makeDefineMetricsResult();
  registry.register(
    "intelligence.define_metrics",
    intelligenceDefineMetricsInputV1,
    { async execute() { return result; } },
    createIntelligenceDefineMetricsVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(defineMetricsTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "intelligence.metric-definition-contract" ||
      execution.verification.checks.length !== 5) {
    throw new Error("Metric-definition registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});


const agentsPermissionsTask: MissionTaskDescriptor = {
  ...task,
  taskType: "agents.permissions",
};

function validAgentPermissions() {
  return [
    {
      id: "read-project",
      scope: { kind: "project", ref: "nova-project" },
      actions: ["read"],
      approvalRequired: false,
      reason: "Read project state within this named project.",
      sourceRefIds: ["mission-input"],
    },
    {
      id: "publish-project",
      scope: { kind: "project", ref: "nova-project" },
      actions: ["publish"],
      approvalRequired: true,
      reason: "Publishing changes can affect external users and needs owner review.",
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makeAgentsPermissionsResult() {
  return {
    output: { permissions: validAgentPermissions() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(agentsPermissionsTask.input.description as string),
      }],
    },
  };
}

Deno.test("agents permissions verifier accepts explicit least-privilege scopes and approval gates", async () => {
  const verifier = createAgentsPermissionsVerifier(() => fixedNow);
  const result = await verifier.verify(agentsPermissionsTask, await makeAgentsPermissionsResult());
  if (!result.passed || result.checks.length !== 5 ||
      result.verifierId !== "agents.permissions-least-privilege" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("Valid agent permissions did not pass: " + JSON.stringify(result));
  }
});

Deno.test("agents permissions verifier rejects wildcard scopes and unknown actions", async () => {
  const verifier = createAgentsPermissionsVerifier(() => fixedNow);
  const wildcard = await makeAgentsPermissionsResult();
  wildcard.output.permissions[0].scope.ref = "*";
  if ((await verifier.verify(agentsPermissionsTask, wildcard)).passed) {
    throw new Error("Wildcard permission scope was accepted");
  }
  const unknown = await makeAgentsPermissionsResult();
  unknown.output.permissions[0].actions = ["read", "admin"];
  if ((await verifier.verify(agentsPermissionsTask, unknown)).passed) {
    throw new Error("Unknown permission action was accepted");
  }
});

Deno.test("agents permissions verifier requires owner approval for create and update", async () => {
  const verifier = createAgentsPermissionsVerifier(() => fixedNow);
  for (const action of ["create", "update"]) {
    const result = await makeAgentsPermissionsResult();
    result.output.permissions[0].actions = [action];
    result.output.permissions[0].approvalRequired = false;
    if ((await verifier.verify(agentsPermissionsTask, result)).passed) {
      throw new Error("A mutating " + action + " permission without owner approval was accepted");
    }
  }
});

Deno.test("agents permissions verifier rejects missing approval for sensitive actions and duplicate IDs", async () => {
  const verifier = createAgentsPermissionsVerifier(() => fixedNow);
  const missingApproval = await makeAgentsPermissionsResult();
  missingApproval.output.permissions[1].approvalRequired = false;
  if ((await verifier.verify(agentsPermissionsTask, missingApproval)).passed) {
    throw new Error("A sensitive action without owner approval was accepted");
  }
  const duplicate = await makeAgentsPermissionsResult();
  duplicate.output.permissions[1].id = duplicate.output.permissions[0].id;
  if ((await verifier.verify(agentsPermissionsTask, duplicate)).passed) {
    throw new Error("Duplicate permission IDs were accepted");
  }
});

Deno.test("agents permissions verifier rejects forged provenance and integrates with registry", async () => {
  const verifier = createAgentsPermissionsVerifier(() => fixedNow);
  const forged = await makeAgentsPermissionsResult();
  forged.evidence.sourceBindings[0].sha256 = "d".repeat(64);
  if ((await verifier.verify(agentsPermissionsTask, forged)).passed) {
    throw new Error("Forged permission provenance was accepted");
  }

  const registry = new MissionTaskRegistry();
  const result = await makeAgentsPermissionsResult();
  registry.register(
    "agents.permissions",
    agentsPermissionsInputV1,
    { async execute() { return result; } },
    createAgentsPermissionsVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(agentsPermissionsTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "agents.permissions-least-privilege" ||
      execution.verification.checks.length !== 5) {
    throw new Error("Agent permissions registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});


const agentsToolGatesTask: MissionTaskDescriptor = {
  ...task,
  taskType: "agents.tool_gates",
};

function validAgentToolGates() {
  return [
    {
      id: "read-project-files",
      tool: "files.read",
      operation: "read",
      scope: { kind: "project", ref: "nova-project" },
      risk: "low",
      approvalRequired: false,
      credentialBoundary: "user_session",
      reason: "Read files explicitly attached to the current project.",
      sourceRefIds: ["mission-input"],
    },
    {
      id: "send-approved-email",
      tool: "email.send",
      operation: "send",
      scope: { kind: "resource", ref: "approved-recipient-list" },
      risk: "high",
      approvalRequired: true,
      credentialBoundary: "user_session",
      reason: "Send only the owner-approved message to the approved recipient list.",
      sourceRefIds: ["mission-input"],
    },
  ];
}

async function makeAgentsToolGatesResult() {
  return {
    output: { toolGates: validAgentToolGates() },
    evidence: {
      sourceBindings: [{
        id: "mission-input",
        kind: "mission_input",
        locator: "mission.input.description",
        sha256: await digest(agentsToolGatesTask.input.description as string),
      }],
    },
  };
}

Deno.test("agents tool-gates verifier accepts allowlisted scoped tools with approval for side effects", async () => {
  const verifier = createAgentsToolGatesVerifier(() => fixedNow);
  const executionResult = await makeAgentsToolGatesResult();
  const result = await verifier.verify(agentsToolGatesTask, executionResult);
  const persistedPolicy = { version: 1 as const, gates: executionResult.output.toolGates };
  if (!validateMissionToolPolicy(persistedPolicy)) {
    throw new Error("Verified tool-gate output does not satisfy the persisted proof policy schema");
  }
  if (!result.passed || result.checks.length !== 5 ||
      result.verifierId !== "agents.tool-gates-policy" ||
      result.verifierVersion !== "1.0.0") {
    throw new Error("Valid agent tool gates did not pass: " + JSON.stringify(result));
  }
});

Deno.test("agents tool-gates verifier rejects unknown tools and server-secret credential access", async () => {
  const verifier = createAgentsToolGatesVerifier(() => fixedNow);
  const unknown = await makeAgentsToolGatesResult();
  unknown.output.toolGates[0].tool = "shell.exec";
  if ((await verifier.verify(agentsToolGatesTask, unknown)).passed) {
    throw new Error("An unknown tool was accepted");
  }
  const secret = await makeAgentsToolGatesResult();
  secret.output.toolGates[0].credentialBoundary = "server_secret";
  if ((await verifier.verify(agentsToolGatesTask, secret)).passed) {
    throw new Error("Direct server-secret access was accepted");
  }
});

Deno.test("agents tool-gates verifier rejects wildcard scopes and missing side-effect approval", async () => {
  const verifier = createAgentsToolGatesVerifier(() => fixedNow);
  const wildcard = await makeAgentsToolGatesResult();
  wildcard.output.toolGates[0].scope.ref = "*";
  if ((await verifier.verify(agentsToolGatesTask, wildcard)).passed) {
    throw new Error("Wildcard tool scope was accepted");
  }
  const missingApproval = await makeAgentsToolGatesResult();
  missingApproval.output.toolGates[1].approvalRequired = false;
  if ((await verifier.verify(agentsToolGatesTask, missingApproval)).passed) {
    throw new Error("A side-effecting tool without approval was accepted");
  }
});

Deno.test("agents tool-gates verifier rejects mismatched operations and integrates with registry", async () => {
  const verifier = createAgentsToolGatesVerifier(() => fixedNow);
  const mismatch = await makeAgentsToolGatesResult();
  mismatch.output.toolGates[0].operation = "write";
  if ((await verifier.verify(agentsToolGatesTask, mismatch)).passed) {
    throw new Error("A mismatched tool operation was accepted");
  }

  const registry = new MissionTaskRegistry();
  const result = await makeAgentsToolGatesResult();
  registry.register(
    "agents.tool_gates",
    agentsToolGatesInputV1,
    { async execute() { return result; } },
    createAgentsToolGatesVerifier(() => fixedNow),
  );
  const execution = await registry.executeAndVerify(agentsToolGatesTask);
  if (!execution.verification.passed ||
      execution.verification.verifierId !== "agents.tool-gates-policy" ||
      execution.verification.checks.length !== 5) {
    throw new Error("Agent tool-gates registry integration failed: " +
      JSON.stringify(execution.verification));
  }
});
