import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

type Scenario = { p50Ms: number; p95Ms: number; refreshEstimateHz: number; budgetMs: number; droppedFrames: number; droppedPercent: number; samples: number; pass: boolean };

test("profiles entry animation, drawer, Diwan and Sakha interaction frame cadence", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?perf=1");
  const scenarios: Record<string, Scenario> = {};
  const sample = async (name: string) => {
    const frames = await page.evaluate(async () => {
      const values: number[] = [];
      let previous = 0;
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          if (previous) values.push(now - previous);
          previous = now;
          if (values.length >= 90) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return values;
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const percentile = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? 0;
    const p50Ms = Number(percentile(0.5).toFixed(2));
    const p95Ms = Number(percentile(0.95).toFixed(2));
    const refreshEstimateHz = p50Ms <= 9.5 ? 120 : p50Ms <= 13.8 ? 90 : 60;
    const budgetMs = 1000 / refreshEstimateHz;
    const droppedFrames = frames.reduce((sum, ms) => sum + (ms > budgetMs * 1.5 ? Math.max(1, Math.round(ms / budgetMs) - 1) : 0), 0);
    const droppedPercent = Number((droppedFrames / frames.length * 100).toFixed(1));
    scenarios[name] = { p50Ms, p95Ms, refreshEstimateHz, budgetMs: Number(budgetMs.toFixed(2)), droppedFrames, droppedPercent, samples: frames.length, pass: p95Ms <= budgetMs && droppedPercent <= 5 };
  };
  await expect(page.locator(".minister-card.diwan")).toBeVisible();
  if (await page.locator(".intro").isVisible().catch(() => false)) await sample("entry-animation");
  if (await page.locator(".skip").isVisible().catch(() => false)) await page.locator(".skip").click({ force: true });
  await sample("darbar-idle");
  await page.locator(".topbar .icon-button").click();
  await expect(page.locator(".drawer")).toBeVisible();
  await sample("drawer-open");
  await page.locator(".drawer-head .icon-button").click();
  await page.locator(".minister-card.diwan").click();
  await sample("diwan-transition");
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await sample("diwan-scroll");
  await page.locator(".bottom-nav button").nth(2).click();
  await page.locator(".composer textarea").fill("What is photosynthesis? Explain in two simple sentences.");
  await page.locator(".send-button").click();
  await expect(page.locator(".chat-thread .chat-bubble")).toHaveCount(2);
  await sample("sakha-chat-scroll");
  const report = {
    environment: "Playwright Chromium; emulated browser cadence only; not physical device proof",
    scenarios,
    allScenarioBudgetsPass: Object.values(scenarios).every((item) => item.pass),
    physical90HzVerified: false,
    physical120HzVerified: false,
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/frame-time-metrics.json", JSON.stringify(report, null, 2));
  await test.info().attach("frame-time-metrics.json", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
  expect(Object.values(scenarios).every((item) => item.samples === 90)).toBeTruthy();
});

test("public /perf page measures cadence and displays a one-screen result", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/perf");
  await expect(page.getByRole("heading", { name: "NOVA Frame Check" })).toBeVisible();
  await expect(page.getByText(/observed cadence/)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/p50 frame/)).toBeVisible();
  await expect(page.getByText(/p95 frame/)).toBeVisible();
  await expect(page.getByText(/Dropped frames/)).toBeVisible();
  await expect(page.locator(".perf-caveat")).toContainText("does not certify 90/120 Hz hardware");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});