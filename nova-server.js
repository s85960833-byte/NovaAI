// Nova AI backend. Hosts index.html and gives it a server:
// AI chat proxy (key stays on the server), web search, image generation.
// Setup: keep nova-server.js, package.json and index.html together in the same folder, then
//   npm install        (uses package.json)
//   LLM_KEY=... LLM_MODEL=... node nova-server.js
// Env: LLM_KEY, LLM_MODEL (required) | LLM_BASE (default OpenRouter, any OpenAI-compatible URL)
//      TAVILY_KEY (enables web search) | IMAGE_KEY, IMAGE_MODEL, IMAGE_BASE (enables images)
// Free-tier hosts such as Render or Railway can run this. Check each provider's current limits.
const express = require('express');
const path = require('path');
const E = process.env;
const BASE = E.LLM_BASE || 'https://openrouter.ai/api/v1';
const app = express();
app.use(express.json({ limit: '6mb' }));

// Simple per-IP limit: 30 requests/minute
const hits = new Map();
app.use('/api', (q, r, next) => {
  const now = Date.now(), a = (hits.get(q.ip) || []).filter(t => now - t < 6e4);
  if (a.length >= 30) return r.status(429).json({ error: 'Too many requests' });
  a.push(now); hits.set(q.ip, a); next();
});

app.get('/api/config', (q, r) => {
  if (!E.LLM_KEY || !E.LLM_MODEL) return r.status(503).end();
  r.json({ model: E.LLM_MODEL, web: !!E.TAVILY_KEY, image: !!(E.IMAGE_KEY && E.IMAGE_MODEL) });
});

// Keep requests small (free tiers limit tokens per minute): last N messages, long old answers shortened.
const MAXMSG = Number(E.LLM_MAX_HISTORY) || 10;
function slim(body) {
  const m = Array.isArray(body.messages) ? body.messages : [];
  const sys = m.filter(x => x.role === 'system').slice(0, 1);
  const rest = m.filter(x => x.role !== 'system').slice(-MAXMSG).map((x, i, a) =>
    (x.role === 'assistant' && typeof x.content === 'string' && x.content.length > 1500 && i < a.length - 1)
      ? { ...x, content: x.content.slice(0, 1500) + ' ...' } : x);
  while (rest.length && rest[0].role === 'tool') rest.shift();
  return { ...body, messages: [...sys, ...rest] };
}
// LLM_MODEL is tried first; if it is rate limited or down, models in LLM_FALLBACK_MODELS (comma separated) are tried next.
const RETRY = [413, 429, 500, 502, 503, 504];
app.post('/api/chat/completions', async (q, r) => {
  try {
    const body = slim(q.body || {});
    const models = [E.LLM_MODEL, ...String(E.LLM_FALLBACK_MODELS || '').split(',').map(x => x.trim()).filter(Boolean)];
    let good = null, first = null;
    for (const model of models) {
      const u = await fetch(BASE.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + E.LLM_KEY },
        body: JSON.stringify({ ...body, model, stream: body.stream !== false })
      });
      if (u.ok) { good = u; break; }
      const text = await u.text();
      if (!first) first = { status: u.status, type: u.headers.get('content-type'), text };
      if (model === models[0] && !RETRY.includes(u.status)) break;
    }
    if (!good) return r.status(first.status).set('Content-Type', first.type || 'application/json').send(first.text);
    r.status(good.status).set('Content-Type', good.headers.get('content-type') || 'text/event-stream');
    for await (const c of good.body) r.write(c);
    r.end();
  } catch (e) { if (!r.headersSent) r.status(502).json({ error: 'Provider unreachable' }); else r.end(); }
});

app.post('/api/search', async (q, r) => {
  if (!E.TAVILY_KEY) return r.status(404).end();
  try {
    const u = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + E.TAVILY_KEY },
      body: JSON.stringify({ query: String(q.body.q || '').slice(0, 300), max_results: 5 })
    });
    const j = await u.json();
    r.json({ results: (j.results || []).map(x => ({ title: x.title, url: x.url, content: String(x.content || '').slice(0, 600) })) });
  } catch (e) { r.status(502).json({ error: 'Search failed' }); }
});

app.post('/api/image', async (q, r) => {
  if (!E.IMAGE_KEY || !E.IMAGE_MODEL) return r.status(404).end();
  try {
    const u = await fetch((E.IMAGE_BASE || 'https://api.openai.com/v1').replace(/\/$/, '') + '/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + E.IMAGE_KEY },
      body: JSON.stringify({ model: E.IMAGE_MODEL, prompt: String(q.body.prompt || '').slice(0, 1000), size: '1024x1024', response_format: 'b64_json' })
    });
    const j = await u.json();
    const b = j.data && j.data[0] && j.data[0].b64_json;
    if (!u.ok || !b) return r.status(u.status || 502).json({ error: 'Image failed' });
    r.json({ image: 'data:image/png;base64,' + b });
  } catch (e) { r.status(502).json({ error: 'Image failed' }); }
});

// Home-screen install (PWA): manifest and icons are served from here.
const ICONS = { 192: Buffer.from('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', 'base64'), 512: Buffer.from('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', 'base64') };
app.get('/manifest.webmanifest', (q, r) => r.set('Content-Type', 'application/manifest+json').send(JSON.stringify({
  name: 'Nova AI', short_name: 'Nova AI', start_url: '/', display: 'standalone', background_color: '#120d1b', theme_color: '#120d1b',
  icons: [192, 512].map(n => ({ src: '/icons/icon-' + n + '.png', sizes: n + 'x' + n, type: 'image/png', purpose: 'any' }))
})));
app.get(['/icons/icon-192.png', '/icons/icon-512.png'], (q, r) => r.set('Content-Type', 'image/png').send(ICONS[q.path.includes('512') ? 512 : 192]));
app.get('/sw.js', (q, r) => r.set('Content-Type', 'application/javascript').send("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});"));
app.get('/', (q, r) => r.sendFile(path.join(__dirname, 'index.html')));
app.listen(E.PORT || 3000, () => console.log('Nova AI running on port ' + (E.PORT || 3000)));
