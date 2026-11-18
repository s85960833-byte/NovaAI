import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const allowedAdvisory =
  "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";

function runNpm(args) {
  const result = spawnSync(npmCommand, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, npm_config_audit: "true", npm_config_fund: "false" },
  });

  if (result.error) throw result.error;
  return result;
}

// Production dependencies must always be fully clear of high/critical advisories.
const production = runNpm(["audit", "--omit=dev", "--audit-level=high"]);
if (production.status !== 0) {
  process.stderr.write(production.stdout || "");
  process.stderr.write(production.stderr || "");
  throw new Error("PRODUCTION_DEPENDENCY_AUDIT_FAILED");
}
process.stdout.write("PRODUCTION_DEPENDENCY_AUDIT_PASS\n");

// Keep a full-tree audit. The only permitted residual is the currently unpatched
// development-toolchain picomatch advisory; new advisories remain build blockers.
const full = runNpm(["audit", "--json"]);
let report;
try {
  report = JSON.parse(full.stdout);
} catch {
  process.stderr.write(full.stdout || "");
  process.stderr.write(full.stderr || "");
  throw new Error("FULL_DEPENDENCY_AUDIT_JSON_INVALID");
}

const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const high = vulnerabilities.filter(([, item]) =>
  ["high", "critical"].includes(item.severity),
);
const advisoryUrls = new Set();

for (const [, item] of high) {
  for (const via of item.via ?? []) {
    if (typeof via === "object" && typeof via.url === "string") {
      advisoryUrls.add(via.url);
    }
  }
}

const unexpectedAdvisories = [...advisoryUrls].filter((url) => url !== allowedAdvisory);
if (unexpectedAdvisories.length > 0) {
  process.stderr.write(
    "Unexpected high/critical advisories: " + unexpectedAdvisories.join(", ") + "\n",
  );
  throw new Error("UNEXPECTED_HIGH_OR_CRITICAL_DEV_ADVISORY");
}

if (high.length > 0 && !advisoryUrls.has(allowedAdvisory)) {
  throw new Error("UNCLASSIFIED_HIGH_OR_CRITICAL_DEV_ADVISORY");
}

if (full.status !== 0 && high.length === 0) {
  process.stderr.write(full.stderr || "");
  throw new Error("FULL_DEPENDENCY_AUDIT_FAILED_FOR_UNCLASSIFIED_REASON");
}

if (high.length > 0) {
  process.stdout.write(
    "DEV_DEPENDENCY_ADVISORY_EXCEPTION: " +
      allowedAdvisory +
      "\nHigh/critical dependency paths: " +
      high.length +
      "\nScope: development/build/test toolchain only; production audit passed.\n" +
      "This remains an open risk until upstream publishes a patched picomatch release.\n",
  );
} else {
  process.stdout.write("FULL_DEPENDENCY_AUDIT_PASS\n");
}
