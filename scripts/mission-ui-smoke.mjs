import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, serviceWorkers: 'block' });
const page = await context.newPage();

const missionId = '123e4567-e89b-42d3-a456-426614174000';
const approvalId = '223e4567-e89b-42d3-a456-426614174000';
const taskId = '323e4567-e89b-42d3-a456-426614174000';
const taskId2 = '423e4567-e89b-42d3-a456-426614174000';
const approvalId2 = '523e4567-e89b-42d3-a456-426614174000';
page.on('dialog', dialog => dialog.accept());
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
      let tasks = [];
      let events = [];
      const proofs = [{ id: 'proof-1', proof_type: 'browser-test', verification_status: 'passed', summary: 'Homepage smoke test passed' }];
      let approvals = [];
      const client = { auth: { onAuthStateChange() {}, getSession: async () => ({ data: { session: null } }) } };
      window.NovaBusinessCloud = Object.freeze({
        open() {}, close() {}, getClient() { return client; }, version: 'mock',
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
          if (path === 'missions/' + id + '/plan' && method === 'POST') {
            missions = [{ ...missions[0], state: 'planned', version: 1 }];
            tasks = [
              { id: ${JSON.stringify(taskId)}, sequence: 1, title: 'Confirm requirements', status: 'planned' },
              { id: ${JSON.stringify(taskId2)}, sequence: 2, title: 'Run checks', status: 'planned' }
            ];
            events = [
              { id: 'event-1', event_type: 'mission.created', from_state: null, to_state: 'draft' },
              { id: 'event-2', event_type: 'mission.planned', from_state: 'draft', to_state: 'planned' }
            ];
            return { mission: missions[0], tasks, events, proofs, plan_type: 'starter_template' };
          }
          if (path === 'missions/' + id + '/tasks/' + ${JSON.stringify(taskId)} + '/approval' && method === 'POST') {
            approvals = [{ id: ${JSON.stringify(approvalId)}, task_id: ${JSON.stringify(taskId)}, action_summary: payload.action_summary, status: 'pending', requested_at: '2026-11-10T10:00:00.000Z' }];
            tasks = tasks.map(task => task.id === ${JSON.stringify(taskId)} ? { ...task, status: 'waiting_approval' } : task);
            missions = [{ ...missions[0], state: 'waiting_approval', version: missions[0].version + 1 }];
            return { approval: approvals[0], execution_run: { status: 'awaiting_approval' } };
          }
          if (path === 'missions/' + id + '/tasks/' + ${JSON.stringify(taskId2)} + '/approval' && method === 'POST') {
            approvals = [...approvals, { id: ${JSON.stringify(approvalId2)}, task_id: ${JSON.stringify(taskId2)}, action_summary: payload.action_summary, status: 'pending', requested_at: '2026-11-10T10:01:00.000Z' }];
            tasks = tasks.map(task => task.id === ${JSON.stringify(taskId2)} ? { ...task, status: 'waiting_approval' } : task);
            missions = [{ ...missions[0], state: 'waiting_approval', version: missions[0].version + 1 }];
            return { approval: approvals[1], execution_run: { status: 'awaiting_approval' } };
          }
          if (path === 'missions/' + id + '/cancel' && method === 'POST') {
            const previousState = missions[0].state;
            missions = [{ ...missions[0], state: 'cancelled', version: missions[0].version + 1 }];
            tasks = tasks.map(task => ['completed','failed','cancelled'].includes(task.status) ? task : { ...task, status: 'cancelled' });
            events = [...events, { id: 'event-cancel', event_type: 'mission.cancelled', from_state: previousState, to_state: 'cancelled' }];
            approvals = approvals.map(approval => approval.status === 'pending' ? { ...approval, status: 'expired' } : approval);
            return { mission: missions[0] };
          }
          if (path.startsWith('approvals/') && path.endsWith('/decision') && method === 'POST') {
            const selectedApprovalId = path.split('/')[1];
            const selectedApproval = approvals.find(approval => approval.id === selectedApprovalId);
            approvals = approvals.map(approval => approval.id === selectedApprovalId ? { ...approval, status: payload.decision === 'approve' ? 'approved' : 'rejected' } : approval);
            tasks = tasks.map(task => task.id === selectedApproval?.task_id ? { ...task, status: payload.decision === 'approve' ? 'planned' : 'failed' } : task);
            missions = [{ ...missions[0], state: payload.decision === 'approve' ? 'planned' : 'failed', version: missions[0].version + 1 }];
            return { approval: approvals.find(approval => approval.id === selectedApprovalId), execution_run: { status: payload.decision === 'approve' ? 'authorized' : 'blocked' } };
          }
          if (path === 'missions/' + id && method === 'GET') {
            if (!events.length) events = [{ id: 'event-1', event_type: 'mission.created', from_state: null, to_state: 'draft' }];
            return { mission: missions[0], tasks, events, proofs, approvals, execution_runs: [] };
          }
          throw new Error('Unexpected mocked Mission API route: ' + method + ' ' + path);
        }
      });
    })();
  `,
}));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.NovaBusinessCloud?.version === 'mock', undefined, { timeout: 5000 });
await page.evaluate(() => window.NovaSuite?.open());
await page.locator('#novaSuite').waitFor({ state: 'visible', timeout: 10000 });
await page.locator('#nsNav [data-id="missions"]').click();
await page.locator('#missionTitle').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#novaSuite').innerText()).includes('Mission Control'));

await page.locator('#missionTitle').fill('Test website mission');
await page.locator('#missionDescription').fill('Build a simple landing page and verify it loads.');
await page.locator('#missionWorkspace').selectOption('build');
await page.locator('#missionForm').evaluate(form => form.requestSubmit());
await page.waitForTimeout(300);
await page.locator('[data-mission-id="' + missionId + '"]').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionList').innerText()).includes('Test website mission'));

await page.locator('[data-mission-id="' + missionId + '"]').click();
await page.locator('#missionDetail').getByText('Homepage smoke test passed').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionDetail').innerText()).includes('mission.created'));
await page.locator('#missionPlanBtn').click();
await page.locator('#missionDetail').getByText('Confirm requirements').waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionDetail').innerText()).includes('mission.planned'));
assert.ok((await page.locator('#missionDetail').innerText()).includes('Planned'));
assert.equal(await page.locator('#missionPlanBtn').count(), 0, 'A planned mission must not offer duplicate plan generation');
await page.locator('[data-task-approval="' + taskId + '"]').click();
await page.locator('[data-approval-decision="approve"]').waitFor({ state: 'visible', timeout: 5000 });
await page.locator('[data-approval-decision="approve"]').click();
await page.locator('#missionDetail').getByText('approved', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
assert.equal(await page.locator('[data-task-approval="423e4567-e89b-42d3-a456-426614174000"]').count(), 1, 'Remaining planned tasks must keep approval requests available after approval while no executor is running');
await page.locator('[data-task-approval="' + taskId2 + '"]').click();
await page.locator('[data-approval-decision="reject"]').waitFor({ state: 'visible', timeout: 5000 });
await page.locator('[data-approval-decision="reject"]').click();
await page.locator('#missionDetail').getByText('rejected', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
assert.ok((await page.locator('#missionDetail').innerText()).includes('Failed'), 'Rejecting an approval must fail the gated task and mission');
assert.ok((await page.locator('#missionDetail').innerText()).includes('Execution is not started automatically after approval.'));
await page.locator('#missionCancelBtn').waitFor({ state: 'visible', timeout: 5000 });
await page.locator('#missionCancelBtn').click();
await page.waitForFunction(() => document.querySelector('#toast')?.textContent === 'Mission cancelled.', undefined, { timeout: 5000 });
await page.waitForTimeout(150);
assert.ok((await page.locator('#missionDetail').innerText()).includes('Cancelled'), 'Cancelled mission state must appear in detail');
assert.equal(await page.locator('#missionCancelBtn').count(), 0, 'A cancelled mission must not offer cancellation again');
console.log('PASS Mission Control creates a no-cost starter plan, requests and approves one task, rejects another, then cancels the mission');

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

await context.close();
await browser.close();
