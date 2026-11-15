'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createUsageQuota, currentPeriod, estimateInputTokens } = require('../nova-usage-quota');

const USER = '11111111-1111-4111-8111-111111111111';
const PLANS = {
  free: { monthlyCredits: 1, decision: 'TEST ONLY' },
  pro: { monthlyCredits: 5, decision: 'TEST ONLY' },
  ultra: { monthlyCredits: 10, decision: 'TEST ONLY' }
};

function makeQuota(fetchImpl) {
  return createUsageQuota({
    enabled: true,
    supabaseUrl: 'https://mock-project.supabase.invalid',
    serviceRoleKey: 'fake-service-role-test-only',
    plans: PLANS,
    fetchImpl,
    now: () => new Date('2026-11-15T00:00:00.000Z')
  });
}

function okJson(value) { return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } }); }

test('monthly period and conservative input-token estimate are stable', () => {
  assert.equal(currentPeriod(new Date('2026-11-15T00:00:00Z')), '2026-11');
  assert.equal(estimateInputTokens([{ role: 'user', content: '12345678' }]), 10);
});

test('usage reservation below the configured monthly limit passes', async () => {
  const calls = [];
  const quota = makeQuota(async (url, init) => {
    calls.push({ url: new URL(String(url)), init });
    if (String(url).includes('/nova_user_entitlements?')) return okJson([{ plan: 'free' }]);
    return okJson(true);
  });
  const result = await quota.reserve({ userId: USER, mode: 'quick', provider: 'primary', inputTokens: 12, reservationId: '11111111-1111-4111-8111-111111111112' });
  assert.equal(result.ok, true);
  assert.equal(result.plan, 'free');
  assert.equal(result.period, '2026-11');
  assert.equal(calls.length, 2);
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.p_user_id, USER);
  assert.equal(body.p_limit, 1);
  assert.equal(body.p_input_tokens, 12);
  assert.equal(body.p_output_tokens, 0);
});

test('monthly limit reached returns quota_exceeded', async () => {
  const quota = makeQuota(async url => {
    if (String(url).includes('/nova_user_entitlements?')) return okJson([{ plan: 'free' }]);
    return okJson(false);
  });
  const result = await quota.reserve({ userId: USER });
  assert.deepEqual(result, { ok: false, reason: 'quota_exceeded' });
});

test('simultaneous reservations respect the atomic database reservation result', async () => {
  let used = 0;
  const quota = makeQuota(async url => {
    if (String(url).includes('/nova_user_entitlements?')) return okJson([{ plan: 'free' }]);
    // Model the SQL transaction's lock/conditional increment in the mocked RPC.
    if (used >= 1) return okJson(false);
    used += 1;
    return okJson(true);
  });
  const results = await Promise.all([
    quota.reserve({ userId: USER, reservationId: '22222222-2222-4222-8222-222222222221' }),
    quota.reserve({ userId: USER, reservationId: '22222222-2222-4222-8222-222222222222' })
  ]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.filter(result => result.reason === 'quota_exceeded').length, 1);
});

test('ledger outage and unconfigured owner credits fail closed', async () => {
  const down = makeQuota(async () => { throw new Error('mock ledger unavailable'); });
  assert.deepEqual(await down.reserve({ userId: USER }), { ok: false, reason: 'quota_ledger_unavailable' });
  const unconfigured = createUsageQuota({
    enabled: true, supabaseUrl: 'https://mock-project.supabase.invalid',
    serviceRoleKey: 'fake-key',
    plans: { free: { monthlyCredits: null } },
    fetchImpl: async () => okJson([{ plan: 'free' }])
  });
  assert.deepEqual(await unconfigured.reserve({ userId: USER }), { ok: false, reason: 'plan_not_configured' });
});
