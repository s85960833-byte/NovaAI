import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../nova-local-ai.js', import.meta.url), 'utf8')
  .replace(
    "import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2')",
    'window.__NOVA_TEST_IMPORT__()'
  )
  .replace(
    "import('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/+esm')",
    'window.__NOVA_TEST_OCR_IMPORT__()'
  );

function harness({ gpu = true, failGpu = false } = {}) {
  const calls = [];
  const inputs = [];
  const statuses = [];
  const ocrCalls = [];
  let pipelineLoads = 0;
  const context = {
    window: {
      __NOVA_TEST_IMPORT__: async () => ({
        pipeline: async (task, model, options) => {
          pipelineLoads++;
          calls.push({ task, model, options });
          if (failGpu && options.device === 'webgpu') throw new Error('WebGPU unavailable');
          if (task === 'automatic-speech-recognition') {
            return async (samples, generationOptions) => {
              inputs.push({ samples, generationOptions });
              return { text: 'नमस्ते, यह ऑफलाइन आवाज़ परीक्षण है।' };
            };
          }
          return async (messages, generationOptions) => {
            inputs.push(messages);
            return { 0: { generated_text: [...messages, { role: 'assistant', content: 'Nova local response' }] } };
          };
        }
      }),
      __NOVA_TEST_OCR_IMPORT__: async () => ({
        createWorker: async (languages, oem, options) => ({
          recognize: async image => {
            ocrCalls.push({ languages, oem, image });
            if (options && options.logger) options.logger({ status: 'recognizing text', progress: 1 });
            return { data: { text: 'The photographed question says: What is 2 + 2?' } };
          }
        })
      })
    },
    navigator: {
      gpu: gpu ? { requestAdapter: async () => ({}) } : undefined,
      storage: { persist: async () => true }
    },
    Float32Array
  };
  vm.runInNewContext(source, context, { filename: 'nova-local-ai.js' });
  return { api: context.window.NovaLocalAI, calls, inputs, statuses, ocrCalls, get pipelineLoads() { return pipelineLoads; } };
}

test('uses WebGPU Q4F16 when available and returns generated assistant text', async () => {
  const h = harness();
  const answer = await h.api.generate([
    { role: 'system', content: 'Be accurate' },
    { role: 'user', content: 'Hello Nova' }
  ], { onStatus: message => h.statuses.push(message) });
  assert.equal(answer, 'Nova local response');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].task, 'text-generation');
  assert.match(h.inputs[0][0].content, /Your developer is Thakur Shreyansh Singh ji/);
  assert.match(h.inputs[0][0].content, /Respond in the user's language/);
  assert.equal(h.calls[0].options.device, 'webgpu');
  assert.equal(h.calls[0].options.dtype, 'q4f16');
  assert.match(h.calls[0].options.chat_template, /<\\|im_start\\|>/, 'Qwen3 generation must provide the model chat template explicitly');
  assert.equal(h.calls[0].options.tokenizer_encode_kwargs.enable_thinking, false, 'Qwen3 must use concise non-thinking responses on device');
  assert.equal(h.calls[0].options.do_sample, true, 'Qwen3 should not use greedy decoding by default');
  assert.equal(h.api.getStatus().backend, 'webgpu');
});

test('falls back to CPU/WASM Q4 when WebGPU initialization fails', async () => {
  const h = harness({ failGpu: true });
  const answer = await h.api.generate([{ role: 'user', content: 'Test fallback' }]);
  assert.equal(answer, 'Nova local response');
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].options.dtype, 'q4');
  assert.equal(h.calls[1].options.device, undefined);
  assert.equal(h.api.getStatus().backend, 'wasm');
});

test('uses CPU/WASM directly when WebGPU is unavailable', async () => {
  const h = harness({ gpu: false });
  await h.api.generate([{ role: 'user', content: 'CPU path' }]);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.dtype, 'q4');
  assert.equal(h.api.getStatus().backend, 'wasm');
});

test('extracts Hindi/English photo text locally before asking the text-only chat model', async () => {
  const h = harness();
  await h.api.generate([{
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this picture?' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }
    ]
  }]);
  const result = await h.api.generate([{ role: 'user', content: 'Follow up' }]);
  assert.equal(result, 'Nova local response');
  assert.equal(h.pipelineLoads, 1);
  assert.match(h.inputs.flat().map(item => item && item.content || '').join('\\n'), /Local OCR text from the attached photo/i);
  assert.match(h.inputs.flat().map(item => item && item.content || '').join('\n'), /What is 2 \+ 2/);
  assert.equal(h.ocrCalls.length, 1);
  assert.equal(h.ocrCalls[0].languages, 'eng+hin');
});

test('rejects an already-aborted request before loading the model', async () => {
  const h = harness();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    h.api.generate([{ role: 'user', content: 'Cancel' }], { signal: controller.signal }),
    error => error && error.name === 'AbortError'
  );
  assert.equal(h.pipelineLoads, 0);
});

test('loads multilingual Whisper locally and transcribes decoded audio samples', async () => {
  const h = harness();
  const result = await h.api.transcribe(new Float32Array(16000), { language: 'hi' });
  assert.equal(result.text, 'नमस्ते, यह ऑफलाइन आवाज़ परीक्षण है।');
  assert.equal(result.backend, 'webgpu');
  assert.equal(h.calls[0].task, 'automatic-speech-recognition');
  assert.equal(h.calls[0].model, 'onnx-community/whisper-tiny');
  assert.equal(h.calls[0].options.device, 'webgpu');
  assert.equal(h.calls[0].options.dtype, 'q4f16');
  assert.equal(h.inputs[0].samples.length, 16000);
  assert.equal(h.inputs[0].generationOptions.language, 'hindi');
});

test('offline Whisper falls back to CPU/WASM when WebGPU is unavailable', async () => {
  const h = harness({ gpu: false });
  const result = await h.api.transcribe(new Float32Array(8000), { language: 'en' });
  assert.equal(result.backend, 'wasm');
  assert.equal(h.calls[0].task, 'automatic-speech-recognition');
  assert.equal(h.calls[0].options.dtype, 'q4');
});
