import { expect, test } from "@playwright/test";

test("Darbar has landmarks, headings and named visible controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const skip = page.locator(".skip");
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });

  await expect(page.locator("main.main-content")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const unnamed = await page.locator("button:visible").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const element = node as HTMLButtonElement;
        const label =
          element.getAttribute("aria-label") ?? element.getAttribute("title") ?? element.innerText;
        return !label.trim();
      })
      .map((node) => node.outerHTML.slice(0, 120)),
  );
  expect(unnamed).toEqual([]);
});

test("Diwan form controls have associated labels and keyboard focus is visible", async ({
  page,
}) => {
  await page.goto("/");
  const skip = page.locator(".skip");
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.locator(".minister-card.diwan").click();

  const unlabeled = await page
    .locator(".diwan-form input, .diwan-form textarea, .diwan-form select")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const element = node as HTMLInputElement;
          return (
            !element.labels?.length &&
            !element.getAttribute("aria-label") &&
            !element.getAttribute("aria-labelledby")
          );
        })
        .map((node) => node.outerHTML.slice(0, 120)),
    );
  expect(unlabeled).toEqual([]);

  await page.keyboard.press("Tab");
  const visible = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
  });
  expect(visible).toBe(true);
});

test("language switch retains a visible heading and navigation", async ({ page }) => {
  await page.goto("/");
  const skip = page.locator(".skip");
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.locator(".language").click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeVisible();
});
