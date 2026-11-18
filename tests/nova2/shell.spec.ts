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

test("the complete legacy NOVA workspace remains available on the same origin", async ({
  request,
}) => {
  const response = await request.get("/classic");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('id="novaEntryGate"');
  expect(html).toContain('src="/nova-app.js"');
  for (const asset of ["/nova-app.js", "/nova-suite.js", "/mode-registry.js", "/nova-account.js"]) {
    const assetResponse = await request.get(asset);
    expect(assetResponse.ok()).toBeTruthy();
  }
  const legacyApi = await request.post("/api/chat/completions", {
    data: { messages: [] },
  });
  expect(legacyApi.status()).toBe(400);
});

test("Learn, Build and Agents shortcuts open their original NOVA workspaces", async ({ page }) => {
  for (const [workspace, label] of [
    ["learn", /NOVA Learn|नोवा लर्न/],
    ["build", /NOVA Build|नोवा बिल्ड/],
    ["agents", /NOVA Agents|नोवा एजेंट्स/],
  ] as const) {
    await page.goto("/classic?workspace=" + workspace);
    await expect(page.locator("#novaModes.open")).toBeVisible();
    await expect(page.locator("#novaModes .nmgroup h3").first()).toContainText(label);
  }
});

test("embedded legacy workspace is same-origin framed with mobile-width layout", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDarbar(page);
  await page.getByRole("button", { name: "नोवा लर्न", exact: true }).click();
  const frame = page.locator(".legacy-frame");
  await expect(frame).toHaveAttribute("src", "/classic?workspace=learn");
  const classicResponse = await request.get("/classic?workspace=learn");
  expect(classicResponse.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(classicResponse.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  const legacy = page.frameLocator(".legacy-frame");
  await expect(legacy.locator("#novaModes.open")).toBeVisible();
  const widths = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
    frame: document.querySelector(".legacy-frame")?.getBoundingClientRect().width ?? 0,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  expect(widths.frame).toBeGreaterThanOrEqual(370);
});

test("Learn, Build and Agents open inside the unified NOVA shell", async ({ page }) => {
  await enterDarbar(page);
  for (const [workspace, label, buttonName] of [
    ["learn", /NOVA Learn|नोवा लर्न/, "नोवा लर्न"],
    ["build", /NOVA Build|नोवा बिल्ड/, "नोवा बिल्ड"],
    ["agents", /NOVA Agents|नोवा एजेंट्स/, "नोवा एजेंट्स"],
  ] as const) {
    await page.goto("/");
    await enterDarbar(page);
    await page.getByRole("button", { name: buttonName, exact: true }).click();
    const frame = page.locator(".legacy-frame");
    await expect(frame).toHaveAttribute("src", "/classic?workspace=" + workspace);
    const legacy = page.frameLocator(".legacy-frame");
    await expect(legacy.locator("#novaModes.open")).toBeVisible();
    await expect(legacy.locator("#novaModes .nmgroup h3").first()).toContainText(label);
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
    headers: { origin: "http://127.0.0.1:8787" },
    multipart: { consent: "true" },
  });
  expect(upload.status()).toBe(401);
  expect((await upload.json()).error.code).toBe("SESSION_REQUIRED");
});

test("serves pre-compressed JavaScript and CSS to gzip-capable browsers", async ({ request }) => {
  const htmlResponse = await request.get("/", {
    headers: { "accept-encoding": "gzip" },
  });
  expect(htmlResponse.ok()).toBeTruthy();
  const html = await htmlResponse.text();
  const scriptPath = html.match(/src="([^"]+\.js)"/)?.[1];
  const stylePath = html.match(/href="([^"]+\.css)"/)?.[1];

  expect(scriptPath).toBeTruthy();
  expect(stylePath).toBeTruthy();

  const [scriptResponse, styleResponse] = await Promise.all([
    request.get(scriptPath!, { headers: { "accept-encoding": "gzip" } }),
    request.get(stylePath!, { headers: { "accept-encoding": "gzip" } }),
  ]);

  expect(scriptResponse.status()).toBe(200);
  expect(styleResponse.status()).toBe(200);
  expect(scriptResponse.headers()["content-encoding"]).toBe("gzip");
  expect(styleResponse.headers()["content-encoding"]).toBe("gzip");
  expect(scriptResponse.headers()["content-type"]).toContain("javascript");
  expect(styleResponse.headers()["content-type"]).toContain("text/css");
});
