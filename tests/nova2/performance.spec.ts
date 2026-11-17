import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("records browser-emulated frame-time percentiles for Darbar interactions", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?perf=1");
  const skip = page.locator(".skip");
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });

  const scenarios: Record<
    string,
    { p50: number; p95: number; droppedAt120: number; droppedAt60: number; samples: number }
  > = {};
  const sample = async (name: string) => {
    const values = await page.evaluate(async () => {
      const frames: number[] = [];
      let previous = 0;
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          if (previous) frames.push(now - previous);
          previous = now;
          if (frames.length >= 60) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return frames;
    });
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
    scenarios[name] = {
      p50: Number(percentile(0.5).toFixed(2)),
      p95: Number(percentile(0.95).toFixed(2)),
      droppedAt120: values.filter((v) => v > 8.3).length,
      droppedAt60: values.filter((v) => v > 16.7).length,
      samples: values.length,
    };
  };

  await sample("darbar-idle");
  await page.locator(".topbar .icon-button").click();
  await expect(page.locator(".drawer")).toBeVisible();
  await sample("drawer-open");
  await page.locator(".drawer-head .icon-button").click();
  await page.locator(".minister-card.diwan").click();
  await sample("diwan-transition");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await sample("diwan-scroll");

  const report = {
    environment:
      "Playwright Chromium CI; browser-emulated, refresh rate not physically verified",
    budgetsMs: { hz120: 8.3, hz90: 11.1, hz60: 16.7 },
    scenarios,
    appMonitor: await page.evaluate(() => ({
      refreshRate: document.documentElement.dataset.frameRefreshRate ?? null,
      p50Ms: document.documentElement.dataset.frameP50 ?? null,
      p95Ms: document.documentElement.dataset.frameP95 ?? null,
      droppedFrames: document.documentElement.dataset.frameDropped ?? null,
      longAnimationFrames: document.documentElement.dataset.longAnimationFrames ?? "0",
    })),
    physical120HzVerified: false,
  };
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/frame-time-metrics.json", JSON.stringify(report, null, 2));
  await test.info().attach("frame-time-metrics.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  expect(Object.values(scenarios).every((item) => item.samples === 60)).toBeTruthy();
});
