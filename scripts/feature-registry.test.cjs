'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve, relative, isAbsolute } = require('node:path');

const root = process.cwd();
const registry = JSON.parse(readFileSync(resolve(root, 'FEATURE_REGISTRY.json'), 'utf8'));
const server = readFileSync(resolve(root, 'nova-server.txt'), 'utf8');
const modeRegistry = readFileSync(resolve(root, 'mode-registry.js'), 'utf8');
const uiAdapter = readFileSync(resolve(root, 'nova-feature-registry-ui.js'), 'utf8');
const statuses = new Set(['implemented', 'preview', 'blocked', 'not_implemented']);
const uiStatuses = new Set(['live', 'beta', 'hidden']);
const planTiers = new Set(['free', 'pro', 'ultra', 'hidden']);

function safeRepoPath(file) {
  assert.equal(typeof file, 'string');
  assert.ok(file.length > 0);
  assert.equal(isAbsolute(file), false);
  const resolved = resolve(root, file);
  const rel = relative(root, resolved);
  assert.ok(rel && !rel.startsWith('..'));
  return resolved;
}
const hasFeature = id => registry.features.some(feature => feature.id === id);

test('registry schema and release gates are conservative', () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.release.productionReady, false);
  assert.equal(registry.release.marketingClaimsAllowed, false);
  assert.equal(registry.release.checkoutEnabled, false);
  assert.equal(registry.release.proPlanEnabled, false);
  assert.equal(registry.release.ultraPlanEnabled, false);
  assert.equal(registry.release.paidPriceINR, null);
  assert.equal(registry.enforcement.wiredToRuntimeFeatureFlags, true);
  assert.equal(registry.enforcement.wiredToUiRegistry, true);
  assert.equal(registry.enforcement.wiredToPricingPage, false);
  assert.equal(registry.enforcement.endToEndTruthEnforcement, false);
});

test('feature IDs, source paths, routes and availability states are valid', () => {
  const ids = new Set();
  for (const feature of registry.features) {
    assert.equal(typeof feature.id, 'string');
    assert.equal(ids.has(feature.id), false, 'duplicate ID ' + feature.id);
    ids.add(feature.id);
    assert.equal(statuses.has(feature.status), true);
    assert.equal(uiStatuses.has(feature.uiStatus), true);
    assert.equal(planTiers.has(feature.planTier), true);
    assert.equal(feature.productionReady, false);
    assert.equal(feature.marketingClaimsAllowed, false);
    for (const file of [...feature.sourceFiles, ...feature.testFiles]) {
      assert.equal(existsSync(safeRepoPath(file)), true, feature.id + ' references missing file ' + file);
    }
    if (feature.status === 'not_implemented') assert.equal(feature.productExposure, 'not_offered');
    for (const marker of feature.routeMarkers || []) assert.ok(server.includes(marker));
  }
});

test('every UI workspace, mode and quick action maps to an existing registry feature', () => {
  const actualModes = new Map([...modeRegistry.matchAll(/id:'([^']+)',group:'([^']+)'/g)].map(match => [match[1], match[2]]));
  const registeredModes = new Map(registry.uiModes.map(item => [item.id, item]));
  assert.deepEqual([...actualModes.keys()].sort(), [...registeredModes.keys()].sort());
  const workspaces = new Map(registry.workspaces.map(item => [item.id, item]));
  assert.deepEqual([...new Set(actualModes.values())].sort(), [...workspaces.keys()].sort());
  for (const [id, area] of actualModes) {
    const item = registeredModes.get(id);
    assert.equal(item.area, area);
    assert.equal(hasFeature(item.featureId), true, id + ' unknown feature');
    assert.equal(uiStatuses.has(item.status), true);
    assert.equal(planTiers.has(item.planTier), true);
  }
  for (const action of registry.quickActions) {
    assert.equal(hasFeature(action.featureId), true, action.id + ' unknown feature');
    assert.equal(uiStatuses.has(action.status), true);
    assert.equal(planTiers.has(action.planTier), true);
  }
  assert.ok(uiAdapter.includes('/FEATURE_REGISTRY.json') && uiAdapter.includes('/api/features'));
});

test('paid plans remain disabled without measured unit economics', () => {
  assert.equal(registry.release.checkoutEnabled, false);
  assert.equal(registry.release.proPlanEnabled, false);
  assert.equal(registry.release.ultraPlanEnabled, false);
  assert.equal(registry.release.paidPriceINR, null);
  assert.match(registry.release.pricingBasis, /not measured|not priced/i);
});
