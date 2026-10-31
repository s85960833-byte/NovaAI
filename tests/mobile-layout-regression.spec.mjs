import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('artifacts', { recursive: true });

for (const size of [{ width: 412, height: 915 }, { width: 800, height: 1280 }]) {
  test(`phone layout fills the viewport at ${size.width}x${size.height}`, async ({ page, browserName }) => {
    await page.setViewportSize(size);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#novaApp')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const side = document.querySelector('#side');
      const main = document.querySelector('#main');
      const composer = document.querySelector('#box');
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, right: r.right, bottom: r.bottom };
      };
      const overflow = [...document.querySelectorAll('#novaApp *')]
        .map(el => ({ id: el.id, cls: String(el.className?.baseVal || el.className || '').slice(0, 50), right: el.getBoundingClientRect().right }))
        .filter(el => el.right > innerWidth + 1);
      return {
        viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
        sidePosition: getComputedStyle(side).position,
        sideTransform: getComputedStyle(side).transform,
        main: rect(main),
        composer: rect(composer),
        menuVisible: getComputedStyle(document.querySelector('#menu')).display !== 'none',
        overflow: overflow.slice(0, 12)
      };
    });
    expect(result.sidePosition).toBe('fixed');
    expect(result.main.x).toBeLessThanOrEqual(1);
    expect(Math.abs(result.main.width - result.viewport.width)).toBeLessThanOrEqual(1);
    expect(result.menuVisible).toBeTruthy();
    expect(result.viewport.scrollWidth).toBeLessThanOrEqual(result.viewport.width);
    expect(result.overflow).toEqual([]);
    expect(result.composer.x).toBeGreaterThanOrEqual(0);
    expect(result.composer.right).toBeLessThanOrEqual(result.viewport.width + 1);
    expect(result.composer.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
    await page.screenshot({ path: `artifacts/${browserName}-phone-layout-${size.width}.png`, fullPage: true });
  });
}
