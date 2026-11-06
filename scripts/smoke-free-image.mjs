const BASE = process.env.NOVAAI_URL || 'https://novaai-4auo.onrender.com';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 30000);
  try {
    return await fetch(BASE + path, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const submitted = await request('/api/image', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ prompt: 'A simple blue geometric flower on a clean white background', width: 512, height: 512, seed: 42 }),
  timeout: 30000
});
let result = await submitted.json().catch(() => ({}));
if (!submitted.ok) throw new Error('Free image job submission failed: HTTP ' + submitted.status + ' ' + (result.error || ''));
if (!result.image && !result.jobId) throw new Error('Image endpoint returned neither an image nor a job ID');

if (result.jobId) {
  let completed = false;
  // The free community queue can take several minutes; no paid model is called here.
  for (let attempt = 0; attempt < 330; attempt++) {
    await sleep(2000);
    const response = await request('/api/image/status/' + encodeURIComponent(result.jobId), { timeout: 20000 });
    const state = await response.json().catch(() => ({}));
    if (!response.ok || state.status === 'error') {
      throw new Error('Free image job failed: HTTP ' + response.status + ' ' + (state.error || ''));
    }
    if (state.status === 'done' && state.image) {
      result = state;
      completed = true;
      break;
    }
  }
  if (!completed) throw new Error('Free image job did not finish within the 11-minute smoke window');
}

const match = String(result.image || '').match(/^data:(image\/(?:webp|png|jpeg|gif));base64,([A-Za-z0-9+/]+={0,2})$/i);
if (!match || match[2].length < 1200) throw new Error('Free image provider returned an invalid image data URL');
const buffer = Buffer.from(match[2], 'base64');
const type = match[1].toLowerCase();
const valid = type === 'image/webp'
  ? buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  : type === 'image/png'
    ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === 'image/jpeg'
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
if (!valid || buffer.length < 1000 || buffer.length > 8 * 1024 * 1024) {
  throw new Error('Free image provider returned invalid or out-of-bounds image bytes');
}
console.log('PASS live free image generation (' + type + ', ' + buffer.length + ' bytes, provider=' + (result.provider || 'unknown') + ')');
