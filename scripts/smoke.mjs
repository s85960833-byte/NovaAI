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
const manifestData = await json(manifest);
if (manifestData.lang !== 'en' || manifestData.display !== 'standalone') throw new Error('PWA manifest is not configured for the English installable app');
console.log('PASS /manifest.webmanifest (English PWA)');

const home = await request('/');
const homeHtml = await home.text();
if (!home.ok || !homeHtml.includes('<html lang="en">') || !homeHtml.includes('Install App') || !homeHtml.includes("const L=['English'];")) throw new Error('English-only homepage or install action is missing');
if (Array.from(homeHtml).some(ch => ch.codePointAt(0) >= 0x0900 && ch.codePointAt(0) <= 0x097F)) throw new Error('Non-English text remains in the shipped homepage');
console.log('PASS English homepage and PWA install action');

for (const [path, marker] of [['/mode-registry.js', 'NovaModeRegistry'], ['/mode-workspace.js', 'nova_modes_v1']]) {
  const response = await request(path);
  const source = await response.text();
  if (!response.ok || !source.includes(marker)) throw new Error(path + ' returned an invalid mode asset');
  console.log('PASS ' + path);
}

const icon = await request('/icons/icon-192.png');
if (!icon.ok || !(icon.headers.get('content-type') || '').includes('image/png')) throw new Error('PWA icon check failed');
console.log('PASS /icons/icon-192.png');

const feedResponse = await request('/api/feed?cat=all&lang=en');
const feed = await json(feedResponse);
if (!feedResponse.ok || !feed.cats || !Object.keys(feed.cats).length) throw new Error('News feed endpoint returned no categories');
console.log('PASS /api/feed');

const selfResponse = await request('/api/live/selftest', { signal: AbortSignal.timeout(90000) });
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

const internetResponse = await request('/api/search', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ q: 'Latest NASA news' }), timeout: 20000
});
const internet = await json(internetResponse);
if (!internetResponse.ok || !internet.provider || !Array.isArray(internet.results) || !internet.results.length) {
  throw new Error('Live internet search endpoint failed: HTTP ' + internetResponse.status);
}
console.log('PASS /api/search (' + internet.provider + ', ' + internet.results.length + ' sources)');


const imageValidation = await request('/api/image', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
});
if (imageValidation.status !== 400) throw new Error('/api/image invalid-input guard expected 400, got ' + imageValidation.status);
console.log('PASS /api/image validation');

const imageResponse = await request('/api/image', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ prompt: 'A simple blue geometric flower on a clean white background', width: 512, height: 512, seed: 42 }),
  timeout: 180000
});
const generated = await json(imageResponse);
if (!imageResponse.ok || !String(generated.image || '').startsWith('data:image/') || generated.image.length < 1200) throw new Error('Actual image generation failed: HTTP ' + imageResponse.status);
console.log('PASS actual free image generation (' + Math.round(generated.image.length / 1024) + ' KB data URL)');

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

const fallbackPairs = {
  'GDELT direct': 'GDELT fallback path',
  'Open-Meteo forecast direct': 'Weather (Open-Meteo / fallback)',
  'CoinGecko direct': 'Coinbase fallback',
  'OpenAlex direct': 'OpenAlex fallback',
  'Brave LLM Context': 'Web search',
  'ESPN direct': 'TheSportsDB fallback'
};
const failures = self.results.filter(x => !x.ok && (!fallbackPairs[x.name] || !self.results.some(y => y.name === fallbackPairs[x.name] && y.ok)));
if (failures.length) throw new Error(failures.length + ' upstream provider self-tests failed; see report above');
console.log('PASS all provider self-tests');
