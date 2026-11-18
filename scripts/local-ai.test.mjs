import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../nova-local-ai.js', import.meta.url), 'utf8')
  .replace(
    "await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2')",
    'await window.__NOVA_TEST_IMPORT__()'
  );

function harness({ gpu = true, failGpu = false } = {}) {
  const calls = [];
  const inputs = [];
  const statuses = [];
  let pipelineLoads = 0;
  const context = {
    window: {
      __NOVA_TEST_IMPORT__: async () => ({
        pipeline: async (task, model, options) => {
          pipelineLoads++;
          calls.push({ task, model, options });
          if (failGpu && options.device === 'webgpu') throw new Error('WebGPU unavailable');
          return async (messages, generationOptions) => {
            inputs.push(messages);
            return {
            0: {
              generated_text: [
                ...messages,
                { role: 'assistant', content: 'Nova local response' }
              ]
            }
          };
          };
        }
      })
    },
    navigator: {
      gpu: gpu ? { requestAdapter: async () => ({}) } : undefined,
      storage: { persist: async () => true }
    }
  };
  vm.runInNewContext(source, context, { filename: 'nova-local-ai.js' });
  return { api: context.window.NovaLocalAI, calls, inputs, statuses, get pipelineLoads() { return pipelineLoads; } };
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
  assert.equal(h.calls[0].options.device, 'webgpu');
  assert.equal(h.calls[0].options.dtype, 'q4f16');
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

test('converts image messages to an honest text-only limitation notice', async () => {
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
  assert.match(h.inputs[0][0].content, /cannot inspect image pixels/i);
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
