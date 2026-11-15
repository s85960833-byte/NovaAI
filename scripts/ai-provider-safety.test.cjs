'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const root = path.join(__dirname, '..');
const preload = path.join(__dirname, 'mock-provider-fetch.cjs');

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startServer(extra = {}) {
  const port = await reservePort();
  const marker = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-mock-')), 'fetch.log');
  const env = { ...process.env, NODE_ENV: 'test', PORT: String(port),
    NOVA_API_AUTH_REQUIRED: '0', SELFTEST_ON_START: '0', LIVE_SELFTEST_ENABLED: '0',
    NODE_OPTIONS: [process.env.NODE_OPTIONS || '', '--require=' + preload].filter(Boolean).join(' '),
    NOVA_MOCK_FETCH_LOG: marker };
  for (const name of [
    'AI_DISABLED', 'NOVA_USAGE_QUOTA_REQUIRED',
    'LLM_KEY', 'LLM_MODEL', 'LLM_BASE', 'LLM_FALLBACK_MODELS',
    'GROQ_API_KEY', 'GROQ_MODEL', 'GROQ_BASE',
    'OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'OPENROUTER_BASE',
    'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_MODEL', 'NOVA_ALLOW_CLOUDFLARE',
    'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'NOVA_FREE_MONTHLY_CREDITS', 'NOVA_PRO_MONTHLY_CREDITS', 'NOVA_ULTRA_MONTHLY_CREDITS'
  ]) delete env[name];
  Object.assign(env, extra);
  const child = spawn(process.execPath, ['nova-server.txt'], { cwd: root, env, stdio: ['ignore', 'ignore', 'ignore'] });
  const url = 'http://127.0.0.1:' + port;
  for (let n = 0; n < 60; n += 1) {
    if (child.exitCode !== null) throw new Error('test server exited before becoming ready');
    try {
      const response = await fetch(url + '/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok) return { child, url, marker };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill('SIGKILL');
  throw new Error('test server readiness timeout');
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  const done = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  await Promise.race([done, new Promise(resolve => setTimeout(resolve, 2000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

test('AI_DISABLED returns 503 and no provider request is made', async () => {
  const app = await startServer({
    AI_DISABLED: '1', LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model',
    LLM_BASE: 'https://mock.provider.invalid/v1'
  });
  try {
    const config = await fetch(app.url + '/api/config');
    assert.equal(config.status, 503);
    assert.deepEqual(await config.json(), { error: 'ai_disabled' });

    const chat = await fetch(app.url + '/api/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] })
    });
    assert.equal(chat.status, 503);
    assert.deepEqual(await chat.json(), { error: 'ai_disabled' });
    assert.equal(fs.existsSync(app.marker), false);
  } finally {
    await stopServer(app.child);
  }
});

test('all provider failures return a safe JSON error without upstream body or stack', async () => {
  const app = await startServer({
    LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model',
    LLM_BASE: 'https://mock.provider.invalid/v1',
    GROQ_API_KEY: 'fake-groq-key', GROQ_MODEL: 'fake-groq-model',
    GROQ_BASE: 'https://mock.groq.invalid/v1',
    NOVA_USAGE_QUOTA_REQUIRED: '0', LLM_MAX_ATTEMPTS: '1',
    LLM_RETRY_BASE_DELAY_MS: '0'
  });
  try {
    const response = await fetch(app.url + '/api/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }], stream: false })
    });
    assert.equal(response.status, 500);
    const text = await response.text();
    const body = JSON.parse(text);
    assert.equal(body.error, 'AI service is temporarily unavailable. Please retry shortly.');
    assert.equal(text.includes('PRIVATE_PROVIDER_BODY_SENTINEL'), false);
    assert.equal(text.toLowerCase().includes('stack'), false);
    assert.deepEqual(fs.readFileSync(app.marker, 'utf8').trim().split('\n'), [
      'mock.provider.invalid',
      'mock.groq.invalid'
    ]);
  } finally {
    await stopServer(app.child);
  }
});


test('Quick, Standard and Detailed modes change the actual upstream prompt and output cap', async () => {
  const capture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-mode-')), 'requests.jsonl');
  const app = await startServer({
    LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model',
    LLM_BASE: 'https://mock.provider.invalid/v1',
    NOVA_USAGE_QUOTA_REQUIRED: '0',
    NOVA_MOCK_FETCH_MODE: 'capture',
    NOVA_MOCK_FETCH_CAPTURE: capture,
    LLM_MAX_ATTEMPTS: '1'
  });
  try {
    for (const mode of ['quick', 'standard', 'detailed']) {
      const response = await fetch(app.url + '/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_mode: mode,
          stream: true,
          messages: [{ role: 'user', content: 'Explain a simple topic.' }]
        })
      });
      assert.equal(response.status, 200);
      await response.text();
    }
    const requests = fs.readFileSync(capture, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.equal(requests.length, 3);
    const expected = [
      { mode: 'QUICK', tokens: 220 },
      { mode: 'STANDARD', tokens: 1024 },
      { mode: 'DETAILED', tokens: 2048 }
    ];
    for (let i = 0; i < expected.length; i += 1) {
      const payload = requests[i].payload;
      assert.equal(payload.max_tokens, expected[i].tokens);
      assert.match(payload.messages[0].content, new RegExp('ANSWER MODE — ' + expected[i].mode));
      assert.equal(Object.hasOwn(payload, 'answer_mode'), false);
    }
  } finally {
    await stopServer(app.child);
  }
});

test('server enforces the configured maximum output-token cap for Detailed mode', async () => {
  const capture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-cap-')), 'requests.jsonl');
  const app = await startServer({
    LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model',
    LLM_BASE: 'https://mock.provider.invalid/v1',
    NOVA_USAGE_QUOTA_REQUIRED: '0',
    NOVA_MOCK_FETCH_MODE: 'capture',
    NOVA_MOCK_FETCH_CAPTURE: capture,
    LLM_MAX_OUTPUT_TOKENS: '300',
    LLM_MAX_ATTEMPTS: '1'
  });
  try {
    const response = await fetch(app.url + '/api/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer_mode: 'detailed',
        max_tokens: 4096,
        stream: true,
        messages: [{ role: 'user', content: 'Explain a simple topic.' }]
      })
    });
    assert.equal(response.status, 200);
    await response.text();
    const payload = JSON.parse(fs.readFileSync(capture, 'utf8').trim()).payload;
    assert.equal(payload.max_tokens, 300);
  } finally {
    await stopServer(app.child);
  }
});


test('authenticated chat settles durable quota with streamed provider output-token usage', async () => {
  const capture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-usage-stream-')), 'provider.jsonl');
  const usageCapture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-usage-ledger-')), 'ledger.jsonl');
  const app = await startServer({
    LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model', LLM_BASE: 'https://mock.provider.invalid/v1',
    NOVA_API_AUTH_REQUIRED: '1', SUPABASE_URL: 'https://mock-project.supabase.invalid',
    SUPABASE_PUBLISHABLE_KEY: 'fake-publishable-key', SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    NOVA_USAGE_QUOTA_REQUIRED: '1', NOVA_FREE_MONTHLY_CREDITS: '50',
    NOVA_MOCK_FETCH_MODE: 'capture', NOVA_MOCK_FETCH_CAPTURE: capture,
    NOVA_MOCK_USAGE_CAPTURE: usageCapture, LLM_MAX_ATTEMPTS: '1'
  });
  try {
    const response = await fetch(app.url + '/api/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-mock-user-token' },
      body: JSON.stringify({ answer_mode: 'quick', stream: true, messages: [{ role: 'user', content: 'Say hello.' }] })
    });
    const responseText = await response.text();
    assert.equal(response.status, 200, responseText + '\nmock-ledger=' + (fs.existsSync(usageCapture) ? fs.readFileSync(usageCapture, 'utf8') : 'no-ledger-requests'));
    assert.match(responseText, /mock-response/);
    const providerRequests = fs.readFileSync(capture, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.equal(providerRequests[0].payload.stream_options.include_usage, true);
    const ledger = fs.readFileSync(usageCapture, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    const reserve = ledger.find(call => call.path.endsWith('/nova_reserve_usage'));
    const settle = ledger.find(call => call.path.endsWith('/nova_settle_usage'));
    assert.ok(reserve && settle);
    assert.equal(settle.payload.p_reservation_id, reserve.payload.p_reservation_id);
    assert.equal(settle.payload.p_input_tokens, 12);
    assert.equal(settle.payload.p_output_tokens, 7);
    assert.equal(settle.payload.p_status, 'completed');
  } finally { await stopServer(app.child); }
});

test('provider rejecting optional stream usage retries and records usage as unknown', async () => {
  const capture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-usage-fallback-')), 'provider.jsonl');
  const usageCapture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nova-usage-fallback-ledger-')), 'ledger.jsonl');
  const app = await startServer({
    LLM_KEY: 'fake-key', LLM_MODEL: 'fake-model', LLM_BASE: 'https://mock.provider.invalid/v1',
    NOVA_API_AUTH_REQUIRED: '1', SUPABASE_URL: 'https://mock-project.supabase.invalid',
    SUPABASE_PUBLISHABLE_KEY: 'fake-publishable-key', SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
    NOVA_USAGE_QUOTA_REQUIRED: '1', NOVA_FREE_MONTHLY_CREDITS: '50',
    NOVA_MOCK_FETCH_MODE: 'capture', NOVA_MOCK_REJECT_STREAM_OPTIONS: '1',
    NOVA_MOCK_FETCH_CAPTURE: capture, NOVA_MOCK_USAGE_CAPTURE: usageCapture,
    LLM_MAX_ATTEMPTS: '2', LLM_RETRY_BASE_DELAY_MS: '0'
  });
  try {
    const response = await fetch(app.url + '/api/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-mock-user-token' },
      body: JSON.stringify({ answer_mode: 'quick', stream: true, messages: [{ role: 'user', content: 'Say hello.' }] })
    });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /mock-response/);
    const providerRequests = fs.readFileSync(capture, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.equal(providerRequests.length, 2);
    assert.equal(providerRequests[0].payload.stream_options.include_usage, true);
    assert.equal(Object.hasOwn(providerRequests[1].payload, 'stream_options'), false);
    const ledger = fs.readFileSync(usageCapture, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    const settle = ledger.find(call => call.path.endsWith('/nova_settle_usage'));
    assert.ok(settle);
    assert.equal(settle.payload.p_input_tokens, null);
    assert.equal(settle.payload.p_output_tokens, null);
    assert.equal(settle.payload.p_status, 'completed');
  } finally { await stopServer(app.child); }
});
