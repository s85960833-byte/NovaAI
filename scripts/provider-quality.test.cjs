'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  gateProvidersForRoute,
  isQualifyingEvidence
} = require('../nova-provider-quality');
const evidence = require('../provider-quality-evidence.json');

const baseRecord = overrides => ({
  providerId: 'groq',
  modelId: 'llama-verified',
  tier: 'T2',
  score: 94,
  testCount: 100,
  evaluationSetVersion: 'golden-100-v1',
  evaluatedAt: '2026-11-14',
  evidenceCommitSha: 'a'.repeat(40),
  reportPath: 'docs/provider-quality/groq-llama-verified.md',
  ...overrides
});

test('evidence registry starts empty until a real model evaluation is committed', () => {
  assert.deepEqual(evidence.models, []);
  assert.equal(evidence.evaluationSetVersion, 'golden-100-v1');
  assert.equal(evidence.minimumCases, 100);
  assert.equal(evidence.minimumScore, 90);
});

test('unverified code and deep-research models are blocked rather than silently downgraded', () => {
  const providers = [
    { id: 'primary', models: ['primary-model'] },
    { id: 'groq', models: ['groq-model'] },
    { id: 'openrouter', models: ['openrouter/free'] },
    { id: 'cloudflare-workers-ai', models: ['@cf/model'] }
  ];

  for (const route of ['code', 'deep-research']) {
    const result = gateProvidersForRoute(providers, route, evidence);
    assert.equal(result.requiresTier2, true);
    assert.equal(result.blocked, true);
    assert.deepEqual(result.providers, []);
    assert.equal(result.excludedModels.length, 4);
  }
});

test('ordinary chat and other non-code routes keep the configured fallback chain', () => {
  const providers = [{ id: 'groq', models: ['groq-model'] }];
  for (const route of ['chat', 'prompt-writing', 'live-search', 'image', 'voice']) {
    const result = gateProvidersForRoute(providers, route, evidence);
    assert.equal(result.blocked, false);
    assert.equal(result.requiresTier2, false);
    assert.equal(result.providers, providers);
  }
});

test('only exact provider/model pairs with qualifying T1/T2 evidence are kept', () => {
  const providers = [
    { id: 'groq', models: ['llama-verified', 'llama-unverified'] },
    { id: 'openrouter', models: ['llama-verified'] }
  ];
  const result = gateProvidersForRoute(providers, 'code', {
    ...evidence,
    models: [baseRecord()]
  });

  assert.equal(result.blocked, false);
  assert.deepEqual(result.providers, [{ id: 'groq', models: ['llama-verified'] }]);
  assert.deepEqual(result.excludedModels, [
    { providerId: 'groq', modelId: 'llama-unverified' },
    { providerId: 'openrouter', modelId: 'llama-verified' }
  ]);
});

test('evidence below thresholds, missing references or wrong suite versions is rejected', () => {
  const invalid = [
    baseRecord({ tier: 'T3' }),
    baseRecord({ score: 89 }),
    baseRecord({ testCount: 99 }),
    baseRecord({ evaluationSetVersion: 'other-suite' }),
    baseRecord({ evidenceCommitSha: 'not-a-commit' }),
    baseRecord({ reportPath: '' }),
    baseRecord({ evaluatedAt: 'not-a-date' })
  ];
  for (const record of invalid) assert.equal(isQualifyingEvidence(record, evidence), false);
  assert.equal(isQualifyingEvidence(baseRecord(), evidence), true);
});

test('provider quality filtering never mutates the original configured chain', () => {
  const providers = [{ id: 'groq', models: ['llama-verified', 'llama-unverified'] }];
  const before = JSON.stringify(providers);
  gateProvidersForRoute(providers, 'code', { ...evidence, models: [baseRecord()] });
  assert.equal(JSON.stringify(providers), before);
});
