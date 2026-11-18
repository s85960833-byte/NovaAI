'use strict';

// Anonymous AI Horde image generation. No user-owned key or provider secret is required.
// AI Horde's documented 0000000000 token identifies anonymous, lowest-priority requests.
const API_BASE = 'https://aihorde.net/api/v2';
const ANONYMOUS_KEY = '0000000000';
const CLIENT_AGENT = 'NOVA-AI:1.0:https://github.com/s85960833-byte/NovaAI';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function dimension(value, fallback = 512) {
  const number = Number(value);
  const finite = Number.isFinite(number) ? number : fallback;
  return Math.max(512, Math.min(1024, Math.round(finite / 64) * 64));
}

function imageDataUrl(rawImage) {
  if (typeof rawImage !== 'string' || !rawImage) throw new Error('Free community image result was empty');
  let encoded = rawImage;
  let declaredType = '';
  const dataMatch = rawImage.match(/^data:(image\/(?:webp|png|jpeg|gif));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (dataMatch) {
    declaredType = dataMatch[1].toLowerCase();
    encoded = dataMatch[2];
  }

  if (encoded.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 8 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new Error('Free community image exceeded the supported size or format');
  }

  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length < 1000 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Free community image exceeded the supported size');
  }

  const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isGif = buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
  const detectedType = isWebp ? 'image/webp' : isPng ? 'image/png' : isJpeg ? 'image/jpeg' : isGif ? 'image/gif' : '';

  if (!detectedType || (declaredType && detectedType !== declaredType)) {
    throw new Error('Free community image format was not supported');
  }
  return 'data:' + detectedType + ';base64,' + buffer.toString('base64');
}

async function readJson(response, label) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(label + ' failed (HTTP ' + response.status + ')');
  return body;
}

async function generateFreeImage(prompt, body = {}, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const sleepImpl = options.sleepImpl || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const apiBase = String(options.apiBase || API_BASE).replace(/\/+$/, '');
  const maxPolls = Number.isInteger(options.maxPolls) ? Math.max(1, options.maxPolls) : 270;
  const pollIntervalMs = Number.isInteger(options.pollIntervalMs) ? Math.max(0, options.pollIntervalMs) : 2000;

  if (typeof fetchImpl !== 'function') throw new Error('This server does not support outbound image requests');
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('An image prompt is required');

  const headers = {
    'Content-Type': 'application/json',
    apikey: ANONYMOUS_KEY,
    'Client-Agent': CLIENT_AGENT
  };
  const params = {
    width: dimension(body.width),
    height: dimension(body.height),
    n: 1,
    steps: 20,
    cfg_scale: 7
  };
  if (body.seed !== undefined && body.seed !== null && String(body.seed).trim()) {
    params.seed = String(body.seed).slice(0, 80);
  }

  const submission = await fetchImpl(apiBase + '/generate/async', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: prompt.trim().slice(0, 1000),
      params,
      nsfw: false,
      censor_nsfw: true,
      trusted_workers: false,
      validated_backends: true,
      slow_workers: true,
      replacement_filter: true,
      r2: false,
      shared: true
    }),
    signal: AbortSignal.timeout(12000)
  });
  const accepted = await readJson(submission, 'Anonymous image request');
  if (!accepted || typeof accepted.id !== 'string' || !accepted.id) {
    throw new Error('Free community image queue returned no request ID');
  }

  let complete = false;
  for (let attempt = 0; attempt < maxPolls; attempt++) {
    await sleepImpl(pollIntervalMs);
    const check = await fetchImpl(apiBase + '/generate/check/' + encodeURIComponent(accepted.id), {
      headers,
      signal: AbortSignal.timeout(8000)
    });
    const state = await readJson(check, 'Free community image status');
    if (state.faulted || state.is_possible === false) {
      throw new Error('Free community image generation could not be fulfilled');
    }
    if (state.done === true || Number(state.finished) >= 1) {
      complete = true;
      break;
    }
  }
  if (!complete) throw new Error('Free image queue is still busy; please retry later');

  const status = await fetchImpl(apiBase + '/generate/status/' + encodeURIComponent(accepted.id), {
    headers,
    signal: AbortSignal.timeout(12000)
  });
  const result = await readJson(status, 'Free community image result');
  const generated = result && Array.isArray(result.generations) && result.generations[0] && result.generations[0].img;
  return { image: imageDataUrl(generated), provider: 'community-free' };
}

module.exports = { generateFreeImage, imageDataUrl, dimension };
