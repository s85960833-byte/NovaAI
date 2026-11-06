import { chromium } from 'playwright';

const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce'
  });
  page.on('pageerror', error => failures.push(error.message));
  const response = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw new Error('Mobile homepage did not load');
  await page.locator('#msgs').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#hi').waitFor({ state: 'visible', timeout: 15000 });

  const mobile = await page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    cards: document.querySelectorAll('#hi [data-cat]').length,
    prompt: !!document.querySelector('#hi #novaHomePrompt'),
    send: !!document.querySelector('#hi #novaHomeSend')
  }));
  if (mobile.documentWidth > mobile.width + 1 || mobile.bodyWidth > mobile.width + 1) {
    throw new Error('Mobile horizontal overflow: ' + JSON.stringify(mobile));
  }
  if (mobile.cards !== 3 || !mobile.prompt || !mobile.send) throw new Error('Mobile dashboard controls are incomplete: ' + JSON.stringify(mobile));

  await page.locator('#menu').click();
  if (!(await page.locator('#side').evaluate(el => el.classList.contains('open')))) throw new Error('Mobile navigation drawer did not open');
  await page.locator('#scrim').click({ position: { x: 5, y: 5 } });
  if (await page.locator('#side').evaluate(el => el.classList.contains('open'))) throw new Error('Mobile navigation drawer did not close from scrim');

  await page.locator('#setb').click();
  if (!(await page.locator('#dset').evaluate(el => el.open))) throw new Error('Settings dialog did not open');
  await page.locator('#sclose').click();
  if (await page.locator('#dset').evaluate(el => el.open)) throw new Error('Settings dialog did not close');

  await page.locator('#lang').selectOption('Hindi');
  if (await page.locator('html').getAttribute('lang') !== 'hi') throw new Error('Hindi reply-language selection did not update document language');
  await page.locator('#lang').selectOption('English');
  if (await page.locator('html').getAttribute('lang') !== 'en') throw new Error('English reply-language selection did not update document language');

  await page.locator('#camb').click();
  if (!(await page.locator('#photo').isVisible())) throw new Error('Photo solver panel did not open');
  await page.locator('#pclose2').click();
  if (await page.locator('#photo').isVisible()) throw new Error('Photo solver panel did not close');

  await page.locator('#theme').click();
  const theme = await page.locator('html').getAttribute('data-theme');
  if (!['light', 'dark'].includes(theme)) throw new Error('Theme toggle did not set a supported theme');

  await page.setViewportSize({ width: 1365, height: 900 });
  const desktop = await page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  if (desktop.documentWidth > desktop.width + 1 || desktop.bodyWidth > desktop.width + 1) {
    throw new Error('Desktop horizontal overflow: ' + JSON.stringify(desktop));
  }

  if (failures.length) throw new Error('Browser runtime errors: ' + failures.join(' | '));
  console.log('PASS mobile dashboard, no horizontal overflow, drawer, settings, Hindi/English toggle, photo panel, theme, desktop viewport');
} finally {
  await browser.close();
}
