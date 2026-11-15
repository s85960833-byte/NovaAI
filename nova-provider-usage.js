'use strict';
const MAX_USAGE_BYTES = 2 * 1024 * 1024;
const MAX_SSE_LINE_CHARS = 64 * 1024;
function tokenCount(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= 2147483647 ? number : null;
}
function createProviderUsageObserver(contentType = '') {
  const isEventStream = /text\/event-stream/i.test(String(contentType));
  const decoder = new TextDecoder();
  let pending = '', collectedBytes = 0, completionTokens = null, disabled = false;
  function inspectJson(text) {
    try {
      const usage = JSON.parse(text)?.usage;
      const count = usage && tokenCount(usage.completion_tokens ?? usage.output_tokens);
      if (count !== null && count !== undefined) completionTokens = count;
    } catch {}
  }
  function inspectLine(line) {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (data && data !== '[DONE]') inspectJson(data);
  }
  function push(chunk) {
    if (disabled || chunk == null) return;
    collectedBytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.byteLength;
    if (collectedBytes > MAX_USAGE_BYTES) { disabled = true; pending = ''; return; }
    pending += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    if (!isEventStream) return;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || '';
    for (const line of lines) inspectLine(line);
    if (pending.length > MAX_SSE_LINE_CHARS) { disabled = true; pending = ''; }
  }
  function finish() {
    if (disabled) return null;
    try { pending += decoder.decode(); } catch {}
    if (isEventStream) inspectLine(pending);
    else if (pending.length <= MAX_USAGE_BYTES) inspectJson(pending);
    return completionTokens;
  }
  return Object.freeze({ push, finish });
}
module.exports = { createProviderUsageObserver, MAX_USAGE_BYTES };
