import { test, expect } from "@playwright/test";

async function enterDarbar(page: import("@playwright/test").Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: /इंट्रो छोड़ें|Skip intro/ });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test("Darbar fits narrow Android viewports without horizontal scrolling", async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await enterDarbar(page);
    await expect(page.locator(".bottom-nav")).toBeVisible();
    const widths = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  }
});

test("drawer opens above the page and routes to Diwan", async ({ page }) => {
  await enterDarbar(page);
  await page.locator(".topbar .icon-button").click();
  await expect(page.locator(".drawer")).toBeVisible();
  await page.getByRole("button", { name: "दीवान", exact: true }).last().click();
  await expect(page.locator("h1")).toContainText("दीवान");
});

test("language switch changes the visible home copy", async ({ page }) => {
  await enterDarbar(page);
  await expect(page.locator("h1")).toContainText("दरबार");
  await page.locator(".language").click();
  await expect(page.locator("h1")).toContainText("Welcome to Darbar");
});

test("Sakha API identifies mock replies and does not store server-side", async ({ request }) => {
  const response = await request.post("/api/sakha/chat", {
    data: { content: "Hello", language: "en" },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.mode).toBe("mock");
  expect(body.stored).toBe(false);
  expect(body.reply).toContain("mock preview");
});

test("mock wallet capture and refund are synthetic and idempotent", async ({ page }) => {
  await enterDarbar(page);
  await page.getByRole("button", { name: "वॉलेट" }).click();
  await page
    .getByRole("button", { name: /Test capture|Test capture simulate करें/ })
    .first()
    .click();
  await expect(page.locator(".wallet-panel strong")).toContainText("49");
  await page
    .getByRole("button", { name: /Simulate mock refund|Mock refund simulate करें/ })
    .click();
  await expect(page.locator(".wallet-panel strong")).toContainText("0");
});

test("Diwan scam check returns cautious risk indicators", async ({ page }) => {
  await enterDarbar(page);
  await page.locator(".minister-card.diwan").click();
  await page.getByRole("button", { name: /संदिग्ध संदेश जाँचें/ }).click();
  await page.locator("textarea").fill("बैंक खाता बंद होगा। OTP अभी भेजें।");
  await page.getByRole("button", { name: "Preview चलाएँ" }).click();
  await expect(page.locator(".diwan-result")).toBeVisible();
  await expect(page.locator(".result-warning")).toBeVisible();
});

test("Diwan Paper Reader keeps uncertainty and requires consent", async ({ page }) => {
  await enterDarbar(page);
  await page.locator(".minister-card.diwan").click();
  await page
    .locator("textarea")
    .first()
    .fill("जिला कार्यालय का सूचना पत्र। तारीख साफ़ नहीं दिख रही।");
  const run = page.getByRole("button", { name: "Preview चलाएँ" });
  await expect(run).toBeDisabled();
  await page.locator(".consent-line input").check();
  await run.click();
  await expect(page.locator(".diwan-result pre")).toContainText('"confidence": 0.1');
  await expect(page.locator(".diwan-result pre")).toContainText("guidance_not_legal_advice");
});

test("Diwan scheme search never invents records while official data is empty", async ({ page }) => {
  await enterDarbar(page);
  await page.locator(".minister-card.diwan").click();
  await page.locator(".diwan-tabs button").nth(4).click();
  await page
    .locator(".diwan-form label")
    .filter({ hasText: "राज्य" })
    .locator("input")
    .fill("Uttar Pradesh");
  await page
    .locator(".diwan-form label")
    .filter({ hasText: "योजना के टैग" })
    .locator("input")
    .fill("student");
  await page.getByRole("button", { name: "Preview चलाएँ" }).click();
  await expect(page.locator(".diwan-result pre")).toContainText("owner_review_pending");
  await expect(page.locator(".diwan-result pre")).toContainText('"records": []');
});

test("Diwan RTI draft uses only supplied facts and includes a verification notice", async ({
  page,
}) => {
  await enterDarbar(page);
  await page.locator(".minister-card.diwan").click();
  await page.locator(".diwan-tabs button").nth(2).click();
  const labels = page.locator(".diwan-form label");
  await labels
    .filter({ hasText: "लोक प्राधिकरण" })
    .locator("input")
    .fill("Central Public Authority");
  await labels
    .filter({ hasText: "विषय" })
    .locator("input")
    .fill("status of a submitted application");
  await labels
    .filter({ hasText: "प्रश्न" })
    .locator("textarea")
    .fill("Please provide the existing record.");
  await page.getByRole("button", { name: "Preview चलाएँ" }).click();
  await expect(page.locator(".diwan-result pre")).toContainText(
    "Please provide the existing record.",
  );
  await expect(page.locator(".diwan-result")).toContainText(/verify/i);
});
