'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { rateWindow } = require('../nova-rate-limit');

test('sliding window retains recent timestamps and expires timestamps at the cutoff', () => {
  const store = new Map();
  const first = rateWindow(store, '203.0.113.1', 10000, 60000);
  first.push(10000);
  assert.deepEqual(rateWindow(store, '203.0.113.1', 20000, 60000), [10000]);
  assert.deepEqual(rateWindow(store, '203.0.113.1', 70000, 60000), []);
});

test('rate window prunes expired IP buckets before reaching its memory cap', () => {
  const store = new Map([
    ['expired', [1]],
    ['active-a', [9950]],
    ['active-b', [9990]],
  ]);
  const hits = rateWindow(store, 'new-ip', 10000, 100, 3);
  assert.deepEqual(hits, []);
  assert.equal(store.size, 3);
  assert.equal(store.has('expired'), false);
  assert.equal(store.has('active-a'), true);
  assert.equal(store.has('active-b'), true);
});

test('rate window evicts the oldest bucket when all capped buckets are active', () => {
  const store = new Map([
    ['oldest', [9900]],
    ['newer', [9950]],
  ]);
  rateWindow(store, 'new-ip', 10000, 1000, 2);
  assert.equal(store.size, 2);
  assert.equal(store.has('oldest'), false);
  assert.equal(store.has('newer'), true);
  assert.equal(store.has('new-ip'), true);
});

test('rate window rejects invalid arguments', () => {
  assert.throws(() => rateWindow(new Map(), '', 1000, 100), TypeError);
  assert.throws(() => rateWindow(new Map(), 'ip', 1000, 0), TypeError);
  assert.throws(() => rateWindow(new Map(), 'ip', 1000, 100, 0), TypeError);
});
