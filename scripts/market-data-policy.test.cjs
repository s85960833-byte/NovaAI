'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const server = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('unofficial Yahoo Finance chart endpoints are not called by the server', () => {
  assert.doesNotMatch(server, /query[12]\.finance\.yahoo\.com/i);
  assert.doesNotMatch(server, /yahooQuote\s*\(/i);
});

test('equity symbols fail closed with an explicit no-live-price message', () => {
  assert.match(server, /Equity market quotes are unavailable: no documented, commercially licensed provider is configured/);
  assert.match(server, /Do not guess or infer a live price/);
});

test('the built-in provider self-test does not report the unlicensed equity source as healthy', () => {
  assert.doesNotMatch(server, /\['Yahoo Finance',\s*\(\)\s*=>/);
});
