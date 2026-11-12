'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('AI Horde fallback requires an operator API key', () => {
  assert.match(source, /if\s*\(!E\.HORDE_API_KEY\)\s*throw new Error\('No free image provider is currently configured'\)/);
});

test('AI Horde generation explicitly disables dataset sharing', () => {
  assert.match(source, /nsfw:\s*false,[\s\S]{0,160}shared:\s*false/);
  assert.doesNotMatch(source, /shared:\s*true/);
});
