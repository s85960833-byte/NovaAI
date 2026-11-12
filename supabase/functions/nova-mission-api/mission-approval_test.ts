import { validateApprovalDecision, validateApprovalRequest } from "./mission-approval.ts";

Deno.test("validates bounded approval request data", () => {
  const value = validateApprovalRequest({
    request_key: "request-123",
    action_summary: "Review an internal task before it is authorized",
  });
  if (value.requestKey !== "request-123" || !value.actionSummary.startsWith("Review")) {
    throw new Error("Approval request fields were not normalized");
  }
});

Deno.test("rejects missing and oversized approval request fields", () => {
  for (const input of [
    {},
    { request_key: "x", action_summary: " " },
    { request_key: "x".repeat(161), action_summary: "valid" },
    { request_key: "valid", action_summary: "x".repeat(2001) },
  ]) {
    try {
      validateApprovalRequest(input);
      throw new Error("Invalid approval request was accepted");
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
});

Deno.test("accepts only explicit approve/reject decisions and bounded notes", () => {
  if (validateApprovalDecision({ decision: "approve" }).decision !== "approve") {
    throw new Error("Approve decision was not accepted");
  }
  if (validateApprovalDecision({ decision: "reject", decision_note: "Needs revision" }).decision !== "reject") {
    throw new Error("Reject decision was not accepted");
  }
  for (const input of [
    {},
    { decision: "maybe" },
    { decision: "approve", decision_note: 4 },
    { decision: "reject", decision_note: "x".repeat(1001) },
  ]) {
    try {
      validateApprovalDecision(input);
      throw new Error("Invalid approval decision was accepted");
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
});

Deno.test("rejects unknown approval request and decision fields", () => {
  for (const run of [
    () => validateApprovalRequest({
      request_key: "request-123",
      action_summary: "Review an internal task",
      owner_id: "untrusted",
    }),
    () => validateApprovalDecision({
      decision: "approve",
      execute_now: true,
    }),
  ]) {
    try {
      run();
      throw new Error("Unknown approval field was accepted");
    } catch (error) {
      if (!(error instanceof TypeError) ||
          !error.message.includes("unsupported fields")) throw error;
    }
  }
});
