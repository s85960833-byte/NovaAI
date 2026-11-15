'use strict';

const fs = require('node:fs');
const originalFetch = global.fetch;

global.fetch = async function mockedProviderFetch(input, init = {}) {
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input && input.url;
  let url;
  try { url = new URL(String(rawUrl || '')); } catch { return originalFetch(input, init); }
  if (url.hostname === 'mock-project.supabase.invalid') {
    if (url.pathname === '/auth/v1/user') return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'mock-user@example.invalid' }), { status: 200 });
    if (url.pathname === '/rest/v1/nova_user_entitlements') return new Response('[]', { status: 200 });
    if (url.pathname === '/rest/v1/rpc/nova_reserve_usage' || url.pathname === '/rest/v1/rpc/nova_settle_usage') {
      if (process.env.NOVA_MOCK_USAGE_CAPTURE) {
        let payload = null;
        try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch {}
        fs.appendFileSync(process.env.NOVA_MOCK_USAGE_CAPTURE, JSON.stringify({ path: url.pathname, method: init.method || 'GET', payload }) + '\n');
      }
      return new Response('true', { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'mock_route_not_found' }), { status: 404 });
  }
  if (url.hostname.startsWith('mock.') && url.hostname.endsWith('.invalid')) {
    if (process.env.NOVA_MOCK_FETCH_LOG) fs.appendFileSync(process.env.NOVA_MOCK_FETCH_LOG, url.hostname + '\n');
    let payload = null;
    try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch {}
    if (process.env.NOVA_MOCK_FETCH_CAPTURE) {
      fs.appendFileSync(process.env.NOVA_MOCK_FETCH_CAPTURE, JSON.stringify({
        host: url.hostname,
        payload
      }) + '\n');
    }
    if (process.env.NOVA_MOCK_REJECT_STREAM_OPTIONS === '1' && payload?.stream_options?.include_usage) {
      return new Response('unsupported stream_options', { status: 400, headers: { 'content-type': 'text/plain' } });
    }
    if (process.env.NOVA_MOCK_FETCH_MODE === 'capture') {
      const usageEvent = payload?.stream_options?.include_usage
        ? 'data: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":7,"total_tokens":19}}\\n\\n'
        : '';
      return new Response(
        'data: {"choices":[{"delta":{"content":"mock-response"}}]}\\n\\n' + usageEvent + 'data: [DONE]\\n\\n',
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
