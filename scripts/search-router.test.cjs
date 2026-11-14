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

const fs = require('node:fs');
const path = require('node:path');
const serverSource = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');
const webSearchStart = serverSource.indexOf('async function webSearch(');
const webSearchEnd = serverSource.indexOf('\nasync function onThisDay(', webSearchStart);
const webSearchSource = serverSource.slice(webSearchStart, webSearchEnd);

test('production web search uses sequential routing and no HTML search scraper', () => {
  assert.ok(serverSource.includes("require('./nova-search-router')"));
  assert.match(webSearchSource, /firstSuccessful\(primary\)/);
  assert.match(webSearchSource, /firstSuccessful\(\[/);
  assert.doesNotMatch(webSearchSource, /Promise\.any|ddg\(/);
  assert.match(webSearchSource, /TAVILY_SHARED_CACHE_ALLOWED === '1'/);
});

test('unlicensed search-result feeds are fetched transiently, not persisted in the shared cache', () => {
  const feedStart = serverSource.indexOf('async function fetchFeed(');
  const feedEnd = serverSource.indexOf('\nasync function feedCat(', feedStart);
  const gnewsStart = serverSource.indexOf('async function gnews(');
  const gnewsEnd = serverSource.indexOf('\nconst gdDate', gnewsStart);
  const gdeltStart = serverSource.indexOf('async function gdelt(');
  const gdeltEnd = serverSource.indexOf('\n// ---- general web search', gdeltStart);
  for (const [name, source] of [
    ['RSS', serverSource.slice(feedStart, feedEnd)],
    ['Google News', serverSource.slice(gnewsStart, gnewsEnd)],
    ['GDELT', serverSource.slice(gdeltStart, gdeltEnd)]
  ]) {
    assert.ok(source.length > 0, name + ' source must be found');
    assert.doesNotMatch(source, /\bcached\s*\(/, name + ' must not persist provider results');
  }
  assert.match(serverSource, /TAVILY_SHARED_CACHE_ALLOWED === '1'/);
  assert.match(serverSource, /app\.post\('\/api\/search',[\s\S]*?Cache-Control', 'no-store'/);
  assert.match(serverSource, /app\.post\('\/api\/live',[\s\S]*?Cache-Control', 'no-store'/);
});
