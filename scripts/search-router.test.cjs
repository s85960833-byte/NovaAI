'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { firstSuccessful } = require('../nova-search-router');

test('provider routing is sequential and stops after the first usable result', async () => {
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const make = (name, result) => ({
    name,
    run: async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      calls.push(name + ':start');
      await new Promise(resolve => setImmediate(resolve));
      calls.push(name + ':end');
      active -= 1;
      return result;
    }
  });
  const result = await firstSuccessful([
    make('primary', { items: [{ title: 'one' }] }),
    make('fallback', { items: [{ title: 'two' }] })
  ]);
  assert.equal(result.provider, 'primary');
  assert.deepEqual(calls, ['primary:start', 'primary:end']);
  assert.equal(maxActive, 1);
});

test('provider routing tries the next provider only after the previous one fails', async () => {
  const calls = [];
  const result = await firstSuccessful([
    { name: 'primary', run: async () => { calls.push('primary'); throw new Error('HTTP 429'); } },
    { name: 'fallback', run: async () => { calls.push('fallback'); return { items: [{ title: 'ok' }] }; } },
    { name: 'unused', run: async () => { calls.push('unused'); return { items: [{ title: 'never' }] }; } }
  ]);
  assert.equal(result.provider, 'fallback');
  assert.deepEqual(calls, ['primary', 'fallback']);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].error, 'HTTP 429');
});

test('empty provider results are treated as failures and all failures are reported', async () => {
  const result = await firstSuccessful([
    { name: 'empty', run: async () => ({ items: [] }) },
    { name: 'down', run: async () => { throw new Error('timeout'); } }
  ]);
  assert.equal(result.value, null);
  assert.equal(result.provider, null);
  assert.equal(result.failures.length, 2);
  assert.match(result.failures[0].error, /no usable results/);
  assert.equal(result.failures[1].error, 'timeout');
});

test('an empty provider list makes no calls', async () => {
  assert.deepEqual(await firstSuccessful([]), { value: null, provider: null, failures: [] });
});
