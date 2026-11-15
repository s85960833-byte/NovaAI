'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ACCOUNT_DELETION_CONFIRMATION, createAccountDeletionHandler } = require('../nova-account-deletion');

function recorder() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}
function request(overrides = {}) {
  return { novaUser: { id: '11111111-1111-4111-8111-111111111111' }, body: { confirm: ACCOUNT_DELETION_CONFIRMATION }, query: { dry_run: 'true' }, ...overrides };
}
function fakeSupabaseFetch(options = {}) {
  const calls = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, method: init.method || 'GET' });
    if (url.pathname.endsWith('/nova_bi_memberships') && url.searchParams.get('role') === 'eq.owner') {
      return new Response(JSON.stringify(options.owners || []), { status: 200 });
    }
    if (url.pathname.endsWith('/nova_bi_memberships') && url.searchParams.has('organization_id')) {
      return new Response(JSON.stringify(options.members || []), { status: 200 });
    }
    const count = options.counts && options.counts[url.pathname.split('/').pop()] || 0;
    return new Response('[]', { status: 200, headers: { 'content-range': '*/' + String(count) } });
  };
  return { fetchImpl, calls };
}

test('ACCOUNT_DELETION_ENABLED off returns 404 without querying Supabase', async () => {
  const { fetchImpl, calls } = fakeSupabaseFetch();
  const handler = createAccountDeletionHandler({ enabled: false, supabaseUrl: 'https://test-project.supabase.co', serviceRoleKey: 'fake-service-role-only', fetchImpl });
  const res = recorder();
  await handler(request(), res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'account_deletion_disabled' });
  assert.equal(calls.length, 0);
});

test('dry-run requires explicit confirmation and returns counts without mutating data', async () => {
  const { fetchImpl, calls } = fakeSupabaseFetch({ counts: { nova_user_workspaces: 1, nova_bi_datasets: 2, nova_bi_analyses: 3 } });
  const handler = createAccountDeletionHandler({ enabled: true, supabaseUrl: 'https://test-project.supabase.co', serviceRoleKey: 'fake-service-role-only', fetchImpl });
  const missing = recorder();
  await handler(request({ body: {} }), missing);
  assert.equal(missing.statusCode, 400);
  const res = recorder();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dry_run, true);
  assert.equal(res.body.plan.counts.nova_user_workspaces, 1);
  assert.equal(res.body.plan.counts.nova_bi_datasets, 2);
  assert.equal(res.body.plan.counts.nova_bi_analyses, 3);
  assert.equal(res.body.plan.executionReady, false);
  assert.equal(res.body.plan.storage.status, 'not_assessed');
  assert.ok(calls.length > 0);
  assert.ok(calls.every(call => call.method === 'GET'));
  assert.ok(calls.every(call => call.url.pathname.startsWith('/rest/v1/')));
  assert.equal(JSON.stringify(res.body).includes('fake-service-role-only'), false);
});

test('shared company owner with other members receives 409 before row counts', async () => {
  const { fetchImpl, calls } = fakeSupabaseFetch({
    owners: [{ organization_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }],
    members: [{ user_id: '11111111-1111-4111-8111-111111111111' }, { user_id: '22222222-2222-4222-8222-222222222222' }]
  });
  const handler = createAccountDeletionHandler({ enabled: true, supabaseUrl: 'https://test-project.supabase.co', serviceRoleKey: 'fake-service-role-only', fetchImpl });
  const res = recorder();
  await handler(request(), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'shared_company_ownership_transfer_required');
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.method === 'GET'));
});

test('actual account deletion remains blocked until approved lifecycle execution exists', async () => {
  const { fetchImpl, calls } = fakeSupabaseFetch();
  const handler = createAccountDeletionHandler({ enabled: true, supabaseUrl: 'https://test-project.supabase.co', serviceRoleKey: 'fake-service-role-only', fetchImpl });
  const res = recorder();
  await handler(request({ query: {} }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'account_deletion_execution_requires_approved_data_lifecycle');
  assert.ok(calls.every(call => call.method === 'GET'));
});
