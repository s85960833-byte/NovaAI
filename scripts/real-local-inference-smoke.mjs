import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const BASE = process.env.NOVAAI_URL || 'http://127.0.0.1:8787';
const REQUEST_TIMEOUT_MS = 20000;
const statusMessages = [];
const uniqueStatuses = new Set();

function status(message) {
  const value = String(message || '').slice(0, 220);
  if (value && !uniqueStatuses.has(value)) {
    uniqueStatuses.add(value);
    statusMessages.push(value);
    console.log('[NOVA model] ' + value);
  }
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

function makeSpeechSamples() {
  const wavPath = path.join(os.tmpdir(), 'nova-local-whisper-smoke.wav');
  const tts = spawnSync('espeak-ng', [
    '-w', wavPath,
    '-v', 'en-us',
    '-s', '132',
    'Hello Nova. This is a local voice recognition test.'
  ], { encoding: 'utf8', timeout: 30000 });
  if (tts.error || tts.status !== 0) {
    throw new Error('espeak-ng could not create the voice test fixture: ' + (tts.stderr || tts.error || tts.status));
  }

  const wav = fs.readFileSync(wavPath);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF', 'voice test fixture must be a RIFF WAV file');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE', 'voice test fixture must be a WAV file');

  let offset = 12, channels = 0, sampleRate = 0, bitsPerSample = 0, format = 0, raw = null;
  while (offset + 8 <= wav.length) {
    const name = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = Math.min(wav.length, start + size);
    if (name === 'fmt ') {
      format = wav.readUInt16LE(start);
      channels = wav.readUInt16LE(start + 2);
      sampleRate = wav.readUInt32LE(start + 4);
      bitsPerSample = wav.readUInt16LE(start + 14);
    } else if (name === 'data') {
      raw = wav.subarray(start, end);
    }
    offset = start + size + (size % 2);
  }

  assert.equal(format, 1, 'eSpeak voice fixture must use PCM encoding');
  assert.equal(bitsPerSample, 16, 'eSpeak voice fixture must use 16-bit PCM');
  assert.ok(channels === 1 || channels === 2, 'voice fixture must be mono or stereo');
  assert.ok(sampleRate >= 16000, 'voice fixture sample rate must be at least 16 kHz');
  assert.ok(raw && raw.length > sampleRate / 2, 'voice fixture must contain speech audio');

  const frameCount = Math.floor(raw.length / (2 * channels));
  const mono = new Float32Array(frameCount);
  for (let i = 0; i < frameCount; i++) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) {
      sum += raw.readInt16LE((i * channels + channel) * 2);
    }
    mono[i] = (sum / channels) / 32768;
  }

  const targetRate = 16000;
  const targetLength = Math.floor(frameCount * targetRate / sampleRate);
  const samples = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const sourcePosition = i * sampleRate / targetRate;
    const left = Math.floor(sourcePosition);
    const right = Math.min(frameCount - 1, left + 1);
    const fraction = sourcePosition - left;
    samples[i] = mono[left] * (1 - fraction) + mono[right] * fraction;
  }
  fs.rmSync(wavPath, { force: true });
  return samples;
}

let browser;
try {
  console.log('[NOVA] Starting real, no-provider-key inference smoke test against ' + BASE);

  // Exercise public live search before loading the large local inference models.
  const search = await jsonRequest(BASE + '/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'NASA' })
  });
  assert.equal(search.response.status, 200, 'keyless live search should return HTTP 200');
  assert.ok(Array.isArray(search.body.results) && search.body.results.length > 0, 'keyless live search should return at least one result');
  for (const item of search.body.results) {
    assert.ok(/^https:\/\//.test(item.url || ''), 'live search results must use HTTPS URLs');
    assert.ok(item.title, 'live search results must include titles');
  }
  console.log('[PASS] Live no-key search: ' + search.body.results.length + ' results via ' + search.body.provider);

  // Start one safe, generic community image job while the browser downloads and tests local models.
  const imageSubmit = await jsonRequest(BASE + '/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A simple blue flower illustration on a plain light background',
      width: 512,
      height: 512,
      seed: 20261118
    })
  });
  assert.equal(imageSubmit.response.status, 202, 'anonymous keyless image route should queue a safe request');
  assert.ok(imageSubmit.body.jobId, 'image route should return a job ID');
  console.log('[NOVA] Anonymous community image job accepted; waiting while local inference runs.');

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(180000);
  page.on('pageerror', error => console.error('[NOVA browser error] ' + String(error.message || error)));
  await page.exposeFunction('__novaReportStatus', status);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!window.NovaLocalAI, { timeout: 30000 });

  // Actual Transformers.js + ONNX model download and generation (no mocked pipeline).
  const chat = await page.evaluate(async () => {
    const answer = await window.NovaLocalAI.generate([
      { role: 'user', content: 'Reply in one short sentence: say hello to Nova.' }
    ], {
      max_new_tokens: 64,
      onStatus: message => window.__novaReportStatus(message)
    });
    return { answer, state: window.NovaLocalAI.getStatus() };
  });
  assert.equal(typeof chat.answer, 'string');
  assert.ok(chat.answer.trim().length > 0, 'real local Qwen inference must return a non-empty answer');
  assert.equal(chat.state.loaded, true, 'real local chat model must stay loaded');
  assert.ok(['webgpu', 'wasm'].includes(chat.state.backend), 'real local chat must select WebGPU or WASM');
  console.log('[PASS] Real local chat inference via ' + chat.state.backend + ': ' + chat.answer.slice(0, 180));

  // Real Tesseract worker and English/Hindi traineddata download against a rendered local test image.
  const ocr = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 100px Arial, sans-serif';
    ctx.fillText('NOVA OCR CHECK', 42, 170);
    const extracted = await window.NovaLocalAI.ocrImage(canvas.toDataURL('image/png'), {
      onStatus: message => window.__novaReportStatus(message)
    });
    return extracted;
  });
  assert.match(ocr.toUpperCase(), /NOVA/, 'real OCR must recognize NOVA from a locally rendered image');
  assert.match(ocr.toUpperCase(), /OCR/, 'real OCR must recognize OCR from a locally rendered image');
  console.log('[PASS] Real local English/Hindi OCR: ' + ocr.trim().replace(/\s+/g, ' ').slice(0, 160));

  // Real Whisper inference with an offline synthesized English speech fixture.
  const speechSamples = makeSpeechSamples();
  const voice = await page.evaluate(async samples => {
    let result = null, error = '';
    try {
      result = await window.NovaLocalAI.transcribe(new Float32Array(samples), {
        language: 'en',
        onStatus: message => window.__novaReportStatus(message)
      });
    } catch (cause) {
      error = String(cause && cause.message || cause);
    }
    return { result, error, state: window.NovaLocalAI.getStatus() };
  }, Array.from(speechSamples));
  assert.equal(voice.state.voiceLoaded, true, 'real Whisper model must load');
  assert.ok(['webgpu', 'wasm'].includes(voice.state.voiceBackend), 'real Whisper must select WebGPU or WASM');
  assert.ok(voice.result && typeof voice.result.text === 'string' && voice.result.text.trim(), 'Whisper must return recognized speech from the synthesized fixture; error=' + voice.error);
  const recognized = voice.result.text.toLowerCase();
  assert.match(recognized, /hello/, 'Whisper fixture transcription should contain “hello”');
  assert.match(recognized, /nova/, 'Whisper fixture transcription should contain “nova”');
  console.log('[PASS] Real local Whisper transcription via ' + voice.state.voiceBackend + ': ' + voice.result.text.trim().slice(0, 180));

  // Poll the actual public queue, but do not spin indefinitely or bypass its rate limits.
  let imageResult = null, imageError = '';
  const deadline = Date.now() + 9 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const poll = await jsonRequest(BASE + '/api/image/status/' + encodeURIComponent(imageSubmit.body.jobId));
    if (poll.response.status === 200 && ['queued', 'processing'].includes(poll.body.status)) continue;
    if (poll.response.status === 200 && poll.body.status === 'done' && typeof poll.body.image === 'string') {
      imageResult = poll.body.image;
      break;
    }
    imageError = poll.body.error || ('unexpected image status HTTP ' + poll.response.status + ' ' + JSON.stringify(poll.body).slice(0, 180));
    break;
  }
  assert.ok(imageResult, 'real anonymous image job should finish within nine minutes: ' + imageError);
  assert.match(imageResult, /^data:image\/(?:webp|png|jpeg|gif);base64,/i, 'image response must be a validated image data URL');
  const imageBytes = Buffer.from(imageResult.split(',')[1], 'base64');
  assert.ok(imageBytes.length >= 1000 && imageBytes.length <= 8 * 1024 * 1024, 'image response size must be within safe bounds');
  console.log('[PASS] Real anonymous community image generation: ' + imageBytes.length + ' bytes (' + imageResult.slice(5, imageResult.indexOf(';')) + ')');

  console.log('[PASS] Real local inference and live no-key feature smoke: chat + OCR + voice + live search + image generation.');
  await context.close();
} catch (error) {
  console.error('[FAIL] ' + String(error && error.stack || error));
  console.error('[NOVA status history] ' + JSON.stringify(statusMessages.slice(-30)));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
}
