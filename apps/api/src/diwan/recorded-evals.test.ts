import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { conservativePaperFallback } from "./paper-reader.js";
import { checkScamText } from "./scam-check.js";
import { buildRtiDraft, buildComplaintDraft } from "./drafts.js";
import { matchSchemes } from "./schemes.js";
type Fixture = {
  id: string;
  input: Record<string, unknown>;
  must_not_include: string[];
  schema_valid: boolean;
};
function fixtures(name: string): Fixture[] {
  return fs
    .readFileSync(`evals/${name}.jsonl`, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Fixture);
}
describe("recorded synthetic Diwan evaluations — deterministic mock mode", () => {
  it("paper reader preserves uncertainty for every recorded fixture", () => {
    const rows = fixtures("paper-reader");
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      const result = conservativePaperFallback(String(row.input.text ?? ""));
      expect(result.confidence).toBeLessThanOrEqual(0.1);
      expect(result.key_dates).toHaveLength(0);
      expect(result.amounts).toHaveLength(0);
      expect(result.disclaimer_key).toBe("guidance_not_legal_advice");
    }
  });
  it("scam checks never claim a definitive fraud verdict or invent helplines", () => {
    const rows = fixtures("scam-check");
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      const result = checkScamText(String(row.input.text ?? ""));
      expect(["low", "medium", "high", "very_high"]).toContain(result.riskLevel);
      expect(result.whatToDo.join(" ")).toMatch(/OTP|PIN/i);
      expect(result.officialContacts).toEqual([]);
      expect(result.disclaimer).toMatch(/not a definitive/i);
    }
  });
  it("RTI drafts include only the supplied authority, subject and questions", () => {
    const rows = fixtures("rti");
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      const input = row.input;
      const draft = buildRtiDraft({
        authority: String(input.authority),
        subject: String(input.subject),
        questions: Array.isArray(input.questions) ? input.questions.map(String) : [],
        language: input.language === "en" ? "en" : "hi",
      });
      expect(draft).toContain(String(input.authority));
      expect(draft).toContain(String(input.subject));
      expect(draft).toMatch(/applicable rules|लागू नियमों/i);
      expect(draft).not.toMatch(/₹\s*\d+|within \d+ days/i);
    }
  });
  it("complaint drafts preserve facts and requested relief without fabricated law", () => {
    const rows = fixtures("complaint");
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      const input = row.input;
      const draft = buildComplaintDraft({
        category: String(input.category),
        facts: String(input.facts),
        relief: String(input.relief),
        language: input.language === "en" ? "en" : "hi",
      });
      expect(draft).toContain(String(input.facts));
      expect(draft).toContain(String(input.relief));
      expect(draft).toMatch(/Attachments:|संलग्नक:/);
      expect(draft).not.toMatch(/Section \d+|धारा \d+/i);
    }
  });
  it("scheme matching returns no invented entries while the approved dataset is empty", () => {
    const rows = fixtures("schemes");
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      const result = matchSchemes([], {
        state: String(row.input.state),
        tags: Array.isArray(row.input.tags) ? row.input.tags.map(String) : [],
      });
      expect(result.datasetStatus).toBe("owner_review_pending");
      expect(result.records).toEqual([]);
    }
  });
});
