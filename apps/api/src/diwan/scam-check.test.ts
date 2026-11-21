import { it, expect } from "vitest";
import { checkScamText } from "./scam-check.js";
it("flags requests for OTP and remote access as very high risk", () => {
  const result = checkScamText(
    "Your bank account is blocked. Share OTP and install remote access now.",
  );
  expect(result.riskLevel).toBe("very_high");
  expect(result.indicators).toContain("SECRET_REQUEST");
  expect(result.indicators).toContain("REMOTE_ACCESS");
  expect(result.officialContacts).toEqual([]);
});
it("does not make a definitive fraud verdict", () => {
  const result = checkScamText("Please review this normal appointment reminder.");
  expect(result.riskLevel).toBe("low");
  expect(result.disclaimer).toContain("not a definitive");
});
