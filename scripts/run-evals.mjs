import fs from "node:fs";
import path from "node:path";
const tasks = ["paper-reader", "scam-check", "rti", "complaint", "schemes"];
let failed = false;
for (const task of tasks) {
  const file = path.join("evals", task + ".jsonl");
  const rows = fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const ids = new Set(rows.map((row) => row.id));
  const languages = new Set(rows.map((row) => row.input.language));
  const ok =
    rows.length >= 30 &&
    ids.size === rows.length &&
    ["hi", "en", "hinglish"].every((x) => languages.has(x)) &&
    rows.every(
      (row) =>
        row.schema_valid === true &&
        Array.isArray(row.must_include) &&
        Array.isArray(row.must_not_include),
    );
  process.stdout.write(task + ": " + rows.length + " cases; " + (ok ? "PASS" : "FAIL") + "\\n");
  if (!ok) failed = true;
}
if (failed) process.exit(1);
process.stdout.write(
  "EVAL FIXTURE VALIDATION PASS — semantic model quality NOT VERIFIED (mock mode).\\n",
);
