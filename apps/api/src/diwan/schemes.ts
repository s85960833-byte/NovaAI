import fs from "node:fs";
import path from "node:path";
export type SchemeEligibility = {
  min_age?: number;
  max_age?: number;
  max_annual_income?: number;
  states?: string[];
};
export type SchemeRecord = {
  id: string;
  name_en: string;
  name_hi: string;
  level: "central" | "state";
  state?: string | null;
  tags: string[];
  eligibility_json: SchemeEligibility;
  benefits: string;
  how_to_apply: string[];
  documents_required: string[];
  official_url: string;
  last_verified: string;
  status: "active" | "closed" | "unknown";
};
export type SchemeQuery = {
  state?: string | undefined;
  tags?: string[] | undefined;
  age?: number | undefined;
  annual_income?: number | undefined;
};
export function loadApprovedSchemes(
  file = path.resolve(process.cwd(), "data/schemes/approved.json"),
): SchemeRecord[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed as SchemeRecord[];
  } catch {
    return [];
  }
}
export function matchSchemes(records: SchemeRecord[], query: SchemeQuery, now = new Date()) {
  const fresh = records.filter(
    (record) =>
      record.status === "active" &&
      /^https:\/\//.test(record.official_url) &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.last_verified) &&
      Number.isFinite(Date.parse(record.last_verified)) &&
      now.getTime() - Date.parse(record.last_verified) <= 180 * 24 * 60 * 60 * 1000,
  );
  const matches = fresh.filter((record) => {
    if (
      query.state &&
      record.level === "state" &&
      record.state?.toLowerCase() !== query.state.toLowerCase()
    )
      return false;
    if (query.tags?.length && !query.tags.every((tag) => record.tags.includes(tag))) return false;
    if (
      query.age !== undefined &&
      record.eligibility_json.min_age !== undefined &&
      query.age < record.eligibility_json.min_age
    )
      return false;
    if (
      query.age !== undefined &&
      record.eligibility_json.max_age !== undefined &&
      query.age > record.eligibility_json.max_age
    )
      return false;
    if (
      query.annual_income !== undefined &&
      record.eligibility_json.max_annual_income !== undefined &&
      query.annual_income > record.eligibility_json.max_annual_income
    )
      return false;
    if (
      query.state &&
      record.eligibility_json.states?.length &&
      !record.eligibility_json.states.some(
        (state) => state.toLowerCase() === query.state?.toLowerCase(),
      )
    )
      return false;
    return true;
  });
  return {
    datasetStatus:
      records.length === 0 ? "owner_review_pending" : matches.length === 0 ? "no_matches" : "ready",
    records: matches.sort((a, b) => a.name_en.localeCompare(b.name_en)),
  };
}
