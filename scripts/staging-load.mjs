import { mkdirSync, writeFileSync } from "node:fs";

const base = (process.env.STAGING_URL ?? "https://nova-2-staging.onrender.com").replace(/\/+$/, "");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url) {
  const started = performance.now();
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "cache-control": "no-cache" },
  });
  const elapsed = performance.now() - started;

  if (!response.ok) throw new Error("HTTP_" + response.status + "_" + url);

  if (url.endsWith("/api/health")) {
    const body = await response.json();
    if (!body.ok || !body.ready) throw new Error("STAGING_NOT_READY");
  } else if (!(await response.text()).includes("NOVA")) {
    throw new Error("STAGING_HTML_INVALID");
  }

  return elapsed;
}

let ready = false;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    await request(base + "/api/health");
    ready = true;
    break;
  } catch {
    await pause(5000);
  }
}
if (!ready) throw new Error("STAGING_HEALTH_WARMUP_FAILED");

const timings = [];
const errors = [];
let perfRouteReachable = false;
try {
  const response = await fetch(base + "/perf", { signal: AbortSignal.timeout(8000) });
  const html = await response.text();
  perfRouteReachable =
    response.ok &&
    response.headers.get("content-type")?.includes("text/html") === true &&
    html.includes('id="root"');
  if (!perfRouteReachable) errors.push("PERF_ROUTE_NOT_REACHABLE");
} catch (error) {
  errors.push("PERF_ROUTE_FAILED: " + String(error));
}
await Promise.all(
  Array.from({ length: 3 }, async (_, worker) => {
    for (let round = 0; round < 8; round++) {
      const url = (round + worker) % 2 === 0 ? base + "/api/health" : base + "/";
      try {
        timings.push(await request(url));
      } catch (error) {
        errors.push(String(error));
      }
    }
  }),
);

const sorted = [...timings].sort((a, b) => a - b);
const percentile = (p) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? 0;
const p50Ms = percentile(0.5);
const p95Ms = percentile(0.95);
const report = {
  target: base,
  profile: "3 concurrent workers × 8 GET; health/static home only; no writes or user data",
  requests: 24,
  perfRouteChecks: 1,
  perfRouteReachable,
  succeeded: timings.length,
  failed: errors.length,
  p50Ms: Number(p50Ms.toFixed(1)),
  p95Ms: Number(p95Ms.toFixed(1)),
  maxMs: Number(Math.max(...timings, 0).toFixed(1)),
  errors,
  pass: errors.length === 0 && perfRouteReachable && p95Ms < 3000,
  capturedAt: new Date().toISOString(),
};

mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/staging-load.json", JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify(report) + "\n");
if (!report.pass) process.exitCode = 1;
