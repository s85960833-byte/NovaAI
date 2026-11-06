import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('artifacts', { recursive: true });

const sizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 760, height: 1024 },
  { width: 1280, height: 800 }
];

for (const size of sizes) {
  test(`NOVA layout fits ${size.width}x${size.height}`, async ({ page, browserName }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.setViewportSize(size);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.locator('#box')).toBeVisible();

    const layout = await page.evaluate(() => {
      const rect = selector => {
        const el = document.querySelector(selector);
        const r = el.getBoundingClientRect();
        return { x: r.x, right: r.right, width: r.width, top: r.top, bottom: r.bottom };
      };
      const side = document.querySelector('#side');
      return {
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        sidePosition: getComputedStyle(side).position,
        main: rect('#main'),
        composer: rect('#box'),
        overflow: [...document.querySelectorAll('body *')]
          .map(el => ({ id: el.id, right: el.getBoundingClientRect().right }))
          .filter(el => el.right > innerWidth + 1)
          .slice(0, 10)
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(size.width);
    expect(layout.bodyWidth).toBeLessThanOrEqual(size.width);
    expect(layout.main.x).toBeGreaterThanOrEqual(-1);
    expect(layout.main.right).toBeLessThanOrEqual(size.width + 1);
    expect(layout.composer.x).toBeGreaterThanOrEqual(-1);
    expect(layout.composer.right).toBeLessThanOrEqual(size.width + 1);
    expect(layout.composer.bottom).toBeLessThanOrEqual(size.height + 1);
    expect(layout.overflow).toEqual([]);
    if (size.width <= 760) {
      expect(layout.sidePosition).toBe('fixed');
      expect(Math.abs(layout.main.width - size.width)).toBeLessThanOrEqual(1);
    } else {
      expect(layout.main.x).toBeGreaterThanOrEqual(250);
    }

    await page.screenshot({ path: `artifacts/${browserName}-${size.width}x${size.height}.png`, fullPage: true });
    expect(pageErrors).toEqual([]);
  });
}

test('mobile navigation drawer and Settings dialog open and close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('#menu').click();
  await expect(page.locator('#side')).toHaveClass(/open/);
  await page.locator('#scrim').click({ position: { x: 380, y: 420 } });
  await expect(page.locator('#side')).not.toHaveClass(/open/);

  await page.locator('#menu').click();
  await page.locator('#setb').click();
  await expect(page.locator('#dset')).toBeVisible();
  await page.locator('#sclose').click();
  await expect(page.locator('#dset')).not.toBeVisible();
});
