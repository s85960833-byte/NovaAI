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

const health = await request('/health', { timeout: 10000 });
const healthData = await json(health);
if (!health.ok || healthData.status !== 'ok' || healthData.ready !== true) throw new Error('Instant /health endpoint is not ready');
console.log('PASS instant /health');
const home = await request('/');
const homeHtml = await home.text();
if (!home.ok || !homeHtml.includes('<html lang="en">') || !homeHtml.includes('id="msgs"') || !homeHtml.includes('id="dset"') || !homeHtml.includes('id="photo"')) throw new Error('Previous standard NOVA chat UI, Settings, or image panel is missing');
if (!homeHtml.includes("localStorage.getItem('nova')") || !homeHtml.includes("localStorage.setItem('nova',JSON.stringify(S))")) throw new Error('Legacy chat storage contract changed');
if (homeHtml.includes('id="novaSplash"') || homeHtml.includes('id="novaLivingCore"')) throw new Error('New workspace/splash interface unexpectedly returned');
if (!homeHtml.includes('hi:{') || !homeHtml.includes('Install App')) throw new Error('Bilingual standard UI or PWA install action is missing');
console.log('PASS restored standard NOVA chat UI, bilingual labels, Settings, image panel and preserved chat storage');

const tier = await request('/s-tier.js');
if (!tier.ok) throw new Error('Optional S-tier feature bundle is missing');
const suiteResponse = await request('/nova-suite.js');
if (!suiteResponse.ok) throw new Error('NOVA Build feature bundle is missing');
console.log('PASS optional feature bundles remain served');

const registryResponse = await request('/mode-registry.js');
const registryJs = await registryResponse.text();
if (!registryResponse.ok || !registryJs.includes('NovaModeRegistry')) throw new Error('Mode registry asset is missing');
const workspaceResponse = await request('/mode-workspace.js');
const workspaceJs = await workspaceResponse.text();
if (!workspaceResponse.ok || !workspaceJs.includes('NovaModeWorkspace')) throw new Error('Mode workspace asset is missing');
console.log('PASS optional mode registry and workspace assets');

const manifest = await request('/manifest.webmanifest');
if (!manifest.ok) throw new Error('Manifest returned HTTP ' + manifest.status);
const manifestData = await json(manifest);
if (manifestData.short_name !== 'NOVA' || manifestData.display !== 'standalone') throw new Error('NOVA PWA manifest is invalid');
const brandIcon = await request('/icons/nova-emblem.svg');
const brandSvg = await brandIcon.text();
if (!brandIcon.ok || !brandSvg.includes('<svg')) throw new Error('NOVA brand SVG icon is missing');
const icon = await request('/icons/icon-192.png');
if (!icon.ok || !(icon.headers.get('content-type') || '').includes('image/png')) throw new Error('PWA icon check failed');
console.log('PASS PWA manifest and brand icons');

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
  timeout: 25000
});
let generated = await json(imageResponse);
if (!imageResponse.ok) throw new Error('Image job submission failed: HTTP ' + imageResponse.status);
if (!generated.image && !generated.jobId) throw new Error('Image endpoint returned neither an image nor a job ID');
if (generated.jobId) {
  let completed = false;
  for (let attempt = 0; attempt < 285; attempt++) {
    await sleep(2000);
    const statusResponse = await request('/api/image/status/' + encodeURIComponent(generated.jobId), { timeout: 15000 });
    const state = await json(statusResponse);
    if (!statusResponse.ok) throw new Error('Image job failed: HTTP ' + statusResponse.status + ' ' + (state.error || ''));
    if (state.status === 'error') throw new Error('Image job failed: ' + (state.error || 'unknown error'));
    if (state.status === 'done' && state.image) { generated = state; completed = true; break; }
  }
  if (!completed) throw new Error('Free image job did not finish within the production smoke window');
}
if (!String(generated.image || '').startsWith('data:image/') || generated.image.length < 1200) throw new Error('Actual image generation returned an invalid image');
console.log('PASS actual free image generation (' + Math.round(generated.image.length / 1024) + ' KB data URL; ' + (generated.provider || 'provider') + ')');

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
  'ESPN direct': 'TheSportsDB fallback',
  'arXiv': 'OpenAlex fallback'
};
const optionalUnavailable = self.results.filter(x => !x.ok && x.name === 'Yahoo Finance');
const failures = self.results.filter(x => !x.ok && x.name !== 'Yahoo Finance' && (!fallbackPairs[x.name] || !self.results.some(y => y.name === fallbackPairs[x.name] && y.ok)));
if (optionalUnavailable.length) console.warn('WARN optional stock quote source unavailable; Nova must state that it cannot verify current stock prices until the source recovers.');
if (failures.length) throw new Error(failures.length + ' upstream provider self-tests failed; see report above');
console.log('PASS all provider self-tests');
