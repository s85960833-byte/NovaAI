import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(15000);
const progress = label => console.log(`[Company Cloud browser] ${label}`);

function makePdfFixture() {
  const stream = 'BT /F1 12 Tf 72 72 Td (NOVA PDF SECURITY TEST) Tj ET';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    '4 0 obj\n<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + '\nendstream\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
  return Buffer.from(pdf, 'binary');
}
progress('browser initialized');
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
page.on('console', message => { if (message.type() === 'error') progress('browser console error: ' + message.text()); });
const inspectPage = async (label, evaluate, timeoutMs = 5000) => {
  let timer;
  try {
    return await Promise.race([
      page.evaluate(evaluate),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + timeoutMs + 'ms')), timeoutMs); })
    ]);
  } catch (error) {
    progress(label + ' timed out; collecting renderer stack');
    let session;
    try {
      session = await page.context().newCDPSession(page);
      await session.send('Debugger.enable');
      const paused = new Promise(resolve => session.once('Debugger.paused', resolve));
      await session.send('Debugger.pause');
      const event = await Promise.race([paused, new Promise(resolve => setTimeout(() => resolve(null), 2000))]);
      if (event) progress('renderer stack: ' + JSON.stringify(event.callFrames.slice(0, 10).map(frame => ({ fn: frame.functionName, url: frame.url, line: frame.location.lineNumber + 1, column: frame.location.columnNumber + 1 }))));
      await session.send('Debugger.resume').catch(() => {});
    } catch (diagnosticError) {
      progress('renderer diagnostic unavailable: ' + diagnosticError.message);
    } finally {
      if (session) await session.detach().catch(() => {});
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
page.on('dialog', dialog => dialog.accept());

// Keep the browser test independent of external Google Fonts availability; CI installs the Devanagari fallback locally.
await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' }));
await page.route('https://fonts.gstatic.com/**', route => route.abort());

let supabaseStubHit = false;
await page.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, route => {
  supabaseStubHit = true;
  return route.fulfill({ status: 200, contentType: 'application/javascript', body: `let testSession = null; let authListener = null;
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
};` });
});

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

const localHealth = await fetch('http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(5000) });
assert.equal(localHealth.status, 200, 'local NOVA server must be healthy before Company Cloud browser tests');
const homeResponse = await page.goto('http://127.0.0.1:8787', { waitUntil: 'commit', timeout: 15000 });
assert.equal(homeResponse?.status(), 200, 'local NOVA homepage must return HTTP 200');
await page.waitForTimeout(1000);
progress('local homepage loaded');
const pdfModuleCheck = await page.evaluate(async () => {
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/legacy/build/pdf.mjs');
    return { ok: true, version: module.version };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});
progress('PDF.js module import ' + JSON.stringify(pdfModuleCheck));
assert.equal(pdfModuleCheck.ok, true, 'pinned PDF.js module must load under the production CSP');
await page.locator('#file').setInputFiles({
  name: 'nova-security-test.pdf',
  mimeType: 'application/pdf',
  buffer: makePdfFixture()
});
try {
  await page.waitForFunction(() => {
    try {
      const state = JSON.parse(localStorage.getItem('nova') || '{}');
      return (state.chats || []).some(chat => chat.doc?.t?.includes('NOVA PDF SECURITY TEST'));
    } catch { return false; }
  }, null, { timeout: 30000 });
} catch (error) {
  const diagnostic = await page.evaluate(() => {
    let savedText = '';
    try {
      const state = JSON.parse(localStorage.getItem('nova') || '{}');
      savedText = (state.chats || []).map(chat => chat.doc?.t || '').join(' ').slice(0, 180);
    } catch {}
    const docbar = document.querySelector('#docbar');
    const toast = document.querySelector('#toast');
    return {
      pdfModuleLoaded: !!window.pdfjsLib,
      docbarHidden: !!docbar?.hidden,
      docbarText: docbar?.textContent || '',
      toastHidden: !!toast?.hidden,
      toastText: toast?.textContent || '',
      savedText
    };
  });
  progress('PDF upload diagnostic ' + JSON.stringify(diagnostic));
  throw error;
}
progress('patched PDF.js module and worker extracted sample text');
progress('before bootstrap inspection');
const bootstrap = await inspectPage('NOVA bootstrap inspection', () => ({ ready: document.readyState, hasHome: !!document.querySelector('#hi'), logHtml: document.querySelector('#log')?.innerHTML.slice(0,160) || '', registryGroups: window.NovaModeRegistry?.groups?.length || 0, workspaceApi: typeof window.NovaModeWorkspace }));
progress('bootstrap inspection returned');
console.log('NOVA bootstrap', JSON.stringify(bootstrap));
progress('before Company Cloud observer stability inspection');
const idleCloudMutations = await inspectPage('Company Cloud observer stability inspection', async () => {
  const overlay = document.querySelector('#novaBICloud');
  if (!overlay) return null;
  const sample = () => new Promise(resolve => {
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(overlay, { subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
    setTimeout(() => { observer.disconnect(); resolve(mutations); }, 200);
  });
  const initial = await sample();
  const stable = await sample();
  return { initial, stable };
});
assert.ok(idleCloudMutations, 'Company Cloud overlay must be mounted');
assert.equal(idleCloudMutations.stable, 0, 'Company Cloud bilingual observer must settle without repeatedly rewriting unchanged text or attributes');
progress('idle bilingual observer is stable');
await page.locator('#hi .nr-card[data-group="agents"]').waitFor({ state: 'visible', timeout: 15000 });
await page.waitForFunction(() => typeof window.supabase?.createClient === 'function', null, { timeout: 10000 });
assert.equal(supabaseStubHit, true, 'Supabase CDN must be replaced by the deterministic browser auth stub');

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
console.log('PASS BI CSV analysis flow');
progress('CSV analysis passed');

await page.locator('#nbNav [data-view="risk"]').click();
await page.locator('#nbProjectName').fill('Test migration');
await page.locator('#nbDue').fill('2026-12-31');
await page.locator('#nbProgress').fill('30');
await page.locator('#nbBlockers').fill('2');
await page.locator('#nbRiskRun').click();
await page.locator('#nbBody').getByText('Project Risk Predictor').waitFor();
console.log('PASS BI project risk flow');
progress('risk flow passed');

await page.locator('#nbNav [data-view="scenario"]').click();
await page.locator('#nbBaseline').fill('100000');
await page.locator('#nbScenarioRun').click();
await page.locator('#nbBody').getByText('Scenario result').waitFor();
console.log('PASS BI scenario flow');
progress('scenario flow passed');

await page.locator('#nbNav [data-view="workflow"]').click();
await page.locator('#nbProcess').fill('Weekly project status report');
await page.locator('#nbApprover').fill('Project manager');
await page.locator('#nbWorkflowRun').click();
await page.locator('#nbBody pre').waitFor();
console.log('PASS BI workflow proposal flow');
progress('workflow proposal passed');

await page.locator('#nbNav [data-view="proof"]').click();
await page.locator('#nbProofExport').waitFor();
const proofDownloadPromise = page.waitForEvent('download', { timeout: 15000 });
await page.locator('#nbProofExport').click();
const proofDownload = await proofDownloadPromise;
console.log('PASS BI Action Proof download');
progress('Action Proof export passed');
assert.match(proofDownload.suggestedFilename(), /nova-action-proof\.json$/);
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaBusiness').evaluate(el => el.classList.contains('show')), false);
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), true, 'Agents workspace must remain open underneath Business Intelligence');

await page.locator('#nmContent [data-quick="openCompanyCloud"]').waitFor({ state: 'visible', timeout: 10000 });
await page.locator('#nmContent [data-quick="openCompanyCloud"]').click();
await page.locator('#ncbAuth').waitFor();
const preSignupNotice = await page.locator('#ncbContent').innerText();
assert.match(preSignupNotice, /Raw CSV rows stay in this browser/i, 'signup must disclose where raw CSV rows are processed');
assert.match(preSignupNotice, /Render Singapore and Supabase Ireland/i, 'signup must disclose the current cloud processing regions');
assert.match(preSignupNotice, /metadata may be processed outside India/i, 'signup must disclose cross-border metadata processing');
assert.match(preSignupNotice, /Do not upload confidential, regulated or production employee data/i, 'signup must disclose the current sensitive-data restriction');
assert.match(preSignupNotice, /account-deletion processes are not yet published/i, 'signup must disclose the current account-deletion limitation');
progress('Company Cloud auth view and pre-signup data notice opened');
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbPassword').fill('a-strong-test-password');
await page.locator('#ncbAuth button[data-mode="signup"]').click();
await page.waitForFunction(() => window.__authCalls.some(x => x.method === 'signUp') || document.querySelector('#ncbMessage')?.textContent.includes('Authentication failed'), null, { timeout: 10000 });
const authAfterSignup = await page.evaluate(() => window.__authCalls.find(x => x.method === 'signUp'));
assert.ok(authAfterSignup, 'Signup handler did not call Supabase signUp. UI message: ' + await page.locator('#ncbMessage').textContent());
assert.match(await page.locator('#ncbMessage').textContent(), /Account created/, 'Signup completed but confirmation status was not shown.');
progress('signup UI passed');
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
progress('password reset UI passed');
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
progress('password recovery UI passed');
await page.locator('#ncbAuth').waitFor();
await page.locator('#ncbEmail').fill('owner@example.test');
await page.locator('#ncbPassword').fill('a-strong-test-password');
await page.locator('#ncbAuth button[data-mode="signin"]').click();
await page.locator('#ncbBranding').waitFor({ timeout: 15000 });
progress('signed-in workspace loaded');
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
progress('branding update passed');

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
progress('new and existing account invitation UI passed');

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

const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
await page.locator('#ncbExport').click();
const download = await downloadPromise;
console.log('PASS Company Cloud data export download');
assert.match(download.suggestedFilename(), /nova-bi-export\.json$/);

await page.locator('#ncbClose').focus();
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaBICloud').evaluate(el => el.classList.contains('show')), false);
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), true, 'Agents workspace must remain open underneath Company Cloud');
await page.keyboard.press('Escape');
assert.equal(await page.locator('#novaModes').evaluate(el => el.classList.contains('open')), false);
assert.deepEqual(pageErrors, []);
progress('all browser assertions passed');
await browser.close();
process.stdout.write('PASS Company Cloud mobile browser flow: sign-in, workspace, branding, invitations, approval, export and keyboard close\n');
