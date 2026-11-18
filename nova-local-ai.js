/* Browser-local Nova inference. No hosted AI provider or API key is used. */
(() => {
  'use strict';
  const MODEL = 'onnx-community/Qwen3-0.6B-Instruct-ONNX';
  let pipelinePromise = null;
  let generator = null;
  let backend = 'not-loaded';
  const status = (cb, message) => { try { cb && cb(message); } catch (_) {} };
  const cancelled = signal => { if (signal && signal.aborted) { const e = new Error('Request cancelled'); e.name = 'AbortError'; throw e; } };
  async function load(onStatus) {
    if (generator) return generator;
    if (pipelinePromise) return pipelinePromise;
    pipelinePromise = (async () => {
      status(onStatus, 'Loading local AI engine…');
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2');
      let gpuAvailable = false;
      try { gpuAvailable = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (_) {}
      if (gpuAvailable) {
        try {
          status(onStatus, 'Preparing local AI on this device (WebGPU)… model download is about 648 MB.');
          generator = await pipeline('text-generation', MODEL, {
            device: 'webgpu',
            dtype: 'q4f16',
            progress_callback: p => status(onStatus, p && p.status ? String(p.status) + (p.file ? ' · ' + p.file : '') : 'Downloading local model…')
          });
          backend = 'webgpu';
          return generator;
        } catch (gpuError) {
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
      generator = null;
      pipelinePromise = null;
      backend = 'not-loaded';
      throw error;
    });
    return pipelinePromise;
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
    const cleanMessages = normalizeMessages(messages);
    const output = await model(cleanMessages, {
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
  window.NovaLocalAI = Object.freeze({
    generate,
    getStatus: () => ({ loaded: !!generator, backend, model: MODEL }),
    unload: () => { generator = null; pipelinePromise = null; backend = 'not-loaded'; }
  });
})();
