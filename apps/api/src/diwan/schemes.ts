export type SchemeRecord = {
  id: string;
  name_en: string;
  name_hi: string;
  state: string | null;
  level: "central" | "state";
  tags: string[];
  official_url: string;
  last_verified: string;
  status: "active" | "closed" | "unknown";
  eligibility_json: Record<string, unknown>;
};
export function matchSchemes(
  records: SchemeRecord[],
  answers: { state?: string; tags?: string[] },
) {
  return records.filter(
    (record) =>
      record.status === "active" &&
      /^https:\/\//.test(record.official_url) &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.last_verified) &&
      (!record.state || !answers.state || record.state === answers.state) &&
      (!answers.tags?.length || answers.tags.some((tag) => record.tags.includes(tag))),
  );
}
