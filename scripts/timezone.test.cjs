'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_TIME_ZONE, resolveTimeZone, formatCurrentDateTime } = require('../nova-timezone');

test('valid IANA timezone is preserved', () => {
  assert.equal(resolveTimeZone('Asia/Kolkata'), 'Asia/Kolkata');
  assert.equal(resolveTimeZone('America/New_York'), 'America/New_York');
  assert.equal(resolveTimeZone('UTC'), 'UTC');
});

test('invalid, blank and oversized timezone values safely fall back', () => {
  assert.equal(resolveTimeZone('Not/A_Real_Zone'), DEFAULT_TIME_ZONE);
  assert.equal(resolveTimeZone(''), DEFAULT_TIME_ZONE);
  assert.equal(resolveTimeZone('x'.repeat(100)), DEFAULT_TIME_ZONE);
});

test('current time context includes the selected timezone and UTC timestamp', () => {
  const now = new Date('2026-11-12T12:00:00.000Z');
  const result = formatCurrentDateTime('Asia/Kolkata', now);
  assert.equal(result.timeZone, 'Asia/Kolkata');
  assert.match(result.formatted, /12 November 2026/);
  assert.equal(result.iso, '2026-11-12T12:00:00.000Z');
});

test('bad timezone cannot crash date formatting', () => {
  const result = formatCurrentDateTime('Bad/Zone', new Date('2026-11-12T00:00:00.000Z'));
  assert.equal(result.timeZone, DEFAULT_TIME_ZONE);
  assert.match(result.formatted, /12 November 2026/);
});
