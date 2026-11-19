import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 18000 + (process.pid % 10000);
const base = 'http://127.0.0.1:' + port;
const child = spawn(process.execPath, ['nova-server.txt'], {
  env: {
    ...process.env,
    PORT: String(port),
    // Deliberately provide fake provider credentials: keyless mode must ignore all of them.
    LLM_KEY: 'disabled-test-key',
    LLM_MODEL: 'disabled-test-model',
    GROQ_API_KEY: 'disabled-test-groq-key',
    OPENROUTER_API_KEY: 'disabled-test-openrouter-key',
    TAVILY_KEY: 'disabled-test-tavily-key',
    BRAVE_KEY: 'disabled-test-brave-key',
    IMAGE_KEY: 'disabled-test-image-key',
    POLLI_KEY: 'disabled-test-pollinations-key',
    HORDE_API_KEY: 'disabled-test-horde-key',
    IMAGE_OFF: ''
  },
  stdio: 'ignore'
});
async function request(path, init = {}) {
  return fetch(base + path, { ...init, signal: AbortSignal.timeout(2500), cache: 'no-store' });
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
  assert.equal(config.stt, true, 'keyless mode includes local browser Whisper transcription');
  assert.equal(config.providers.hostedAi, false, 'hosted AI providers must be disabled even when fake keys are present');
  assert.equal(config.providers.keyless, true);
  assert.equal(config.image, false, 'image generation must stay disabled until a local model exists');
  assert.equal(config.imageMode, 'disabled-until-local-engine');
  const image = await request('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'a safe flower' }) });
  assert.equal(image.status, 503, 'no API-key-backed image provider may be called in strict keyless mode');
  assert.match((await image.json()).error, /strict keyless mode/i);
  const hostedChat = await request('/api/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'must not reach a provider' }] })
  });
  assert.equal(hostedChat.status, 410, 'hosted chat endpoint must reject requests in keyless-only mode');
  const hostedVoice = await request('/api/transcribe', {
    method: 'POST', headers: { 'Content-Type': 'audio/webm' }, body: Buffer.from('audio')
  });
  assert.equal(hostedVoice.status, 410, 'hosted transcription endpoint must reject requests in keyless-only mode');
  const engineResponse = await request('/nova-local-ai.js');
  assert.equal(engineResponse.status, 200, 'local inference engine asset must be served');
  const engine = await engineResponse.text();
  assert.ok(engine.includes('Qwen3-0.6B-Instruct-ONNX'));
  assert.ok(engine.includes('onnx-community/whisper-base'));
  assert.ok(engine.includes('NovaLocalAI'));
  const homeResponse = await request('/');
  assert.equal(homeResponse.status, 200);
  assert.ok((await homeResponse.text()).includes('src="/nova-local-ai.js"'));
  const swResponse = await request('/sw.js');
  assert.equal(swResponse.status, 200, 'service worker must be served');
  const sw = await swResponse.text();
  assert.ok(sw.includes("'/nova-local-ai.js'"), 'offline shell must precache the local AI entry point');
  assert.ok(sw.includes("u.origin==='https://cdn.jsdelivr.net'"), 'service worker must cache the pinned Transformers.js runtime');
  assert.ok(sw.includes("r.type==='cors'"), 'cross-origin runtime responses must be cacheable');
  console.log('PASS keyless-only server ignores AI provider keys, disables hosted chat/transcription/image APIs, and serves local AI assets');
} finally {
  child.kill('SIGTERM');
}
