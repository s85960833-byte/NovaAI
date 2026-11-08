'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('nova-app.js', 'utf8');
const start = source.indexOf('const esc=');
const end = source.indexOf('const SEP=', start);
assert.ok(start >= 0 && end > start, 'Markdown escaping helpers must remain available for regression testing');
const sandbox = {};
vm.runInNewContext(source.slice(start, end) + '\nglobalThis.__inl = inl;', sandbox);
const renderInline = sandbox.__inl;

test('Markdown links preserve normal HTTPS destinations and escape ampersands', () => {
  const html = renderInline('[docs](https://example.com/path?a=1&b=2)');
  assert.match(html, /href="https:\/\/example\.com\/path\?a=1&amp;b=2"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('Markdown link destinations cannot break out of the href attribute', () => {
  const html = renderInline('[x](https://example.com/"onmouseover="alert(1))');
  assert.match(html, /&quot;onmouseover=&quot;/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/"onmouseover=/);
});

test('HTML supplied as Markdown text is escaped', () => {
  const html = renderInline('<img src=x onerror=alert(1)>');
  assert.doesNotMatch(html, /<img\b/i);
  assert.match(html, /&lt;img/);
});
