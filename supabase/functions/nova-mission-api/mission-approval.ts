export interface ApprovalRequestInput {
  requestKey: string;
  actionSummary: string;
}

export interface ApprovalDecisionInput {
  decision: "approve" | "reject";
  decisionNote: string;
}

export function validateApprovalRequest(value: Record<string, unknown>): ApprovalRequestInput {
  const requestKey = typeof value.request_key === "string" ? value.request_key.trim() : "";
  const actionSummary = typeof value.action_summary === "string" ? value.action_summary.trim() : "";
  if (requestKey.length < 1 || requestKey.length > 160) {
    throw new TypeError("request_key must contain 1–160 characters");
  }
  if (actionSummary.length < 1 || actionSummary.length > 2000) {
    throw new TypeError("action_summary must contain 1–2000 characters");
  }
  return { requestKey, actionSummary };
}

export function validateApprovalDecision(value: Record<string, unknown>): ApprovalDecisionInput {
  if (value.decision !== "approve" && value.decision !== "reject") {
    throw new TypeError("decision must be approve or reject");
  }
  const decisionNote = value.decision_note === undefined ? "" :
    typeof value.decision_note === "string" ? value.decision_note : null;
  if (decisionNote === null || decisionNote.length > 1000) {
    throw new TypeError("decision_note must be a string up to 1000 characters");
  }
  return { decision: value.decision, decisionNote };
}
