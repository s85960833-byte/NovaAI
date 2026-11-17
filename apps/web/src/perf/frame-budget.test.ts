import { it, expect } from "vitest";
import { evaluateFrame, percentile, FRAME_BUDGET_MS } from "./frame-budget.js";
it("uses native refresh-rate frame budgets", () => {
  expect(FRAME_BUDGET_MS[120]).toBe(8.3);
  expect(FRAME_BUDGET_MS[90]).toBe(11.1);
  expect(FRAME_BUDGET_MS[60]).toBe(16.7);
  expect(evaluateFrame(8.2, 120).withinBudget).toBe(true);
  expect(evaluateFrame(9, 120).withinBudget).toBe(false);
});
it("calculates p95 from frame samples", () => {
  expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
  expect(percentile([], 95)).toBe(0);
});
