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

app.get('/', (q, r) => r.sendFile(path.join(__dirname, 'index.html')));
app.listen(E.PORT || 3000, () => console.log('Nova AI running on port ' + (E.PORT || 3000)));
