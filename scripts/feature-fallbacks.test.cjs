'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'nova-server.txt'), 'utf8');
const app = fs.readFileSync(path.join(root, 'nova-app.js'), 'utf8');
const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');

test('image generation is unavailable unless at least one provider is explicitly configured', () => {
  assert.match(server, /const paidImageConfigured = E\.ALLOW_PAID_IMAGE === 'true' && !!\(E\.IMAGE_KEY && E\.IMAGE_MODEL\);/);
  assert.match(server, /const pollinationsImageConfigured = E\.NOVA_ALLOW_POLLINATIONS_SPEND === '1' && !!E\.POLLI_KEY;/);
  assert.match(server, /const hordeImageConfigured = E\.NOVA_ALLOW_AI_HORDE === '1' && !!E\.HORDE_API_KEY;/);
  assert.match(server, /const imageProviderConfigured = E\.IMAGE_OFF !== '1' &&/);
  assert.match(server, /image: imageProviderConfigured/);
  assert.match(server, /if \(!imageProviderConfigured\) return r\.status\(503\)/);
});

test('IMAGE_OFF uses an explicit 1/0 contract in both readiness and execution', () => {
  assert.match(server, /E\.IMAGE_OFF !== '1'/);
  assert.match(server, /if \(E\.IMAGE_OFF === '1'\) throw new Error\('Image generation is disabled'\)/);
  assert.match(server, /if \(E\.IMAGE_OFF === '1'\) return r\.status\(404\)\.end\(\)/);
  assert.doesNotMatch(server, /if \(E\.IMAGE_OFF\)\s/);
});

test('community AI Horde is opt-in, and its key alone cannot enable image generation', () => {
  assert.match(server, /E\.NOVA_ALLOW_AI_HORDE !== '1' \|\| !E\.HORDE_API_KEY/);
  assert.match(env, /^NOVA_ALLOW_AI_HORDE=0$/m);
  assert.match(env, /^NOVA_ALLOW_POLLINATIONS_SPEND=0$/m);
  assert.match(env, /^ALLOW_PAID_IMAGE=false$/m);
});

test('public image readiness describes enabled providers rather than raw secret presence', () => {
  assert.match(server, /paidImage: paidImageConfigured, pollinationsImage: pollinationsImageConfigured, hordeImage: hordeImageConfigured/);
  assert.doesNotMatch(server, /hordeImage: !!E\.HORDE_API_KEY/);
});

test('browser image feature stays hidden without a working server provider or the embedded SVG helper', () => {
  assert.match(app, /const imgOK=\(\)=>!!\(\(SV&&SV\.image\)\|\|SMP\)/);
  assert.match(app, /if \(!\(\(SV&&SV\.image\)\|\|SMP\)\)\{toast\(t\('imgUnavailable'\)\);return\}/);
  assert.match(app, /unavailable:'No approved image-generation provider is configured/);
  assert.match(app, /unavailable:'अभी कोई स्वीकृत image provider configured नहीं है/);
});

test('browser image generation does not bypass the backend through unapproved direct Pollinations URLs', () => {
  assert.doesNotMatch(app, /https:\/\/image\.pollinations\.ai/);
  assert.doesNotMatch(app, /https:\/\/gen\.pollinations\.ai/);
  assert.match(app, /async function pollin\(\)\{throw\{status:503,message:t\('imgUnavailable'\)\}\}/);
});

test('photo browser fallback points to the existing Nova production URL', () => {
  assert.match(app, /const OPEN_URL='https:\/\/novaai-4auo\.onrender\.com'/);
  assert.doesNotMatch(app, /claude\.ai\/artifact/);
});

test('unsupported live voice keeps entry points visible and gives a text-mode fallback', () => {
  assert.match(app, /function syncFeatures\(\)\{const i=imgOK\(\);\$\('gen'\)\.hidden=!i;\$\('nImg'\)\.hidden=!i;\$\('nLive'\)\.hidden=false;\$\('lv'\)\.hidden=false/);
  assert.match(app, /lvNo:'Live voice is not available in this in-app browser\. You can continue by typing/);
  assert.match(app, /lvNo:'इस in-app browser में live voice उपलब्ध नहीं है। नीचे संदेश बॉक्स में लिखकर बात जारी रखें।/);
});

test('speech-to-text OFF follows the documented numeric boolean convention', () => {
  assert.match(server, /stt: E\.STT_OFF !== '1' && !!\(E\.LLM_KEY \|\| E\.GROQ_API_KEY\)/);
  assert.match(server, /if \(E\.STT_OFF === '1'\) return r\.status\(404\)\.end\(\)/);
  assert.doesNotMatch(server, /if \(E\.STT_OFF\)\s/);
  assert.match(env, /^STT_OFF=0$/m);
});
