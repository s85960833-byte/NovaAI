'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const server = fs.readFileSync(new URL('../nova-server.txt', 'file://' + __filename), 'utf8');
const router = fs.readFileSync(new URL('../nova-llm-router.js', 'file://' + __filename), 'utf8');
const envExample = fs.readFileSync(new URL('../.env.example', 'file://' + __filename), 'utf8');

test('OpenRouter defaults to its dynamic free-model router', () => {
  assert.match(router, /env\.OPENROUTER_MODEL \|\| 'openrouter\/free'/);
  assert.match(server, /buildChatProviders\(E,\s*\{\s*vision:\s*vis,\s*defaultVisionModel:\s*VISION,\s*bases:\s*providerBases,/);
});

test('provider routes require explicit credentials and model configuration where applicable', () => {
  assert.match(router, /if \(env\.LLM_KEY && env\.LLM_MODEL\)/);
  assert.match(router, /if \(env\.GROQ_API_KEY && env\.GROQ_MODEL\)/);
  assert.match(router, /if \(env\.OPENROUTER_API_KEY\)/);
  assert.match(server, /const llmChatConfigured = !!\(E\.LLM_KEY && E\.LLM_MODEL\)/);
  assert.match(server, /const groqChatConfigured = !!\(E\.GROQ_API_KEY && E\.GROQ_MODEL\)/);
  assert.match(server, /if \(!llmChatConfigured && !groqChatConfigured && !E\.OPENROUTER_API_KEY && !cloudflareChatConfigured\)/);
});

test('provider routes are deduplicated by vendor hostname instead of rotating same-company keys', () => {
  assert.match(router, /const seenHosts = new Set\(\)/);
  assert.match(router, /if \(seenHosts\.has\(host\)\) return/);
  assert.match(router, /Never rotate multiple credentials for one provider company/);
});

test('retired Groq and stale pinned OpenRouter defaults are absent', () => {
  assert.doesNotMatch(server + router, /llama-3\.3-70b-versatile/);
  assert.doesNotMatch(server + router, /meta-llama\/llama-3\.3-70b-instruct:free/);
});

test('Render start command stays stable and local startup loads an optional .env file', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', 'file://' + __filename), 'utf8'));
  assert.equal(packageJson.engines.node, '22.x');
  assert.equal(packageJson.scripts.start, 'node nova-server.txt');
  assert.equal(packageJson.scripts['start:local'], 'node --env-file-if-exists=.env nova-server.txt');
});

test('optional Cloudflare fallback is opt-in and disabled in the sample environment', () => {
  assert.match(server, /const cloudflareChatConfigured = E\.NOVA_ALLOW_CLOUDFLARE === '1'/);
  assert.match(router, /options\.allowCloudflare !== false/);
  assert.match(envExample, /^NOVA_ALLOW_CLOUDFLARE=0$/m);
});
