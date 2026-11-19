'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sameOrigin, exactKeys, validClientId, consumeWindow, plainObject } = require('../str/security');

function req({ method = 'POST', origin = 'https://novaai-4auo.onrender.com', host = 'novaai-4auo.onrender.com', protocol = 'https', fetchSite = 'same-origin' } = {}) {
  const headers = { origin, host, 'sec-fetch-site': fetchSite };
  return { method, protocol, get: name => headers[name.toLowerCase()] || undefined };
}

test('STR origin guard accepts exact same origin and rejects cross-origin/null origins', () => {
  assert.equal(sameOrigin(req()), true);
  assert.equal(sameOrigin(req({ origin: 'https://attacker.example' })), false);
  assert.equal(sameOrigin(req({ origin: 'null' })), false);
  assert.equal(sameOrigin(req({ fetchSite: 'cross-site' })), false);
  assert.equal(sameOrigin(req({ origin: undefined })), false);
  assert.equal(sameOrigin(req({ method: 'GET', origin: undefined })), true);
});

test('STR fixed payload schemas reject unknown and missing fields', () => {
  assert.equal(exactKeys({ prompt: 'hello', uiLang: 'en' }, ['prompt', 'uiLang']), true);
  assert.equal(exactKeys({ prompt: 'hello', uiLang: 'en', model: 'arbitrary' }, ['prompt', 'uiLang']), false);
  assert.equal(exactKeys({ prompt: 'hello' }, ['prompt', 'uiLang']), false);
  assert.equal(plainObject({ a: 1 }), true);
  assert.equal(plainObject([]), false);
  assert.equal(plainObject(null), false);
});

test('STR client identifiers have a strict bounded format', () => {
  assert.equal(validClientId('client_1234567890'), true);
  assert.equal(validClientId('short'), false);
  assert.equal(validClientId('x'.repeat(65)), false);
  assert.equal(validClientId('bad id 123456789'), false);
});

test('STR per-client rate windows reset and fail closed at capacity', () => {
  const map = new Map();
  assert.equal(consumeWindow(map, 'ip:a', 1000, 2, 60000).allowed, true);
  assert.equal(consumeWindow(map, 'ip:a', 1001, 2, 60000).allowed, true);
  assert.equal(consumeWindow(map, 'ip:a', 1002, 2, 60000).allowed, false);
  assert.equal(consumeWindow(map, 'ip:a', 61000, 2, 60000).allowed, true);
  const full = new Map([['old', { start: 0, count: 1 }]]);
  assert.equal(consumeWindow(full, 'new', 1000, 2, 60000, 1).capacity, true);
});


const { eligibleProviders, chooseProvider } = require('../str/provider-router');

test('customer data can only route to verified paid no-training providers with known quotas', () => {
  const base = { model: 'safe-model', verified_on: '2026-11-19', requests_per_minute: 10, tokens_per_minute: 10000, requests_per_day: 100, tokens_per_day: 100000 };
  const config = { providers: [
    { ...base, provider: 'free', data_tier: 'unpaid' },
    { ...base, provider: 'unknown', data_tier: 'unverified' },
    { ...base, provider: 'paid', data_tier: 'paid_no_training' },
    { ...base, provider: 'paid-unknown-quota', data_tier: 'paid_no_training', tokens_per_minute: null }
  ] };
  assert.deepEqual(eligibleProviders(config, 'customer_data').map(p => p.provider), ['paid']);
  assert.equal(chooseProvider(config, 'customer_data', { inputTokens: 4000, outputTokens: 2000 }).provider.provider, 'paid');
  assert.equal(chooseProvider(config, 'customer_data', { inputTokens: 9000, outputTokens: 2000 }).provider, null);
});

test('owner-only non-personal tests may use any configured tier but never unknown quotas', () => {
  const config = { providers: [
    { provider: 'unverified', model: 'test-model', data_tier: 'unverified', verified_on: null, requests_per_minute: 5, tokens_per_minute: 5000, requests_per_day: 20, tokens_per_day: 20000 },
    { provider: 'unknown-limits', model: 'test-model', data_tier: 'unpaid', requests_per_minute: null, tokens_per_minute: null, requests_per_day: null, tokens_per_day: null }
  ] };
  assert.deepEqual(eligibleProviders(config, 'owner_non_personal_test_data').map(p => p.provider), ['unverified']);
  assert.equal(chooseProvider(config, 'customer_data').provider, null);
});

