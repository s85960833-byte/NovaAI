import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
const calls = [];
const authCalls = [];
let accepted = false;
let nextInviteIsExistingAccount = false;
let datasets = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Linked dataset', row_count: 12, created_at: '2026-11-01T00:00:00Z' },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Unused dataset', row_count: 4, created_at: '2026-11-01T00:00:00Z' }
];
let analyses = [
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', dataset_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', analysis_type: 'cost_leaks', calculation_version: 'test-1', created_at: '2026-11-01T00:00:00Z' }
];
let branding = {
  organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  brand_name: 'Test Company',
  tagline: 'Proof before promises',
  logo_url: '',
  primary_color: '#2563EB',
  accent_color: '#14B8A6'
};
page.on('pageerror', error => pageErrors.push(error.message));
page.on('dialog', dialog => dialog.accept());

await page.route('**/supabase-js@2.119.0/dist/umd/supabase.min.js*', route =>
  route.fulfill({ status: 200, contentType: 'application/javascript', body: `let testSession = null; let authListener = null;
window.__authCalls = [];
window.__emitAuthEvent = (event, session) => authListener && authListener(event, session);
window.supabase = {
  createClient: function () {
    return {
      auth: {
        getSession: async () => ({ data: { session: testSession } }),
        onAuthStateChange: (callback) => { authListener = callback; return { data: { subscription: { unsubscribe() {} } } }; },
        signInWithPassword: async ({ email }) => {
          testSession = { access_token: 'fake-test-access-token', user: { id: '11111111-1111-4111-8111-111111111111', email } };
          return { data: { session: testSession, user: testSession.user }, error: null };
        },
        signUp: async ({ email, options }) => { window.__authCalls.push({ method: 'signUp', email, options }); return { data: { session: null, user: { id: '11111111-1111-4111-8111-111111111111', email } }, error: null }; },
        resend: async (options) => { window.__authCalls.push({ method: 'resend', options }); return { error: null }; },
        resetPasswordForEmail: async (email, options) => { window.__authCalls.push({ method: 'resetPasswordForEmail', email, options }); return { error: null }; },
        updateUser: async (attributes) => { window.__authCalls.push({ method: 'updateUser', attributes }); return { error: null }; },
        signOut: async () => { testSession = null; return { error: null }; }
      }
    };
  }
};` })
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
  } else if (path.startsWith('datasets')) {
    if (method === 'POST') {
      const dataset = { ...body, id: '99999999-9999-4999-8999-999999999999', created_at: new Date().toISOString() };
      datasets.push(dataset);
      payload = { dataset };
    } else if (method === 'DELETE') { datasets = datasets.filter(x => x.id !== path.split('/')[1]); payload = { deleted: true }; }
    else payload = { datasets };
  } else if (path.startsWith('analyses')) {
    if (method === 'POST') {
      const analysis = { ...body, id: '88888888-8888-4888-8888-888888888888', created_at: new Date().toISOString() };
      analyses.push(analysis);
      payload = { analysis };
    } else if (method === 'DELETE') { analyses = analyses.filter(x => x.id !== path.split('/')[1]); payload = { deleted: true }; }
    else payload = { analyses };
  }
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
      ? { invitation: { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', role: body.role, status: 'invited' }, notification_sent: !nextInviteIsExistingAccount }
      : { members: [{ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', user_id: '11111111-1111-4111-8111-111111111111', role: 'owner', status: 'active' }] };
    if (method === 'POST') nextInviteIsExistingAccount = false;
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

// Exercise the local analysis workspace from the only allowed entry point: NOVA Agents.
await page.locator('#hi .nr-card[data-group="agents"]').waitFor({ state: 'visible', timeout: 15000 });
await page.locator('#hi .nr-card[data-group="agents"]').click();
await page.locator('#novaModes.open').waitFor();
await page.locator('#nmContent [data-quick="openBusinessIntelligence"]').waitFor({ state: 'visible', timeout: 10000 });
await page.locator('#nmContent [data-quick="openBusinessIntelligence"]').click();
await page.locator('#nbNav [data-view="data"]').click();
await page.locator('#nbFile').setInputFiles({
  name: 'expenses.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('amount,category,date\n100,Software,2026-10-01\n200,Travel,2026-10-02\n')
});
await page.locator('#nbAnalyze').waitFor();
await page.waitForFunction(() => {
  const button = document.querySelector('#nbAnalyze');
  return !!button && !button.disabled;
}, null, { timeout: 10000 });
assert.equal(await page.locator('#nbAnalyze').isDisabled(), false, await page.locator('#nbDataStatus').textContent());
await page.locator('#nbAnalyze').click();
await page.locator('#nbBody').getByText('Verified calculation summary').waitFor();

await page.locator('#nbNav [data-view="risk"]').click();
await page.locator('#nbProjectName').fill('Test migration');
await page.locator('#nbDue').fill('2026-12-31');
await page.locator('#nbProgress').fill('30');
await page.locator('#nbBlockers').fill('2');
await page.locator('#nbRiskRun').click();
await page.locator('#nbBody').getByText('Project Risk Predictor').waitFor();

await page.locator('#nbNav [data-view="scenario"]').click();
await page.locator('#nbBaseline').fill('100000');
await page.locator('#nbScenarioRun').click();
await page.locator('#nbBody').getByText('Scenario result').waitFor();

await page.locator('#nbNav [data-view="workflow"]').click();
await page.locator('#nbProcess').fill('Weekly project status report');
await page.locator('#nbApprover').fill('Project manager');
await page.locator('#nbWorkflowRun').click();
await page.locator('#nbBody pre').waitFor();

await page.locator('#nbNav [data-view="proof"]').click();
await page.locator('#nbProofExport').waitFor();
const proofDownloadPromise = page.waitForEvent('download');
await page.locator('#nbProofExport').click();
const proofDownload = await proofDownloadPromise;
assert.match(proofDownload.suggestedFilename(), /nova-action-proof\.json$/);
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaBusiness').evaluate(el => el.classList.contains('show')), false);
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), true, 'Agents workspace must remain open underneath Business Intelligence');

await page.locator('#nmContent [data-quick="openCompanyCloud"]').waitFor({ state: 'visible', timeout: 10000 });
await page.locator('#nmContent [data-quick="openCompanyCloud"]').click();
await page.locator('#ncbAuth').waitFor();
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbPassword').fill('a-strong-test-password');
await page.locator('#ncbAuth button[data-mode="signup"]').click();
await page.waitForFunction(() => window.__authCalls.some(x => x.method === 'signUp') || document.querySelector('#ncbMessage')?.textContent.includes('Authentication failed'), null, { timeout: 10000 });
const authAfterSignup = await page.evaluate(() => window.__authCalls.find(x => x.method === 'signUp'));
assert.ok(authAfterSignup, 'Signup handler did not call Supabase signUp. UI message: ' + await page.locator('#ncbMessage').textContent());
assert.match(await page.locator('#ncbMessage').textContent(), /Account created/, 'Signup completed but confirmation status was not shown.');
await page.locator('#ncbResend').waitFor();
assert.equal(authAfterSignup.options.emailRedirectTo, 'http://127.0.0.1:8787');
await page.locator('#ncbResend').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('new confirmation email'), null, { timeout: 10000 });
assert.ok((await page.evaluate(() => window.__authCalls)).some(x => x.method === 'resend' && x.options.type === 'signup'));
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbForgot').click();
await page.waitForFunction(() => window.__authCalls.some(x => x.method === 'resetPasswordForEmail') || document.querySelector('#ncbMessage')?.textContent.includes('Could not request a password reset'), null, { timeout: 10000 });
const resetCall = await page.evaluate(() => window.__authCalls.find(x => x.method === 'resetPasswordForEmail'));
assert.ok(resetCall, 'Forgot password did not call Supabase resetPasswordForEmail. UI message: ' + await page.locator('#ncbMessage').textContent());
assert.equal(resetCall.options.redirectTo, 'http://127.0.0.1:8787');
assert.match(await page.locator('#ncbMessage').textContent(), /password-reset email/i, 'Password reset request completed but confirmation message was not shown.');
await page.evaluate(() => window.__emitAuthEvent('PASSWORD_RECOVERY', { access_token: 'recovery-token', user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' } }));
await page.locator('#ncbRecovery').waitFor();
await page.locator('#ncbNewPassword').fill('new-strong-password');
await page.locator('#ncbConfirmPassword').fill('different-password');
await page.locator('#ncbRecovery button[type="submit"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('passwords do not match'));
await page.locator('#ncbConfirmPassword').fill('new-strong-password');
await page.locator('#ncbRecovery button[type="submit"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Password updated'), null, { timeout: 10000 });
assert.ok((await page.evaluate(() => window.__authCalls)).some(x => x.method === 'updateUser'));
await page.locator('#ncbAuth').waitFor();
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbPassword').fill('a-strong-test-password');
await page.locator('#ncbAuth button[data-mode="signin"]').click();
await page.locator('#ncbBranding').waitFor({ timeout: 15000 });
await page.locator('#ncbInviteForm').waitFor();
await page.locator('[data-accept-invite]').waitFor();
await page.locator('[data-decision="approved"]').waitFor();
await page.locator('[data-delete-analysis="cccccccc-cccc-4ccc-8ccc-cccccccccccc"]').waitFor();
await page.locator('[data-delete-dataset="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]').waitFor();
assert.equal(await page.locator('[data-delete-dataset="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]').isDisabled(), true);

await page.locator('#ncbSaveAnalysis').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Analysis saved'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path === 'datasets' && call.method === 'POST' && !Object.hasOwn(call.body, 'rows')));
assert.ok(calls.some(call => call.path === 'analyses' && call.method === 'POST' && !Object.hasOwn(call.body, 'rows')));

await page.locator('#ncbBrandName').fill('Test Company International');
await page.locator('#ncbTagline').fill('Operations with proof');
await page.locator('#ncbBranding button[type="submit"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Company branding settings saved.'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path === 'branding' && call.method === 'POST'));
assert.equal(await page.locator('#ncbBrandTitle').textContent(), 'Test Company International');
assert.equal(await page.locator('#ncbBrandTagline').textContent(), 'Operations with proof');

await page.locator('#ncbInviteEmail').fill('analyst@example.test');
await page.locator('#ncbInviteRole').selectOption('analyst');
await page.locator('#ncbInviteForm button[type="submit"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Invitation email sent'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path === 'members/invite' && call.method === 'POST' && call.body.role === 'analyst'));

nextInviteIsExistingAccount = true;
await page.locator('#ncbInviteEmail').fill('existing@example.test');
await page.locator('#ncbInviteRole').selectOption('viewer');
await page.locator('#ncbInviteForm button[type="submit"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('no email was sent'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path === 'members/invite' && call.method === 'POST' && call.body.email === 'existing@example.test'));

await page.locator('[data-accept-invite]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Company invitation accepted.'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path.endsWith('/accept') && call.method === 'POST'));

await page.locator('[data-decision="approved"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Workflow decision recorded.'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path.includes('/decision') && call.method === 'POST'));

await page.locator('[data-delete-analysis="cccccccc-cccc-4ccc-8ccc-cccccccccccc"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Saved analysis deleted'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path.startsWith('analyses/') && call.method === 'DELETE'));
await page.locator('[data-delete-dataset="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]').click();
await page.waitForFunction(() => document.querySelector('#ncbMessage')?.textContent.includes('Dataset metadata deleted'), null, { timeout: 10000 });
assert.ok(calls.some(call => call.path.startsWith('datasets/') && call.method === 'DELETE'));

const downloadPromise = page.waitForEvent('download');
await page.locator('#ncbExport').click();
const download = await downloadPromise;
assert.match(download.suggestedFilename(), /nova-bi-export\.json$/);

await page.locator('#ncbClose').focus();
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaBICloud').evaluate(el => el.classList.contains('show')), false);
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), true, 'Agents workspace must remain open underneath Company Cloud');
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), false);
assert.deepEqual(pageErrors, []);
await browser.close();
process.stdout.write('PASS Company Cloud mobile browser flow: sign-in, workspace, branding, invitations, approval, export and keyboard close\n');
