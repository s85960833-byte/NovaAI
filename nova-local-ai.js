/* Browser-local Nova inference. No hosted AI provider or API key is used. */
(() => {
  'use strict';
  const MODEL = 'onnx-community/Qwen3-0.6B-Instruct-ONNX';
  const ASR_MODEL = 'onnx-community/whisper-tiny';
  let transformersPromise = null, pipelinePromise = null, asrPromise = null;
  let generator = null, transcriber = null;
  let backend = 'not-loaded', asrBackend = 'not-loaded';
  const status = (cb, message) => { try { cb && cb(message); } catch (_) {} };
  const cancelled = signal => { if (signal && signal.aborted) { const e = new Error('Request cancelled'); e.name = 'AbortError'; throw e; } };
  async function getPipeline() {
    if (!transformersPromise) transformersPromise = import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2');
    return transformersPromise;
  }
  async function hasGpu() {
    try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (_) { return false; }
  }
  async function load(onStatus) {
    if (generator) return generator;
    if (pipelinePromise) return pipelinePromise;
    pipelinePromise = (async () => {
      status(onStatus, 'Loading local AI engine…');
      const { pipeline } = await getPipeline();
      if (await hasGpu()) {
        try {
          status(onStatus, 'Preparing local AI on this device (WebGPU)… model download is about 648 MB.');
          generator = await pipeline('text-generation', MODEL, {
            device: 'webgpu', dtype: 'q4f16',
            progress_callback: p => status(onStatus, p && p.status ? String(p.status) + (p.file ? ' · ' + p.file : '') : 'Downloading local model…')
          });
          backend = 'webgpu';
          return generator;
        } catch (_) {
          generator = null;
          status(onStatus, 'GPU setup unavailable; trying CPU/WASM mode. This may need more memory and a larger download.');
        }
      } else {
        status(onStatus, 'WebGPU unavailable; preparing CPU/WASM mode. This may be slower and need more memory.');
      }
      generator = await pipeline('text-generation', MODEL, {
        dtype: 'q4',
        progress_callback: p => status(onStatus, p && p.status ? String(p.status) + (p.file ? ' · ' + p.file : '') : 'Downloading local model…')
      });
      backend = 'wasm';
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (_) {}
      return generator;
    })().catch(error => {
      generator = null; pipelinePromise = null; backend = 'not-loaded'; throw error;
    });
    return pipelinePromise;
  }
  async function loadTranscriber(onStatus) {
    if (transcriber) return transcriber;
    if (asrPromise) return asrPromise;
    asrPromise = (async () => {
      status(onStatus, 'Preparing offline voice recognition… Whisper Tiny model is an additional download.');
      const { pipeline } = await getPipeline();
      if (await hasGpu()) {
        try {
          transcriber = await pipeline('automatic-speech-recognition', ASR_MODEL, {
            device: 'webgpu', dtype: 'q4f16',
            progress_callback: p => status(onStatus, p && p.status ? String(p.status) + (p.file ? ' · ' + p.file : '') : 'Downloading voice model…')
          });
          asrBackend = 'webgpu';
          return transcriber;
        } catch (_) {
          transcriber = null;
          status(onStatus, 'Voice GPU setup unavailable; switching to CPU/WASM.');
        }
      }
      transcriber = await pipeline('automatic-speech-recognition', ASR_MODEL, {
        dtype: 'q4',
        progress_callback: p => status(onStatus, p && p.status ? String(p.status) + (p.file ? ' · ' + p.file : '') : 'Downloading voice model…')
      });
      asrBackend = 'wasm';
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (_) {}
      return transcriber;
    })().catch(error => {
      transcriber = null; asrPromise = null; asrBackend = 'not-loaded'; throw error;
    });
    return asrPromise;
  }
  function normalizeMessages(messages) {
    return (Array.isArray(messages) ? messages : []).map(message => {
      let content = message && message.content;
      if (Array.isArray(content)) {
        const textParts = content.filter(part => part && part.type === 'text').map(part => String(part.text || ''));
        const hasImage = content.some(part => part && part.type === 'image_url');
        if (hasImage) textParts.push('[A photo was attached. This local text-only model cannot inspect image pixels yet. Please type the question text.]');
        content = textParts.join('\n');
      }
      return { role: message.role === 'assistant' ? 'assistant' : message.role === 'system' ? 'system' : 'user', content: String(content || '') };
    });
  }
  async function generate(messages, options = {}) {
    const signal = options.signal;
    cancelled(signal);
    const model = await load(options.onStatus);
    cancelled(signal);
    const output = await model(normalizeMessages(messages), {
      max_new_tokens: Math.max(64, Math.min(700, Number(options.max_new_tokens) || 420)),
      do_sample: false
    });
    cancelled(signal);
    const generated = output && output[0] && output[0].generated_text;
    let answer = Array.isArray(generated) ? String((generated[generated.length - 1] || {}).content || '') : String(generated || '');
    answer = answer.trim();
    if (!answer) throw new Error('The local model returned an empty answer.');
    return answer;
  }
  async function transcribe(samples, options = {}) {
    cancelled(options.signal);
    if (!(samples instanceof Float32Array) || !samples.length) throw new Error('No decoded audio samples were provided.');
    const model = await loadTranscriber(options.onStatus);
    cancelled(options.signal);
    const language = String(options.language || '').toLowerCase();
    const names = { hi: 'hindi', en: 'english', bn: 'bengali', ta: 'tamil', te: 'telugu', mr: 'marathi', gu: 'gujarati', pa: 'punjabi', ur: 'urdu' };
    const result = await model(samples, {
      chunk_length_s: 20, stride_length_s: 3,
      ...(names[language] ? { language: names[language], task: 'transcribe' } : {})
    });
    cancelled(options.signal);
    const text = String(result && result.text || '').trim();
    if (!text) throw new Error('Offline voice recognition returned no speech. Please try again.');
    return { text, backend: asrBackend };
  }
  window.NovaLocalAI = Object.freeze({
    generate, transcribe,
    getStatus: () => ({ loaded: !!generator, backend, voiceLoaded: !!transcriber, voiceBackend: asrBackend, model: MODEL, voiceModel: ASR_MODEL }),
    unload: () => { generator = null; pipelinePromise = null; transcriber = null; asrPromise = null; backend = 'not-loaded'; asrBackend = 'not-loaded'; }
  });
})();
