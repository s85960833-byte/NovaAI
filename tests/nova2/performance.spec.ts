import { test, expect } from "@playwright/test";

test("records browser-emulated frame-time percentiles for the Darbar shell", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const skip = page.getByRole("button", { name: /इंट्रो छोड़ें|Skip intro/ });
  if (await skip.isVisible().catch(() => false)) await skip.click();

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
          if (frames.length >= 180) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return frames;
    });
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
    const result = {
      p50: Number(percentile(0.5).toFixed(2)),
      p95: Number(percentile(0.95).toFixed(2)),
      droppedAt120: values.filter((v) => v > 8.3).length,
      droppedAt60: values.filter((v) => v > 16.7).length,
      samples: values.length,
    };
    scenarios[name] = result;
  };

  await sample("darbar-idle");
  await page.locator(".topbar .icon-button").click();
  await expect(page.locator(".drawer")).toBeVisible();
  await sample("drawer-open");
  await page.keyboard.press("Escape");
  await page
    .locator(".bottom-nav button")
    .last()
    .click()
    .catch(() => undefined);
  await sample("navigation");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
  );
  await sample("scroll");
  await test.info().attach("frame-time-metrics.json", {
    body: JSON.stringify(
      {
        environment:
          "Playwright Chromium CI; browser-emulated, refresh rate not physically verified",
        budgetsMs: { hz120: 8.3, hz90: 11.1, hz60: 16.7 },
        scenarios,
        physical120HzVerified: false,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(Object.values(scenarios).every((x) => x.samples >= 180)).toBeTruthy();
});
