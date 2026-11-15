'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createProviderUsageObserver } = require('../nova-provider-usage');
test('parses completion tokens when SSE JSON is split across chunks', () => {
  const observer = createProviderUsageObserver('text/event-stream');
  for (const part of ['data: {"choices":[],"usage":{"prompt_tokens":','12,"completion_tokens":','37,"total_tokens":49}}\n\ndata: [DONE]\n\n']) observer.push(Buffer.from(part));
  assert.equal(observer.finish(), 37);
});
test('parses usage from non-stream JSON', () => {
  const observer = createProviderUsageObserver('application/json');
  observer.push(Buffer.from('{"usage":{"completion_tokens":19}}'));
  assert.equal(observer.finish(), 19);
});
test('returns null when usage is absent', () => {
  const observer = createProviderUsageObserver('text/event-stream');
  observer.push(Buffer.from('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: [DONE]\n\n'));
  assert.equal(observer.finish(), null);
});
test('keeps usage observation memory bounded', () => {
  const observer = createProviderUsageObserver('application/json');
  observer.push(Buffer.alloc(2 * 1024 * 1024 + 1, 0x61));
  assert.equal(observer.finish(), null);
});
