import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });

const missionId = '123e4567-e89b-42d3-a456-426614174000';
await page.addInitScript(() => localStorage.setItem('nova_intro_completed_v2', '1'));
await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.supabase={createClient:()=>({auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}})}})};',
  }),
);
await page.route('**/nova-business-cloud.js', route => route.fulfill({
  status: 200,
  contentType: 'application/javascript',
  body: `
    (() => {
      const id = ${JSON.stringify(missionId)};
      let missions = [];
      const client = { auth: { onAuthStateChange() {}, getSession: async () => ({ data: { session: null } }) } };
      window.NovaBusinessCloud = Object.freeze({
        open() {}, close() {}, getClient() { return client; },
        async missionApi(path, method = 'GET', payload) {
          if (path === 'missions' && method === 'GET') return { missions };
          if (path === 'missions' && method === 'POST') {
            const mission = {
              id, title: payload.title, description: payload.description,
              workspace: payload.workspace, state: 'draft', version: 0,
              created_at: '2026-11-10T10:00:00.000Z', updated_at: '2026-11-10T10:00:00.000Z'
            };
            missions = [mission, ...missions];
            return { mission };
          }
          if (path === 'missions/' + id && method === 'GET') {
            return {
              mission: missions[0],
              tasks: [],
              events: [{ id: 'event-1', event_type: 'mission.created', from_state: null, to_state: 'draft' }],
              proofs: [{ id: 'proof-1', proof_type: 'browser-test', verification_status: 'passed', summary: 'Homepage smoke test passed' }]
            };
          }
          throw new Error('Unexpected mocked Mission API route: ' + method + ' ' + path);
        }
      });
    })();
  `,
}));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => window.NovaSuite?.open());
await page.locator('#novaSuite').waitFor({ state: 'visible', timeout: 10000 });
await page.locator('#nsNav [data-id="missions"]').click();
await page.locator('#missionTitle').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#novaSuite').innerText()).includes('Mission Control'));

await page.locator('#missionTitle').fill('Test website mission');
await page.locator('#missionDescription').fill('Build a simple landing page and verify it loads.');
await page.locator('#missionWorkspace').selectOption('build');
await page.locator('#missionForm').evaluate(form => form.requestSubmit());
await page.locator('[data-mission-id="' + missionId + '"]').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionList').innerText()).includes('Test website mission'));

await page.locator('[data-mission-id="' + missionId + '"]').click();
await page.locator('#missionDetail').getByText('Homepage smoke test passed').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionDetail').innerText()).includes('mission.created'));
console.log('PASS Mission Control creates, lists and opens a mission with event/proof details');

await page.evaluate(() => {
  document.documentElement.lang = 'hi';
  window.dispatchEvent(new Event('nova:ui-language-changed'));
});
await page.locator('#missionTitle').waitFor({ state: 'visible' });
assert.ok((await page.locator('#nsNav').innerText()).includes('मिशन कंट्रोल'));
assert.ok((await page.locator('#missionForm').innerText()).includes('मिशन बनाएँ'));
console.log('PASS Mission Control bilingual labels switch to Hindi');

await page.setViewportSize({ width: 390, height: 844 });
const dimensions = await page.evaluate(() => ({
  viewport: window.innerWidth,
  panel: document.querySelector('#novaSuite .ns-wrap').getBoundingClientRect().width,
  overflow: document.documentElement.scrollWidth,
}));
assert.ok(dimensions.panel <= dimensions.viewport, 'Mission Control must fit a 390px mobile viewport');
assert.ok(dimensions.overflow <= dimensions.viewport, 'Mission Control must not create horizontal page overflow');
console.log('PASS Mission Control fits a 390px mobile viewport');

await browser.close();
