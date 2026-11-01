import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
const calls = [];
let accepted = false;
let branding = {
  organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  brand_name: 'Test Company',
  tagline: 'Proof before promises',
  logo_url: '',
  primary_color: '#2563EB',
  accent_color: '#14B8A6'
};
page.on('pageerror', error => pageErrors.push(error.message));

await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.80.0/dist/umd/supabase.min.js', route =>
  route.fulfill({ status: 200, contentType: 'application/javascript', body: "let testSession = null;\nwindow.supabase = {\n  createClient: function () {\n    return {\n      auth: {\n        getSession: async () => ({ data: { session: testSession } }),\n        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),\n        signInWithPassword: async ({ email }) => {\n          testSession = { access_token: 'fake-test-access-token', user: { id: '11111111-1111-4111-8111-111111111111', email } };\n          return { data: { session: testSession, user: testSession.user }, error: null };\n        },\n        signUp: async ({ email }) => ({ data: { session: null, user: { id: '11111111-1111-4111-8111-111111111111', email } }, error: null }),\n        signOut: async () => { testSession = null; return { error: null }; }\n      }\n    };\n  }\n};" })
);

await page.route('**/functions/v1/nova-bi-api/**', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.split('/nova-bi-api/')[1] || '';
  const method = request.method();
  let body = {};
  try { body = request.postDataJSON() || {}; } catch {}
  calls.push({ path, method, body });

  let payload = {};
  if (path === 'me') {
    payload = {
      user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' },
      organizations: [{
        organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'owner',
        status: 'active',
        organization: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Test Company', created_at: '2026-11-01T00:00:00Z' }
      }]
    };
  } else if (path === 'invitations') {
    payload = { invitations: accepted ? [] : [{
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      organization_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      role: 'viewer',
      status: 'invited',
      organization: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Invited Company' }
    }] };
  } else if (path.startsWith('datasets')) payload = { datasets: [] };
  else if (path.startsWith('analyses')) payload = { analyses: [] };
  else if (path.startsWith('workflows')) {
    if (method === 'POST') payload = { decided: true, workflow: { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', status: 'approved' } };
    else payload = { workflows: [{
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      created_by: '22222222-2222-4222-8222-222222222222',
      title: 'Review supplier spend',
      status: 'proposed',
      created_at: '2026-11-01T00:00:00Z'
    }] };
  } else if (path.startsWith('members')) {
    payload = method === 'POST'
      ? { invitation: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', role: body.role, status: 'invited' } }
      : { members: [{ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', user_id: '11111111-1111-4111-8111-111111111111', role: 'owner', status: 'active' }] };
  } else if (path.startsWith('audit')) payload = { events: [] };
  else if (path.startsWith('branding')) {
    if (method === 'POST') branding = { ...branding, ...body, updated_at: new Date().toISOString() };
    payload = { branding };
  } else if (path.includes('/accept')) {
    accepted = true;
    payload = { accepted: true, membership: { status: 'active' } };
  } else payload = { ok: true };

  await route.fulfill({
    status: method === 'POST' && path === 'members/invite' ? 201 : 200,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    body: JSON.stringify(payload)
  });
});

await page.goto('http://127.0.0.1:8787', { waitUntil: 'domcontentloaded' });
await page.locator('#novaBICloudLauncher').waitFor({ state: 'visible', timeout: 15000 });
await page.locator('#novaBICloudLauncher').click();
await page.locator('#ncbAuth').waitFor();
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbPassword').fill('a-strong-test-password');
await page.locator('#ncbAuth button[data-mode="signin"]').click();
await page.locator('#ncbBranding').waitFor({ timeout: 15000 });
await page.locator('#ncbInviteForm').waitFor();
await page.locator('[data-accept-invite]').waitFor();
await page.locator('[data-decision="approved"]').waitFor();

await page.locator('#ncbBrandName').fill('Test Company International');
await page.locator('#ncbBranding button[type="submit"]').click();
assert.ok(calls.some(call => call.path === 'branding' && call.method === 'POST'));

await page.locator('#ncbInviteEmail').fill('analyst@example.test');
await page.locator('#ncbInviteRole').selectOption('analyst');
await page.locator('#ncbInviteForm button[type="submit"]').click();
assert.ok(calls.some(call => call.path === 'members/invite' && call.method === 'POST' && call.body.role === 'analyst'));

await page.locator('[data-accept-invite]').click();
assert.ok(calls.some(call => call.path.endsWith('/accept') && call.method === 'POST'));

await page.locator('[data-decision="approved"]').click();
assert.ok(calls.some(call => call.path.includes('/decision') && call.method === 'POST'));

const downloadPromise = page.waitForEvent('download');
await page.locator('#ncbExport').click();
const download = await downloadPromise;
assert.match(download.suggestedFilename(), /nova-bi-export\.json$/);

await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaBICloud').evaluate(el => el.classList.contains('show')), false);
assert.deepEqual(pageErrors, []);
await browser.close();
process.stdout.write('PASS Company Cloud mobile browser flow: sign-in, workspace, branding, invitations, approval, export and keyboard close\n');
