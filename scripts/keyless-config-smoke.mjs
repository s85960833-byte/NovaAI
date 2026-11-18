import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 18000 + (process.pid % 10000);
const base = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['nova-server.txt'], {
  env: {
    ...process.env,
    PORT: String(port),
    LLM_KEY: '',
    LLM_MODEL: '',
    GROQ_API_KEY: '',
    OPENROUTER_API_KEY: ''
  },
  stdio: 'ignore'
});
async function request(path) {
  return fetch(base + path, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
}
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await request('/health');
      if (response.ok) { ready = true; break; }
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  assert.ok(ready, 'no-key Nova server did not start');
  const configResponse = await request('/api/config');
  assert.equal(configResponse.status, 200, 'keyless /api/config must not return 503');
  const config = await configResponse.json();
  assert.equal(config.local, true, 'keyless config must select browser-local inference');
  assert.equal(config.model, 'nova-local-browser');
  assert.equal(config.stt, false, 'do not advertise hosted transcription without a key');
  const engineResponse = await request('/nova-local-ai.js');
  assert.equal(engineResponse.status, 200, 'local inference engine asset must be served');
  const engine = await engineResponse.text();
  assert.ok(engine.includes('Qwen3-0.6B-Instruct-ONNX'));
  assert.ok(engine.includes('NovaLocalAI'));
  const homeResponse = await request('/');
  assert.equal(homeResponse.status, 200);
  assert.ok((await homeResponse.text()).includes('src="/nova-local-ai.js"'));
  console.log('PASS no-key server selects browser-local AI and serves the main chat engine');
} finally {
  child.kill('SIGTERM');
}
