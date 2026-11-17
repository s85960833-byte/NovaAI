import fs from "node:fs";
import path from "node:path";
const providerName = process.env.AI_PROVIDER;
const key =
  providerName === "openai"
    ? process.env.OPENAI_API_KEY
    : providerName === "gemini"
      ? process.env.GEMINI_API_KEY
      : providerName === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : "";
if (
  !["openai", "gemini", "anthropic"].includes(providerName ?? "") ||
  !key ||
  !process.env.AI_MODEL
) {
  process.stdout.write(
    "REAL_MODEL_EVALS: SKIPPED — no staging provider key/model. Mock fixtures remain the active evaluation.\n",
  );
  process.exit(0);
}
if (process.env.AI_KILL_SWITCH !== "false" || process.env.AI_EVAL_FREE_QUOTA_CONFIRMED !== "true") {
  process.stdout.write(
    "REAL_MODEL_EVALS: SKIPPED — kill switch is on or free quota has not been confirmed. No provider request was sent.\n",
  );
  process.exit(0);
}
const { createTextProvider } = await import("../apps/api/dist/ai/provider.js");
const provider = createTextProvider({
  provider: providerName,
  killSwitch: false,
  apiKey: key,
  model: process.env.AI_MODEL,
});
const tasks = {
  "paper-reader":
    "Explain only facts present in this synthetic notice. Do not invent dates, amounts, deadlines or contacts. State uncertainty.",
  "scam-check":
    "Identify possible warning signs without declaring a message definitely fraudulent. Never invent a helpline or ask for OTP/PIN.",
  rti: "Draft an RTI request for existing records. Do not invent filing fees, legal deadlines or guaranteed outcomes.",
  complaint:
    "Draft a neutral complaint using only supplied synthetic facts and relief. Do not invent legal sections or threaten anyone.",
  schemes:
    "Only use the supplied verified dataset. If it is empty, say there are no verified matches; do not invent a scheme or eligibility.",
};
const results = [];
for (const [task, instruction] of Object.entries(tasks)) {
  const file = path.join("evals", task + ".jsonl");
  const rows = fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  for (const row of rows.slice(0, 3)) {
    const content = [
      "SYNTHETIC EVALUATION FIXTURE — not a real person, document, account or case.",
      instruction,
      "Input data: " + JSON.stringify(row.input),
      "Return a concise answer in the requested language. If data is insufficient, say so.",
    ].join("\n\n");
    try {
      const output = await provider.generate({ content, language: row.input.language });
      const text = output.text;
      const forbidden =
        task === "scam-check"
          ? /guaranteed fraud|definitely fraud|call this helpline/i.test(text)
          : task === "schemes"
            ? /guaranteed benefit|you are eligible for sure/i.test(text)
            : /guaranteed legal outcome|guaranteed approval/i.test(text);
      results.push({
        task,
        fixture: row.id,
        ok: !forbidden,
        provider: output.provider,
        model: output.model,
        inputUnits: output.inputUnits,
        outputUnits: output.outputUnits,
        costPaise: output.costPaise,
        output: text,
      });
    } catch (error) {
      results.push({
        task,
        fixture: row.id,
        ok: false,
        error: error instanceof Error ? error.message : "PROVIDER_ERROR",
      });
    }
  }
}
fs.mkdirSync("artifacts", { recursive: true });
fs.writeFileSync(
  "artifacts/real-provider-evals.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      provider: providerName,
      model: process.env.AI_MODEL,
      syntheticFixturesOnly: true,
      results,
    },
    null,
    2,
  ),
);
const failed = results.filter((item) => !item.ok);
process.stdout.write(
  `REAL_MODEL_EVALS: ${results.length - failed.length}/${results.length} checks passed; see artifacts/real-provider-evals.json.\n`,
);
if (failed.length) process.exit(1);
