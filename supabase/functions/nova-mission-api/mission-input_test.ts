import { validateMissionInput } from "./mission-input.ts";
import { RequestInputError } from "../nova-bi-api/request-input.ts";

Deno.test("validates mission input and applies safe defaults", () => {
  const value = validateMissionInput({ title: "  Build my site  " });
  if (value.title !== "Build my site" || value.workspace !== "agents" ||
      value.description !== "" || value.idempotencyKey !== null ||
      Object.keys(value.plan).length !== 0) {
    throw new Error("Mission input defaults or title normalization are incorrect");
  }
});

Deno.test("accepts the four NOVA workspaces and bounded idempotency key", () => {
  const value = validateMissionInput({
    title: "Research report",
    workspace: "learn",
    idempotency_key: "request-123",
    plan: { tasks: ["collect", "summarize"] },
  });
  if (value.workspace !== "learn" || value.idempotencyKey !== "request-123" ||
      !Array.isArray(value.plan.tasks)) {
    throw new Error("Valid mission input was not preserved");
  }
});

Deno.test("rejects empty and oversized mission titles", () => {
  for (const title of [" ", "x".repeat(201)]) {
    try {
      validateMissionInput({ title });
      throw new Error("Invalid title was accepted");
    } catch (error) {
      if (!(error instanceof RequestInputError) || error.status !== 400) throw error;
    }
  }
});

Deno.test("rejects unsupported workspaces and malformed plan values", () => {
  for (const input of [
    { title: "x", workspace: "unknown" },
    { title: "x", plan: [] },
    { title: "x", plan: null },
  ]) {
    try {
      validateMissionInput(input);
      throw new Error("Invalid mission input was accepted");
    } catch (error) {
      if (!(error instanceof RequestInputError) || error.status !== 400) throw error;
    }
  }
});

Deno.test("rejects oversized mission plans and invalid idempotency keys", () => {
  try {
    validateMissionInput({ title: "x", plan: { content: "x".repeat(100001) } });
    throw new Error("Oversized plan was accepted");
  } catch (error) {
    if (!(error instanceof RequestInputError) || error.status !== 413) throw error;
  }

  try {
    validateMissionInput({ title: "x", idempotency_key: " " });
    throw new Error("Blank idempotency key was accepted");
  } catch (error) {
    if (!(error instanceof RequestInputError) || error.status !== 400) throw error;
  }
});

Deno.test("rejects unknown mission creation fields instead of silently ignoring them", () => {
  for (const input of [
    { title: "x", owner_id: "attacker-controlled" },
    { title: "x", worker_id: "untrusted-worker" },
    { title: "x", execute_now: true },
  ]) {
    try {
      validateMissionInput(input);
      throw new Error("Unknown mission creation field was accepted");
    } catch (error) {
      if (!(error instanceof RequestInputError) ||
          error.status !== 400 ||
          !error.message.includes("unsupported fields")) throw error;
    }
  }
});
