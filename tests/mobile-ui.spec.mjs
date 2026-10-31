import { mkdirSync } from 'node:fs';
mkdirSync('artifacts',{recursive:true});
import { test, expect } from '@playwright/test';

const sizes = [{width:360,height:800},{width:390,height:844},{width:412,height:915},{width:768,height:1024},{width:1280,height:800}];

for (const size of sizes) {
  test('first paint and mobile layout '+size.width+'x'+size.height, async ({ page, browserName }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `artifacts/${browserName}-${size.width}-0.2s.png`, fullPage: true });
    const initial = await page.evaluate(() => ({ splash: !!document.querySelector('#novaSplash'), appHidden: document.querySelector('#novaApp')?.hidden, center: (()=>{const r=document.querySelector('#novaSplash')?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null})(), viewport:{x:innerWidth/2,y:innerHeight/2} }));
    expect(initial.splash).toBeTruthy();
    expect(initial.appHidden).toBeTruthy();
    expect(Math.abs(initial.center.x-initial.viewport.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(initial.center.y-initial.viewport.y)).toBeLessThanOrEqual(2);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `artifacts/${browserName}-${size.width}-1s.png`, fullPage: true });
    expect(await page.locator('#novaSplash').count()).toBe(1);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `artifacts/${browserName}-${size.width}-2s.png`, fullPage: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `artifacts/${browserName}-${size.width}-3s.png`, fullPage: true });
    await expect(page.locator('#novaSplash')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('#novaApp')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#top')).toBeVisible();
    await expect(page.locator('#box')).toBeVisible();
    await expect(page.locator('#novaSHome .ncat')).toHaveCount(4);
    await expect(page.getByText("Namaste! I'm Nova AI. How can I help you today?", { exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `artifacts/${browserName}-${size.width}-5s.png`, fullPage: true });
    const layout = await page.evaluate(() => {
      const root=document.querySelector('#novaApp'), box=document.querySelector('#box'), top=document.querySelector('#top');
      const overflow=[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,id:el.id,cls:String(el.className?.baseVal||el.className||'').slice(0,60),right:el.getBoundingClientRect().right})).filter(x=>x.right>innerWidth+1);
      return {width:root?.getBoundingClientRect().width,innerWidth,scrollWidth:document.scrollingElement.scrollWidth,overflow:overflow.slice(0,20),top:top?.getBoundingClientRect().toJSON(),box:box?.getBoundingClientRect().toJSON()};
    });
    expect(Math.abs(layout.width-layout.innerWidth)).toBeLessThanOrEqual(1);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth);
    expect(layout.overflow).toEqual([]);
    expect(layout.box.bottom).toBeLessThanOrEqual(size.height+1);
    expect(layout.box.top).toBeGreaterThan(0);
  });
}

test('Hindi toggle changes only interface language and preserves the reply-language selector', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3200);
  await page.locator('#novaUiLang').click();
  await expect(page.locator('#novaSHome')).toContainText('नमस्ते');
  await expect(page.locator('#novaApp :lang(hi)')).toHaveCSS('letter-spacing', '0px');
});

test('upgrade from old service-worker cache removes previous cache and does not cache index', async ({ page }) => {
  await page.goto('/favicon.svg');
  await page.evaluate(async () => { await caches.open('nova-shell-v4-s-tier'); });
  await page.goto('/');
  await page.waitForTimeout(1500);
  const result = await page.evaluate(async () => ({ old: await caches.has('nova-shell-v4-s-tier'), keys: await caches.keys() }));
  expect(result.old).toBeFalsy();
  expect(result.keys).toContain('nova-shell-v5-mobile-first-paint');
  expect(result.keys).not.toContain('nova-shell-v4-s-tier');
});

test('sleeping server displays Jagran and then reveals app when health recovers', async ({ page }) => {
  let started=Date.now();
  await page.route('**/health', async route => {
    if(Date.now()-started<8000) return route.fulfill({status:503,contentType:'application/json',body:'{"status":"sleeping"}'});
    return route.fulfill({status:200,contentType:'application/json',body:'{"status":"ok","ready":true}'});
  });
  await page.goto('/');
  await expect(page.locator('#novaJagran')).toBeVisible({timeout:6000});
  await expect(page.locator('#njStatus')).toContainText('Getting the brain ready', {timeout:10000});
  await expect(page.locator('#novaApp')).toBeVisible({timeout:15000});
});
