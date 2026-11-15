'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(__dirname, 'release-check.mjs'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github/workflows/novaai-verification.yml'), 'utf8');

test('release:check is registered and the CI contract test is wired', () => {
  assert.equal(packageJson.scripts['release:check'], 'node scripts/release-check.mjs');
  assert.equal(packageJson.scripts['test:release-check-contract'], 'node --test scripts/release-check.test.cjs');
  assert.match(workflow, /Test production release gate contract[\s\S]*?npm run test:release-check-contract/);
});

test('release gate never bypasses human verification and remains fail-closed', () => {
  for (const gate of [
    'Render Staging exact SHA and Health Check Path',
    'Approved provider eligibility, terms, credentials and spend controls',
    'Real authorised Supabase login, email delivery, refresh and redirect tests',
    'Throwaway-project two-user RLS isolation test',
    'Physical Android layout, camera and microphone tests',
    'Independent security and privacy review',
    'Verified backup and restore test',
    'Owner release approval'
  ]) {
    assert.ok(script.includes(gate), 'missing human release gate: ' + gate);
  }
  assert.match(script, /UNVERIFIED/);
  assert.match(script, /const allHumanVerified = false/);
  assert.match(script, /RELEASE: NO-GO/);
  assert.doesNotMatch(script, /novaai-4auo\.onrender\.com|novaai-pr98-staging\.onrender\.com/);
  assert.doesNotMatch(script, /SUPABASE_SERVICE_ROLE_KEY\s*=/);
});

test('release check skips destructive throwaway RLS tests unless run separately by a human', () => {
  assert.match(script, /name !== 'test:rls-isolation'/);
  assert.match(script, /throwaway PostgreSQL migration\/RLS integration/);
  assert.match(script, /never point it at a hosted production database/);
});
