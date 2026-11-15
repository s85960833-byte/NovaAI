'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve, relative, isAbsolute } = require('node:path');

const root = process.cwd();
const registry = JSON.parse(readFileSync(resolve(root, 'FEATURE_REGISTRY.json'), 'utf8'));
const server = readFileSync(resolve(root, 'nova-server.txt'), 'utf8');
const statuses = new Set(['implemented', 'preview', 'blocked', 'not_implemented']);

function safeRepoPath(file) {
  assert.equal(typeof file, 'string', 'file path must be a string');
  assert.ok(file.length > 0, 'file path must not be empty');
  assert.equal(isAbsolute(file), false, 'absolute paths are not allowed in the feature registry');
  const resolved = resolve(root, file);
  const rel = relative(root, resolved);
  assert.ok(rel && !rel.startsWith('..'), 'paths must stay inside the repository');
  return resolved;
}

test('feature registry schema and release gates are explicit', () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.release.productionReady, false);
  assert.equal(registry.release.marketingClaimsAllowed, false);
  assert.equal(registry.release.checkoutEnabled, false);
  assert.equal(registry.release.proPlanEnabled, false);
  assert.equal(registry.release.ultraPlanEnabled, false);
  assert.equal(registry.release.paidPriceINR, null);
  assert.equal(registry.enforcement.pricingGenerationImplemented, undefined);
  assert.equal(registry.enforcement.wiredToPricingPage, false);
  assert.equal(registry.enforcement.endToEndTruthEnforcement, false);
  assert.ok(Array.isArray(registry.features) && registry.features.length >= 10);
});

test('feature IDs are unique and all listed claims are conservative', () => {
  const ids = new Set();
  for (const feature of registry.features) {
    assert.equal(typeof feature.id, 'string');
    assert.ok(feature.id.length > 0);
    assert.equal(ids.has(feature.id), false, 'duplicate feature ID: ' + feature.id);
    ids.add(feature.id);
    assert.equal(statuses.has(feature.status), true, 'invalid status for ' + feature.id);
    assert.equal(feature.productionReady, false, feature.id + ' must not claim production readiness');
    assert.equal(feature.marketingClaimsAllowed, false, feature.id + ' is not cleared for marketing claims');
    assert.ok(Array.isArray(feature.sourceFiles) && feature.sourceFiles.length > 0);
    assert.ok(Array.isArray(feature.testFiles) && feature.testFiles.length > 0);
    for (const file of [...feature.sourceFiles, ...feature.testFiles]) {
      assert.equal(existsSync(safeRepoPath(file)), true, feature.id + ' references missing file: ' + file);
    }
    if (feature.status === 'not_implemented') {
      assert.equal(feature.productExposure, 'not_offered',
        feature.id + ' is not implemented and must not be presented as an available product feature');
    }
    for (const marker of feature.routeMarkers || []) {
      assert.ok(server.includes(marker), feature.id + ' expected server route marker is missing: ' + marker);
    }
  }
});

test('no paid plan or pricing claim can be enabled without measured unit economics', () => {
  assert.equal(registry.release.checkoutEnabled, false);
  assert.equal(registry.release.proPlanEnabled, false);
  assert.equal(registry.release.ultraPlanEnabled, false);
  assert.equal(registry.release.paidPriceINR, null);
  assert.match(registry.release.pricingBasis, /not measured|not priced/i);
});
