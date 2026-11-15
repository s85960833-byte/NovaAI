'use strict';

const fs = require('node:fs');
const originalFetch = global.fetch;

global.fetch = async function mockedProviderFetch(input, init = {}) {
  const rawUrl = typeof input === 'string' ? input : input && input.url;
  let url;
  try { url = new URL(String(rawUrl || '')); } catch { return originalFetch(input, init); }
  if (url.hostname.startsWith('mock.') && url.hostname.endsWith('.invalid')) {
    if (process.env.NOVA_MOCK_FETCH_LOG) fs.appendFileSync(process.env.NOVA_MOCK_FETCH_LOG, url.hostname + '\n');
    if (process.env.NOVA_MOCK_FETCH_CAPTURE) {
      let payload = null;
      try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch {}
      fs.appendFileSync(process.env.NOVA_MOCK_FETCH_CAPTURE, JSON.stringify({
        host: url.hostname,
        payload
      }) + '\n');
    }
    if (process.env.NOVA_MOCK_FETCH_MODE === 'capture') {
      return new Response(
        'data: {"choices":[{"delta":{"content":"mock-response"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } }
      );
    }
    if (process.env.NOVA_MOCK_FETCH_MODE === 'timeout') {
      await new Promise((resolve, reject) => {
        const signal = init.signal;
        const onAbort = () => reject(signal.reason || new Error('mock provider timed out'));
        if (signal && signal.aborted) return onAbort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
      });
    }
    return new Response('PRIVATE_PROVIDER_BODY_SENTINEL', {
      status: 500,
      headers: { 'content-type': 'text/plain' }
    });
  }
  return originalFetch(input, init);
};
