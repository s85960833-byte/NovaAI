import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.use({ trace: "off", screenshot: "off", video: "off" });

type Scenario = {
  p50Ms: number;
  p95Ms: number;
  refreshEstimateHz: number;
  budgetMs: number;
  droppedFrames: number;
  droppedPercent: number;
  overBudgetIntervals: number;
  longTaskCount: number;
  maxLongTaskMs: number;
  samples: number;
  pass: boolean;
};

test("profiles entry animation, drawer, Diwan and Sakha interaction frame cadence", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    sessionStorage.clear();
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      get: () => 8,
    });
  });
  await page.goto("/");
  await expect(page.locator(".intro")).toBeVisible({ timeout: 3000 });

  const scenarios: Record<string, Scenario> = {};
  const sample = async (name: string) => {
    const frames = await page.evaluate(async () => {
      const values: number[] = [];
      const longTasks: number[] = [];
      let observer: PerformanceObserver | undefined;
      if (
        typeof PerformanceObserver !== "undefined" &&
        PerformanceObserver.supportedEntryTypes?.includes("longtask")
      ) {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) longTasks.push(entry.duration);
        });
        observer.observe({ type: "longtask", buffered: true });
      }
      let previous = 0;
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          if (previous) values.push(now - previous);
          previous = now;
          if (values.length >= 60) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      observer?.disconnect();
      return { values, longTasks };
    });

    const { values: intervals, longTasks } = frames;
    const sorted = [...intervals].sort((a, b) => a - b);
    const percentile = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? 0;
    const p50Raw = percentile(0.5);
    const p95Raw = percentile(0.95);
    const p50Ms = Number(p50Raw.toFixed(2));
    const p95Ms = Number(p95Raw.toFixed(2));
    const refreshEstimateHz = p50Raw <= 9.5 ? 120 : p50Raw <= 13.8 ? 90 : 60;
    const budgetMs = ({ 60: 16.7, 90: 11.1, 120: 8.3 } as const)[refreshEstimateHz];
    const droppedFrames = intervals.reduce(
      (total, ms) => total + (ms > budgetMs * 1.5 ? Math.max(1, Math.round(ms / budgetMs) - 1) : 0),
      0,
    );
    const droppedPercent = Number(((droppedFrames / intervals.length) * 100).toFixed(1));

    scenarios[name] = {
      p50Ms,
      p95Ms,
      refreshEstimateHz,
      budgetMs: Number(budgetMs.toFixed(2)),
      droppedFrames,
      droppedPercent,
      samples: intervals.length,
      maxFrameMs: Number(Math.max(...intervals).toFixed(2)),
      overBudgetIntervals: intervals.filter((ms) => ms > budgetMs).length,
      longTaskCount: longTasks.length,
      maxLongTaskMs: Number(Math.max(...longTasks, 0).toFixed(2)),
      pass: p95Raw <= budgetMs && droppedPercent <= 5,
    };
  };

  await sample("entry-animation");
  await expect(page.locator(".minister-card.diwan")).toBeVisible();
  await expect(page.locator(".intro")).toHaveCount(0, { timeout: 2500 });
  await page.waitForTimeout(300);
  await sample("darbar-idle");

  const drawerMeasurement = sample("drawer-open");
  await page.locator(".topbar .icon-button").click();
  await expect(page.locator(".drawer")).toBeVisible();
  await drawerMeasurement;
  await page.locator(".drawer-head .icon-button").click();

  const diwanMeasurement = sample("diwan-transition");
  await page.locator(".minister-card.diwan").click();
  await diwanMeasurement;
  const diwanScrollMeasurement = sample("diwan-scroll");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await diwanScrollMeasurement;

  await page.route("**/api/sakha/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Photosynthesis is the process plants use to make food from light.",
        mode: "mock",
        stored: false,
      }),
    });
  });
  await page.locator(".bottom-nav button").nth(2).click();
  for (let index = 0; index < 6; index += 1) {
    await page.locator(".composer textarea").fill(
      "Explain one simple science fact, example " + String(index + 1) + ".",
    );
    await page.locator(".send-button").click();
    await expect(page.locator(".chat-thread .chat-bubble")).toHaveCount((index + 1) * 2);
  }
  const thread = page.locator(".chat-thread");
  const sakhaScrollMeasurement = sample("sakha-chat-scroll");
  await thread.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
  });
  await sakhaScrollMeasurement;

  const report = {
    environment: "Playwright Chromium; emulated browser cadence only; not physical device proof",
    scenarios,
    allScenarioBudgetsPass: Object.values(scenarios).every((item) => item.pass),
    physical90HzVerified: false,
    physical120HzVerified: false,
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/frame-time-metrics.json", JSON.stringify(report, null, 2));
  await test.info().attach("frame-time-metrics.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  expect(Object.values(scenarios).every((item) => item.samples === 60)).toBeTruthy();
  expect(
    Object.entries(scenarios)
      .filter(([, item]) => !item.pass)
      .map(([name, item]) => ({
        name,
        p50: item.p50Ms,
        p95: item.p95Ms,
        dropped: item.droppedFrames,
        overBudget: item.overBudgetIntervals,
        maxFrame: item.maxFrameMs,
        longTasks: item.longTaskCount,
      })),
  ).toEqual([]);
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("reduced-motion devices skip the entry animation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    sessionStorage.clear();
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      get: () => 8,
    });
  });
  await page.goto("/");
  await expect(page.locator(".minister-card.diwan")).toBeVisible();
  await expect(page.locator(".intro")).toHaveCount(0);
});
