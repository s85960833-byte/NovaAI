'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'nova-server.txt'), 'utf8');
const app = fs.readFileSync(path.join(root, 'nova-app.js'), 'utf8');
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');

test('AI Horde fallback requires explicit opt-in and an operator API key', () => {
  assert.ok(source.includes("if (E.NOVA_ALLOW_AI_HORDE !== '1' || !E.HORDE_API_KEY) throw new Error('No approved image provider is currently configured')"));
  assert.ok(source.includes("const hordeImageConfigured = E.NOVA_ALLOW_AI_HORDE === '1' && !!E.HORDE_API_KEY"));
});

test('AI Horde generation explicitly disables dataset sharing', () => {
  assert.match(source, /nsfw:\s*false,[\s\S]{0,160}shared:\s*false/);
  assert.doesNotMatch(source, /shared:\s*true/);
});

test('image availability is reported only for an explicitly enabled provider', () => {
  assert.ok(source.includes("const paidImageConfigured = E.ALLOW_PAID_IMAGE === 'true'"));
  assert.ok(source.includes("const pollinationsImageConfigured = E.NOVA_ALLOW_POLLINATIONS_SPEND === '1'"));
  assert.ok(source.includes("const hordeImageConfigured = E.NOVA_ALLOW_AI_HORDE === '1'"));
  assert.ok(source.includes('(paidImageConfigured || pollinationsImageConfigured || hordeImageConfigured)'));
  assert.ok(source.includes("if (!imageProviderConfigured) return r.status(503).json"));
});

test('third-party image generation remains default-off in the environment template', () => {
  assert.ok(envExample.includes('ALLOW_PAID_IMAGE=false'));
  assert.ok(envExample.includes('NOVA_ALLOW_POLLINATIONS_SPEND=0'));
  assert.ok(envExample.includes('NOVA_ALLOW_AI_HORDE=0'));
});

test('browser image UI does not call unapproved Pollinations endpoints directly', () => {
  assert.ok(!app.includes('https://gen.pollinations.ai/image/'));
  assert.ok(!app.includes('https://image.pollinations.ai/prompt/'));
  assert.ok(app.includes('const imgOK=()=>!!((SV&&SV.image)||SMP)'));
});

test('photo help opens the unchanged Nova Production URL, not an embedded preview URL', () => {
  assert.ok(app.includes("const OPEN_URL='https://novaai-4auo.onrender.com'"));
  assert.ok(!app.includes('claude.ai/artifact/'));
});

test('unsupported embedded voice tells the user to continue in text and open Chrome or Edge', () => {
  assert.ok(app.includes('not available in this in-app browser'));
  assert.ok(app.includes('इस in-app browser में live voice उपलब्ध नहीं है'));
  assert.ok(app.includes('Open Nova in Chrome or Edge'));
});
