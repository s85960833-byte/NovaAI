import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

mkdirSync('artifacts', { recursive: true });
const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
async function skipIntroForLayoutTest(page) {
  // Layout tests are not intro-playback tests; simulate a returning visitor before app scripts run.
  await page.addInitScript(() => localStorage.setItem('nova_intro_completed_v2', '1'));
}

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
    await skipIntroForLayoutTest(page);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.locator('#hi .nr-cards')).toBeVisible();
    await expect(page.locator('#hi .nr-card[data-group="learn"]')).toBeVisible();
    await expect(page.locator('#hi .nr-card h2')).toHaveText(['NOVA Learn', 'NOVA Build', 'NOVA Agents']);
    const sidebarLabels = await page.locator('#nrSidebarLinks button').allTextContents();
    expect(sidebarLabels[0]).toContain('NOVA Learn');
    expect(sidebarLabels[1]).toContain('NOVA Build');
    expect(sidebarLabels[2]).toContain('NOVA Agents');
    await expect(page.locator('#new')).toBeHidden();
    await expect(page.locator('#nImg')).toBeHidden();
    await expect(page.locator('#nLive')).toBeHidden();
    await expect(page.locator('#nrSidebarLinks button')).toHaveCount(3);
    await expect(page.locator('#novaBusinessLauncher')).toHaveCount(0);
    await expect(page.locator('#novaBICloudLauncher')).toHaveCount(0);
    await expect(page.locator('#nrSidebarLinks')).not.toContainText('Explore');
    const layout = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, right:r.right, width:r.width, top:r.top, bottom:r.bottom }; };
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
    if(size.width<=430){ expect(layout.card.top).toBeLessThan(size.height); expect(layout.card.bottom).toBeLessThanOrEqual(size.height); }
    await page.screenshot({path:'artifacts/'+browserName+'-workspace-'+size.width+'x'+size.height+'.png',fullPage:true});
    expect(pageErrors).toEqual([]);
  });
}

test('mobile drawer, Settings and workspace composer boundaries',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await skipIntroForLayoutTest(page);
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


test('English is the first-run default and the global UI switch supports only English and Hindi', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await skipIntroForLayoutTest(page);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const top = page.locator('#uiLangTop');
  await expect(top).toBeVisible();
  await expect(top.locator('option')).toHaveCount(2);
  await expect(top).toHaveValue('en');
  await expect(page.locator('#hi .nr-card h2')).toHaveText(['NOVA Learn', 'NOVA Build', 'NOVA Agents']);
  const englishSidebar = await page.locator('#nrSidebarLinks button').allTextContents();
  expect(englishSidebar[0]).toContain('NOVA Learn');
  expect(englishSidebar[1]).toContain('NOVA Build');
  expect(englishSidebar[2]).toContain('NOVA Agents');
  await expect(page.locator('#lang option')).toHaveCount(2);
  await expect(page.locator('#lang')).toHaveValue('English');
  await top.selectOption('hi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.locator('#uiLang')).toHaveValue('hi');
  await expect(page.locator('#uiLangTop')).toHaveValue('hi');
  await expect(page.locator('#hi .nr-card h2')).toHaveText(['नोवा लर्न', 'नोवा बिल्ड', 'नोवा एजेंट्स']);
  const hindiSidebar = await page.locator('#nrSidebarLinks button').allTextContents();
  expect(hindiSidebar[0]).toContain('नोवा लर्न');
  expect(hindiSidebar[1]).toContain('नोवा बिल्ड');
  expect(hindiSidebar[2]).toContain('नोवा एजेंट्स');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nova') || '{}').uiLang)).toBe('hi');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#uiLangTop')).toHaveValue('hi');
  await expect(page.locator('#hi .nr-card h2')).toHaveText(['नोवा लर्न', 'नोवा बिल्ड', 'नोवा एजेंट्स']);
  await page.locator('#uiLangTop').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#uiLang')).toHaveValue('en');
  await expect(page.locator('#hi .nr-card h2')).toHaveText(['NOVA Learn', 'NOVA Build', 'NOVA Agents']);
});


test('Pixel 7 viewport keeps full-screen navigation and opens all three workspaces', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await skipIntroForLayoutTest(page);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(width.document).toBeLessThanOrEqual(412);
  expect(width.body).toBeLessThanOrEqual(412);
  expect(width.viewport).toBe(412);

  const workspaces = [
    { id: 'learn', mode: 'math', modes: ['math','photo','ncert','board','ssc','upsc','english'], groups: 2 },
    { id: 'build', mode: 'builder', modes: ['builder'], groups: 1 },
    { id: 'agents', mode: 'general', modes: ['general','voice','document','schemes','shopkeeper'], groups: 2 }
  ];
  for (const workspace of workspaces) {
    await page.locator('#hi .nr-card[data-group="' + workspace.id + '"]').click();
    await expect(page.locator('#novaModes.open')).toBeVisible();
    await expect(page.locator('#nmContent [data-mode="' + workspace.mode + '"]')).toBeVisible();
    expect(await page.locator('#nmContent .nmgroup').count()).toBe(workspace.groups);
    const actualModes = await page.locator('#nmContent [data-mode]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-mode')).sort());
    expect(actualModes).toEqual([...workspace.modes].sort());
    await page.locator('#nmClose').click();
    await expect(page.locator('#novaModes.open')).toBeHidden();
  }

  await page.locator('#menu').click();
  await expect(page.locator('#side')).toHaveClass(/open/);
  await page.locator('#nrSidebarLinks button').nth(0).click();
  await expect(page.locator('#side')).not.toHaveClass(/open/);
  await expect(page.locator('#novaModes.open')).toBeVisible();
  await expect(page.locator('#nmContent [data-mode="math"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#novaModes.open')).toBeHidden();
});

test('legacy nova chat storage fixture remains readable at Pixel 7 size', async ({ page }) => {
  const legacyState = {
    chats: [{
      id: 'legacy-chat-001',
      title: 'Legacy saved conversation',
      m: [
        { r: 'user', c: 'Legacy user message' },
        { r: 'assistant', c: 'Legacy assistant reply' }
      ]
    }],
    cur: 'legacy-chat-001',
    rl: 'English',
    mem: 'legacy memory fixture',
    uiLang: 'en'
  };

  await page.setViewportSize({ width: 412, height: 915 });
  await page.addInitScript(state => {
    localStorage.setItem('nova_intro_completed_v2', '1');
    localStorage.setItem('nova', JSON.stringify(state));
  }, legacyState);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#list .it span').filter({ hasText: 'Legacy saved conversation' })).toBeVisible();
  await expect(page.locator('#msgs')).toContainText('Legacy user message');
  await expect(page.locator('#msgs')).toContainText('Legacy assistant reply');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('nova') || '{}'));
  expect(persisted.chats[0].id).toBe('legacy-chat-001');
  expect(persisted.chats[0].m[0]).toEqual({ r: 'user', c: 'Legacy user message' });
  expect(persisted.cur).toBe('legacy-chat-001');
  expect(persisted.mem).toBe('legacy memory fixture');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
});
