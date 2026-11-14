'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'nova-server.txt'), 'utf8');

test('AI Horde fallback requires explicit opt-in and an operator API key', () => {
  assert.match(source, /if \(E\.NOVA_ALLOW_AI_HORDE !== '1' \|\| !E\.HORDE_API_KEY\) throw new Error\('No approved image provider is currently configured'\)/);
  assert.match(source, /const hordeImageConfigured = E\.NOVA_ALLOW_AI_HORDE === '1' && !!E\.HORDE_API_KEY/);
});

test('AI Horde generation explicitly disables dataset sharing', () => {
  assert.match(source, /nsfw:\s*false,[\s\S]{0,160}shared:\s*false/);
  assert.doesNotMatch(source, /shared:\s*true/);
});


const app = fs.readFileSync(path.join(__dirname, '..', 'nova-app.js'), 'utf8');
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');

test('image availability is reported only for an explicitly enabled provider', () => {
  assert.match(source, /const paidImageConfigured = E\\.ALLOW_PAID_IMAGE === 'true' && !!\\(E\\.IMAGE_KEY && E\\.IMAGE_MODEL\\)/);
  assert.match(source, /const pollinationsImageConfigured = E\\.NOVA_ALLOW_POLLINATIONS_SPEND === '1' && !!E\\.POLLI_KEY/);
  assert.match(source, /const hordeImageConfigured = E\\.NOVA_ALLOW_AI_HORDE === '1' && !!E\\.HORDE_API_KEY/);
  assert.match(source, /const imageProviderConfigured = E\\.IMAGE_OFF !== '1' &&[\\s\\S]{0,120}paidImageConfigured \\|\\| pollinationsImageConfigured \\|\\| hordeImageConfigured/);
  assert.match(source, /if \\(!imageProviderConfigured\\) return r\\.status\\(503\\)\\.json/);
});

test('third-party image generation remains default-off in the environment template', () => {
  assert.match(envExample, /^ALLOW_PAID_IMAGE=false$/m);
  assert.match(envExample, /^NOVA_ALLOW_POLLINATIONS_SPEND=0$/m);
  assert.match(envExample, /^NOVA_ALLOW_AI_HORDE=0$/m);
});

test('browser image UI does not call unapproved Pollinations endpoints directly', () => {
  assert.doesNotMatch(app, /https:\\/\\/gen\\.pollinations\\.ai\\/image\\//);
  assert.doesNotMatch(app, /https:\\/\\/image\\.pollinations\\.ai\\/prompt\\//);
  assert.match(app, /const imgOK=\\(\\)=>!!\\(\\(SV&&SV\\.image\\)\\|\\|SMP\\)/);
});

test('photo help opens the unchanged Nova Production URL, not an embedded preview URL', () => {
  assert.match(app, /const OPEN_URL='https:\\/\\/novaai-4auo\\.onrender\\.com'/);
  assert.doesNotMatch(app, /claude\\.ai\\/artifact/);
});

test('unsupported embedded voice tells the user to continue in text and open Chrome or Edge', () => {
  assert.match(app, /in-app browser is not available|not available in this in-app browser/i);
  assert.match(app, /इस in-app browser में live voice उपलब्ध नहीं है/);
  assert.match(app, /Open Nova in Chrome or Edge/);
});
