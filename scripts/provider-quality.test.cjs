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

const app = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'nova-app.js'), 'utf8');
const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const clientRoute = require('../nova-quality-route');

test('client intent classifier protects code and research in BYOK and embedded-preview mode', () => {
  const required = [
    'Write a Python function to sort a list',
    'Debug this JavaScript code',
    'Please fix this code',
    'Do deep research on battery storage',
    'इस कोड को ठीक करो',
    'python code likho',
    'भारत पर गहन शोध करो',
    '```js\nconsole.log(1)\n```'
  ];
  for (const prompt of required) assert.equal(clientRoute.requiresVerifiedTier2Request(prompt), true, prompt);

  const ordinary = ['Hello Nova', 'Explain photosynthesis', 'What is Python?', 'आज मौसम कैसा है?'];
  for (const prompt of ordinary) assert.equal(clientRoute.requiresVerifiedTier2Request(prompt), false, prompt);
  assert.ok(app.includes('if(isTier2RequestForClient(latestRequest&&latestRequest.c)&&(SMP||!SV))'));
  assert.ok(app.includes('BYOK या embedded preview model से इन requests का जवाब नहीं दिया जाएगा।'));
  assert.ok(html.includes('<script src="/nova-quality-route.js"></script><script src="/nova-app.js"></script>'));
});

const server = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('chat completion handler applies the model-quality gate before failover execution', () => {
  assert.ok(server.includes("const { gateProvidersForRoute } = require('./nova-provider-quality');"));
  assert.ok(server.includes('const qualityGate = gateProvidersForRoute(providers, routeDecision.route);'));
  assert.ok(server.includes('if (qualityGate.blocked) {'));
  assert.ok(server.includes("r.set('X-Nova-Capability-Status', 'quality_unverified');"));
  assert.ok(server.includes("code: 'quality_tier_unverified'"));
  assert.ok(server.includes('providers: qualityGate.providers'));
});
