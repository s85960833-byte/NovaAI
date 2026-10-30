const BASE = process.env.NOVAAI_URL || 'https://novaai-4auo.onrender.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 25000);
  try { return await fetch(BASE + path, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
async function json(response) { return response.json().catch(() => ({})); }

let config;
for (let i = 0; i < 18; i++) {
  try {
    const r = await request('/api/config', { timeout: 12000 });
    if (r.ok) { config = await json(r); break; }
  } catch {}
  await sleep(10000);
}
if (!config?.model) throw new Error('Live API config did not become healthy within 3 minutes');
console.log('PASS /api/config');

const manifest = await request('/manifest.webmanifest');
if (!manifest.ok) throw new Error('Manifest returned HTTP ' + manifest.status);
console.log('PASS /manifest.webmanifest');

const icon = await request('/icons/icon-192.png');
if (!icon.ok || !(icon.headers.get('content-type') || '').includes('image/png')) throw new Error('PWA icon check failed');
console.log('PASS /icons/icon-192.png');

const feedResponse = await request('/api/feed?cat=all&lang=en');
const feed = await json(feedResponse);
if (!feedResponse.ok || !feed.cats || !Object.keys(feed.cats).length) throw new Error('News feed endpoint returned no categories');
console.log('PASS /api/feed');

const selfResponse = await request('/api/live/selftest', { timeout: 90000 });
const self = await json(selfResponse);
if (!selfResponse.ok || !Array.isArray(self.results)) throw new Error('Provider self-test endpoint failed');
const lines = self.results.map(x => (x.ok ? 'PASS ' : 'FAIL ') + x.name + ' — ' + x.ms + 'ms' + (x.note ? ' (' + x.note + ')' : ''));
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) {
  const fs = await import('node:fs/promises');
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, '## NovaAI provider self-test\n\n' + lines.map(x => '- ' + x).join('\n') + '\n');
}

const liveResponse = await request('/api/live', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ q: 'Latest NASA news', mode: 'always', lang: 'en', tz: 'Asia/Kolkata' }),
  timeout: 60000
});
const live = await json(liveResponse);
if (!liveResponse.ok || !live.ok || !live.context) throw new Error('Live search integration test failed: HTTP ' + liveResponse.status);
console.log('PASS /api/live');

const imageValidation = await request('/api/image', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
});
if (imageValidation.status !== 400) throw new Error('/api/image invalid-input guard expected 400, got ' + imageValidation.status);
console.log('PASS /api/image validation');

const transcribeValidation = await request('/api/transcribe', {
  method: 'POST', headers: { 'content-type': 'audio/webm' }, body: new Uint8Array()
});
if (transcribeValidation.status !== 400) throw new Error('/api/transcribe invalid-input guard expected 400, got ' + transcribeValidation.status);
console.log('PASS /api/transcribe validation');

const chatResponse = await request('/api/chat/completions', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ model: config.model, stream: false, max_tokens: 20, messages: [{ role: 'user', content: 'Reply with exactly NOVAAI_OK.' }] }),
  timeout: 60000
});
if (!chatResponse.ok) throw new Error('/api/chat/completions returned HTTP ' + chatResponse.status);
const chat = await json(chatResponse);
if (!chat.choices?.[0]?.message?.content) throw new Error('Chat endpoint returned no assistant message');
console.log('PASS /api/chat/completions');

const failures = self.results.filter(x => !x.ok);
if (failures.length) throw new Error(failures.length + ' upstream provider self-tests failed; see report above');
console.log('PASS all provider self-tests');
