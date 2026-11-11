import {
  createLearnTopicSequenceVerifier,
  learnTopicSequenceInputV1,
} from "./mission-task-verifiers.ts";
import type { MissionTaskDescriptor } from "./mission-task-registry.ts";

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
