import { test, expect } from "@playwright/test";

async function enterDarbar(page: import("@playwright/test").Page) {
  await page.goto("/");
  const skip = page.locator(".skip");
  await skip.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await expect(page.locator(".minister-card.diwan")).toBeVisible();
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
  await page.locator(".diwan-tabs button").nth(1).click();
  await page.locator("textarea").fill("बैंक खाता बंद होगा। OTP अभी भेजें।");
  await page.getByRole("button", { name: "Preview चलाएँ" }).click();
  await expect(page.locator(".diwan-result")).toBeVisible({ timeout: 10000 });
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
  await expect(page.locator(".diwan-result")).toContainText(/कानूनी सलाह नहीं|verify/i);
});

test("synthetic wallet enforces owner isolation and blocks foreign order simulation", async ({
  request,
}) => {
  const missing = await request.get("/api/wallet/mock");
  expect(missing.status()).toBe(400);

  const userA = "synthetic-auth-a";
  const userB = "synthetic-auth-b";
  const orderResponse = await request.post("/api/wallet/mock/orders", {
    headers: { "x-nova-synthetic-user": userA },
    data: { packId: "starter" },
  });
  expect(orderResponse.status()).toBe(201);

  const orderBody = await orderResponse.json();
  const order = orderBody.order as { id: string; amountPaise: number };
  const before = await request.get("/api/wallet/mock", {
    headers: { "x-nova-synthetic-user": userB },
  });
  expect(before.ok()).toBeTruthy();
  expect((await before.json()).balance).toBe(0);

  const foreignCapture = await request.post("/api/wallet/mock/simulate", {
    headers: { "x-nova-synthetic-user": userB },
    data: {
      orderId: order.id,
      amountPaise: order.amountPaise,
      type: "payment.captured",
      eventId: "foreign-event-" + crypto.randomUUID(),
    },
  });
  expect(foreignCapture.status()).toBe(404);

  const ownerCapture = await request.post("/api/wallet/mock/simulate", {
    headers: { "x-nova-synthetic-user": userA },
    data: {
      orderId: order.id,
      amountPaise: order.amountPaise,
      type: "payment.captured",
      eventId: "owner-event-" + crypto.randomUUID(),
    },
  });
  expect(ownerCapture.ok()).toBeTruthy();
  expect((await ownerCapture.json()).balance).toBe(49);

  const after = await request.get("/api/wallet/mock", {
    headers: { "x-nova-synthetic-user": userB },
  });
  expect((await after.json()).balance).toBe(0);
});

test("account and upload endpoints fail closed when hosted Auth is not configured", async ({
  request,
}) => {
  const session = await request.get("/api/auth/session");
  expect(session.status()).toBe(503);

  const upload = await request.post("/api/files/upload", {
    headers: { origin: "http://localhost:4173" },
    multipart: { consent: "true" },
  });
  expect(upload.status()).toBe(401);
  expect((await upload.json()).error.code).toBe("SESSION_REQUIRED");
});
