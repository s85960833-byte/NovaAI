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
    NOVA_MOCK_FETCH_LOG: marker, ...extra };
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
    LLM_BASE: 'https://mock.provider.invalid/v1', NOVA_USAGE_QUOTA_REQUIRED: '0', LLM_MAX_ATTEMPTS: '1',
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
    assert.equal(fs.readFileSync(app.marker, 'utf8').trim(), 'called');
  } finally {
    await stopServer(app.child);
  }
});
