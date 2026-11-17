import { it, expect } from "vitest";
import { matchSchemes, type SchemeRecord } from "./schemes.js";
const base: SchemeRecord = {
  id: "synthetic",
  name_en: "Synthetic scholarship",
  name_hi: "काल्पनिक छात्रवृत्ति",
  level: "state",
  state: "Uttar Pradesh",
  tags: ["student", "scholarship"],
  eligibility_json: {
    min_age: 14,
    max_age: 25,
    max_annual_income: 300000,
    states: ["Uttar Pradesh"],
  },
  benefits: "Synthetic test only",
  how_to_apply: ["Check official page"],
  documents_required: ["Proof"],
  official_url: "https://example.gov.in/synthetic",
  last_verified: "2026-11-01",
  status: "active",
};
it("matches only records satisfying state, tag, age and income", () => {
  const result = matchSchemes(
    [base],
    { state: "Uttar Pradesh", tags: ["student"], age: 18, annual_income: 200000 },
    new Date("2026-11-17"),
  );
  expect(result.datasetStatus).toBe("ready");
  expect(result.records).toHaveLength(1);
});
it("excludes stale, closed and non-HTTPS records", () => {
  const result = matchSchemes(
    [
      { ...base, last_verified: "2025-01-01" },
      { ...base, id: "closed", status: "closed" },
      { ...base, id: "unsafe", official_url: "http://example.gov.in" },
    ],
    {},
    new Date("2026-11-17"),
  );
  expect(result.records).toHaveLength(0);
  expect(result.datasetStatus).toBe("no_matches");
});
it("keeps an empty dataset explicitly pending owner review", () => {
  expect(matchSchemes([], { state: "Uttar Pradesh" })).toEqual({
    datasetStatus: "owner_review_pending",
    records: [],
  });
});
