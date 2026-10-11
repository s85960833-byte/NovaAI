// Nova AI backend (UNTESTED starter). Hosts index.html and gives it a server:
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

app.post('/api/chat/completions', async (q, r) => {
  try {
    const u = await fetch(BASE.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + E.LLM_KEY },
      body: JSON.stringify({ ...q.body, model: E.LLM_MODEL, stream: true })
    });
    r.status(u.status).set('Content-Type', u.headers.get('content-type') || 'text/event-stream');
    for await (const c of u.body) r.write(c);
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
