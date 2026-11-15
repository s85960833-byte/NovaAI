'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const secretKeys = [
  'LLM_KEY', 'LLM_MODEL', 'GROQ_API_KEY', 'GROQ_MODEL',
  'OPENROUTER_API_KEY', 'OPENROUTER_MODEL',
  'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_MODEL',
  'NOVA_ALLOW_CLOUDFLARE'
];

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startServer(overrides = {}) {
  const port = await freePort();
  const env = { ...process.env, NODE_ENV: 'test', PORT: String(port),
    NOVA_API_AUTH_REQUIRED: '0', SELFTEST_ON_START: '0', LIVE_SELFTEST_ENABLED: '0' };
  for (const key of secretKeys) delete env[key];
  Object.assign(env, overrides);

  let output = '';
  const child = spawn(process.execPath, ['nova-server.txt'], {
    cwd: root, env, stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  const url = 'http://127.0.0.1:' + port + '/api/config';
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error('NOVA test server exited before ready: ' + output.slice(-1200));
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      return { child, response, output };
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  child.kill('SIGKILL');
  throw new Error('NOVA test server did not become ready: ' + output.slice(-1200));
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 2500))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

test('no configured AI provider returns safe JSON 503', async () => {
  const instance = await startServer();
  try {
    assert.equal(instance.response.status, 503);
    const text = await instance.response.text();
    const body = JSON.parse(text);
    assert.deepEqual(body, { error: 'ai_not_configured' });
    assert.equal(text.includes('test-provider-secret'), false);
  } finally {
    await stopServer(instance.child);
  }
});

test('mock provider configuration returns 200 without exposing the fake key', async () => {
  const fakeKey = 'test-provider-secret-never-real';
  const instance = await startServer({ LLM_KEY: fakeKey, LLM_MODEL: 'mock-model-only' });
  try {
    assert.equal(instance.response.status, 200);
    const text = await instance.response.text();
    const body = JSON.parse(text);
    assert.equal(body.model, 'mock-model-only');
    assert.equal(text.includes(fakeKey), false);
    assert.equal(JSON.stringify(body).includes(fakeKey), false);
  } finally {
    await stopServer(instance.child);
  }
});

test('frontend handles ai_not_configured without throwing or hiding setup', () => {
  const app = fs.readFileSync(path.join(root, 'nova-app.js'), 'utf8');
  assert.match(app, /r\.status===503&&info\.error==='ai_not_configured'/);
  assert.match(app, /You can add your own provider in Settings/);
  assert.match(app, /आप Settings में अपना provider जोड़ सकते हैं/);
  assert.match(app, /\.catch\(\(\)=>\{\}\)/);
});
