'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'nova-server.txt'), 'utf8');
const example = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const documented = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match => match[1]));
const referenced = new Set([...server.matchAll(/\bE\.([A-Z][A-Z0-9_]*)/g)].map(match => match[1]));

test('every NOVA server environment variable is documented in .env.example', () => {
  const missing = [...referenced].filter(name => !documented.has(name)).sort();
  assert.deepEqual(missing, []);
});
