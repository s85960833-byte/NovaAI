const test = require('node:test');
const assert = require('node:assert/strict');
const { generateFreeImage, imageDataUrl, dimension } = require('../nova-image-horde');

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

function pngFixture() {
  const bytes = Buffer.alloc(1200, 7);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  return bytes;
}

test('queues anonymous image generation without a user-owned secret and validates returned PNG', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/generate/async')) return response(202, { id: 'job-123' });
    if (url.endsWith('/generate/check/job-123')) return response(200, { done: true, finished: 1 });
    if (url.endsWith('/generate/status/job-123')) {
      return response(200, { generations: [{ img: pngFixture().toString('base64') }] });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const result = await generateFreeImage('A blue geometric flower', {
    width: 768, height: 512, seed: 42
  }, { fetchImpl, sleepImpl: async () => {}, maxPolls: 1, pollIntervalMs: 0 });

  assert.equal(result.provider, 'community-free');
  assert.match(result.image, /^data:image\/png;base64,/);
  assert.equal(calls.length, 3);

  const headers = calls[0].options.headers;
  assert.equal(headers.apikey, '0000000000');
  assert.equal(headers['Client-Agent'], 'NOVA-AI:1.0:https://github.com/s85960833-byte/NovaAI');

  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.prompt, 'A blue geometric flower');
  assert.equal(payload.nsfw, false);
  assert.equal(payload.censor_nsfw, true);
  assert.equal(payload.replacement_filter, true);
  assert.equal(payload.r2, false);
  assert.equal(payload.shared, true);
  assert.equal(payload.params.width, 768);
  assert.equal(payload.params.height, 512);
  assert.equal(payload.params.seed, '42');
});

test('rejects provider authentication or admission errors cleanly', async () => {
  await assert.rejects(
    generateFreeImage('A simple flower', {}, {
      fetchImpl: async () => response(401, { message: 'invalid token' }),
      sleepImpl: async () => {}
    }),
    /Anonymous image request failed \(HTTP 401\)/
  );
});

test('stops polling when the provider faults a job', async () => {
  let calls = 0;
  await assert.rejects(
    generateFreeImage('A simple flower', {}, {
      fetchImpl: async url => {
        calls++;
        if (url.endsWith('/generate/async')) return response(202, { id: 'faulted-job' });
        return response(200, { faulted: true, done: false });
      },
      sleepImpl: async () => {},
      maxPolls: 3,
      pollIntervalMs: 0
    }),
    /could not be fulfilled/
  );
  assert.equal(calls, 2);
});

test('does not fetch or accept worker-controlled image URLs', async () => {
  await assert.rejects(
    generateFreeImage('A simple flower', {}, {
      fetchImpl: async url => {
        if (url.endsWith('/generate/async')) return response(202, { id: 'url-job' });
        if (url.endsWith('/generate/check/url-job')) return response(200, { done: true, finished: 1 });
        return response(200, { generations: [{ img: 'https://example.invalid/image.png' }] });
      },
      sleepImpl: async () => {},
      maxPolls: 1,
      pollIntervalMs: 0
    }),
    /supported size or format/
  );
});

test('rejects invalid image signatures and SVG data URLs', () => {
  assert.throws(() => imageDataUrl('https://example.invalid/image.png'), /supported size or format/);
  assert.throws(() => imageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='), /supported size or format/);
});

test('rounds model dimensions to 64-pixel multiples and enforces bounds', () => {
  assert.equal(dimension(767), 768);
  assert.equal(dimension(128), 512);
  assert.equal(dimension(4096), 1024);
  assert.equal(dimension('not-a-number'), 512);
});
