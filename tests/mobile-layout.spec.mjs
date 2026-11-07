import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('artifacts', { recursive: true });
const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
const sizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 760, height: 1024 },
  { width: 1280, height: 800 }
];

for (const size of sizes) {
  test('NOVA three-workspace home fits ' + size.width + 'x' + size.height, async ({ page, browserName }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.setViewportSize(size);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.locator('#hi .nr-cards')).toBeVisible();
    await expect(page.locator('#hi .nr-card[data-group="learn"]')).toBeVisible();
    await expect(page.locator('#new')).toBeHidden();
    await expect(page.locator('#nImg')).toBeHidden();
    await expect(page.locator('#nLive')).toBeHidden();
    await expect(page.locator('#nrSidebarLinks button')).toHaveCount(3);
    await expect(page.locator('#novaBusinessLauncher')).toHaveCount(0);
    await expect(page.locator('#novaBICloudLauncher')).toHaveCount(0);
    await expect(page.locator('#nrSidebarLinks')).not.toContainText('Explore');
    const layout = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, right:r.right, width:r.width, bottom:r.bottom }; };
      return { documentWidth:document.documentElement.scrollWidth, bodyWidth:document.body.scrollWidth,
        main:rect('#main'), home:rect('#hi'), cards:rect('#hi .nr-cards'), card:rect('#hi .nr-card'),
        columns:getComputedStyle(document.querySelector('#hi .nr-cards')).gridTemplateColumns.split(' ').length,
        composer:getComputedStyle(document.querySelector('#box')).display, side:getComputedStyle(document.querySelector('#side')).position,
        bodyFont:getComputedStyle(document.body).fontFamily, titleFont:getComputedStyle(document.querySelector('#hi .nr-title')).fontFamily };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(size.width);
    expect(layout.bodyWidth).toBeLessThanOrEqual(size.width);
    expect(layout.main.x).toBeGreaterThanOrEqual(-1);
    expect(layout.main.right).toBeLessThanOrEqual(size.width+1);
    expect(layout.home.x).toBeGreaterThanOrEqual(-1);
    expect(layout.home.right).toBeLessThanOrEqual(size.width+1);
    expect(layout.cards.right).toBeLessThanOrEqual(size.width+1);
    expect(layout.card.right).toBeLessThanOrEqual(size.width+1);
    expect(layout.composer).toBe('none');
    expect(layout.bodyFont).toContain('Noto Sans Devanagari');
    expect(layout.titleFont).toContain('Noto Sans Devanagari');
    if(size.width<=760){ expect(layout.side).toBe('fixed'); expect(Math.abs(layout.main.width-size.width)).toBeLessThanOrEqual(1); expect(layout.columns).toBe(1); }
    else { expect(layout.main.x).toBeGreaterThan(0); expect(layout.columns).toBe(3); }
    await page.screenshot({path:'artifacts/'+browserName+'-workspace-'+size.width+'x'+size.height+'.png',fullPage:true});
    expect(pageErrors).toEqual([]);
  });
}

test('mobile drawer, Settings and workspace composer boundaries',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#menu').click();
  await expect(page.locator('#side')).toHaveClass(/open/);
  await page.locator('#scrim').click({position:{x:380,y:420}});
  await expect(page.locator('#side')).not.toHaveClass(/open/);
  await page.locator('#menu').click();
  await page.locator('#setb').click();
  await expect(page.locator('#dset')).toBeVisible();
  await page.locator('#sclose').click();
  await expect(page.locator('#dset')).not.toBeVisible();
  await expect(page.locator('#side')).toHaveClass(/open/);
  await page.locator('#scrim').click({position:{x:380,y:420}});
  await expect(page.locator('#side')).not.toHaveClass(/open/);
  await page.locator('#hi .nr-card[data-group="agents"]').click();
  await expect(page.locator('#novaModes.open')).toBeVisible();
  await expect(page.locator('#nmContent [data-quick="openBusinessIntelligence"]')).toBeVisible();
  await expect(page.locator('#nmContent [data-quick="openCompanyCloud"]')).toBeVisible();
  await expect(page.locator('#nmCompose')).toBeHidden();
  await page.locator('#nmContent [data-mode="general"]').click();
  await expect(page.locator('#nmCompose')).toBeVisible();
  await expect(page.locator('#nmInput')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#novaModes.open')).toBeHidden();
});
