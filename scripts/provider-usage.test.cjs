'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createProviderUsageObserver } = require('../nova-provider-usage');

test('parses input and output usage across split SSE chunks', () => {
  const observer = createProviderUsageObserver('text/event-stream');
  for (const part of [
    'data: {"choices":[],"usage":{"prompt_tokens":',
    '12,"completion_tokens":',
    '37,"total_tokens":49}}\n\ndata: [DONE]\n\n'
  ]) observer.push(Buffer.from(part));
  assert.deepEqual(observer.finish(), { inputTokens: 12, outputTokens: 37 });
});

test('parses known output tokens when provider omits input usage', () => {
  const observer = createProviderUsageObserver('application/json');
  observer.push(Buffer.from('{"usage":{"completion_tokens":19}}'));
  assert.deepEqual(observer.finish(), { inputTokens: null, outputTokens: 19 });
});

test('returns unknown for absent usage', () => {
  const observer = createProviderUsageObserver('text/event-stream');
  observer.push(Buffer.from('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: [DONE]\n\n'));
  assert.deepEqual(observer.finish(), { inputTokens: null, outputTokens: null });
});

test('keeps usage observation memory bounded', () => {
  const observer = createProviderUsageObserver('application/json');
  observer.push(Buffer.alloc(2 * 1024 * 1024 + 1, 0x61));
  assert.deepEqual(observer.finish(), { inputTokens: null, outputTokens: null });
});
