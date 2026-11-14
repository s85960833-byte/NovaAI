'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildChatProviders,
  createCircuitRegistry,
  normalizeBase,
  readResponseTextSafely,
  runWithFailover
} = require('../nova-llm-router');

const response = (status = 200, headers = {}) => new Response(status === 200 ? 'ok' : 'provider error', { status, headers });

test('provider chain deduplicates companies by hostname and preserves model order', () => {
  const providers = buildChatProviders({
    LLM_KEY: 'key-a',
    LLM_MODEL: 'model-a',
    LLM_FALLBACK_MODELS: 'model-b, model-c, model-b',
    LLM_BASE: 'https://openrouter.ai/api/v1',
    GROQ_API_KEY: 'key-b',
    GROQ_MODEL: 'groq-model',
    OPENROUTER_API_KEY: 'second-openrouter-key',
    OPENROUTER_MODEL: 'openrouter/free'
  }, {
    bases: {
      primary: 'https://openrouter.ai/api/v1',
      groq: 'https://api.groq.com/openai/v1',
      openrouter: 'https://openrouter.ai/api/v1'
    }
  });

  assert.equal(providers.length, 2);
  assert.deepEqual(providers[0].models, ['model-a', 'model-b', 'model-c']);
  assert.deepEqual(providers.map(x => x.host), ['openrouter.ai', 'api.groq.com']);
});

test('vision chain includes only explicitly configured vision models', () => {
  const providers = buildChatProviders({
    LLM_KEY: 'key-a',
    LLM_MODEL: 'chat-model',
    GROQ_API_KEY: 'key-b',
    GROQ_MODEL: 'chat-model-b',
    GROQ_VISION_MODEL: 'vision-b',
    OPENROUTER_API_KEY: 'key-c'
  }, {
    vision: true,
    defaultVisionModel: 'vision-a',
    bases: {
      primary: 'https://api.primary.example/v1',
      groq: 'https://api.groq.com/openai/v1',
      openrouter: 'https://openrouter.ai/api/v1'
    }
  });

  assert.deepEqual(providers.map(x => x.models), [['vision-a'], ['vision-b']]);
});

test('Cloudflare Workers AI is added only with a valid account, token and explicit model', () => {
  const providers = buildChatProviders({
    CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    CLOUDFLARE_API_TOKEN: 'test-token',
    CLOUDFLARE_MODEL: '@cf/google/gemma-4-26b-a4b-it'
  });
  assert.equal(providers.length, 1);
  assert.equal(providers[0].id, 'cloudflare-workers-ai');
  assert.equal(providers[0].host, 'api.cloudflare.com');
  assert.deepEqual(providers[0].models, ['@cf/google/gemma-4-26b-a4b-it']);
  assert.equal(providers[0].key, 'test-token');
});

test('Cloudflare Workers AI is excluded without credentials, a valid account id or an explicit model', () => {
  assert.equal(buildChatProviders({
    CLOUDFLARE_ACCOUNT_ID: 'not-an-account-id',
    CLOUDFLARE_API_TOKEN: 'test-token',
    CLOUDFLARE_MODEL: '@cf/model'
  }).length, 0);
  assert.equal(buildChatProviders({
    CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    CLOUDFLARE_API_TOKEN: 'test-token'
  }).length, 0);
  assert.equal(buildChatProviders({
    CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    CLOUDFLARE_MODEL: '@cf/model'
  }).length, 0);
});

test('Cloudflare vision fallback requires an explicit vision model and can be disabled per task', () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
    CLOUDFLARE_API_TOKEN: 'test-token',
    CLOUDFLARE_MODEL: '@cf/chat-model',
    CLOUDFLARE_VISION_MODEL: '@cf/vision-model'
  };
  assert.deepEqual(buildChatProviders(env, { vision: true }).map(p => p.models), [['@cf/vision-model']]);
  assert.equal(buildChatProviders(env, { allowCloudflare: false }).length, 0);
  assert.equal(buildChatProviders(env, { vision: true, allowCloudflare: false }).length, 0);
});

test('provider bases must use HTTPS and must not contain credentials or query data', () => {
  assert.equal(normalizeBase('https://api.example.com/v1/'), 'https://api.example.com/v1');
  for (const url of [
    'http://api.example.com',
    'https://user:pass@api.example.com',
    'https://api.example.com/v1?key=secret',
    'https://api.example.com/v1#fragment'
  ]) assert.throws(() => normalizeBase(url));
});

test('a timeout/network exception on one provider falls through with a fresh timeout signal', async () => {
  const calls = [];
  const providers = [
    { id: 'primary', host: 'primary.example', base: 'https://primary.example/v1', key: 'a', models: ['a1'] },
    { id: 'fallback', host: 'fallback.example', base: 'https://fallback.example/v1', key: 'b', models: ['b1'] }
  ];
  const circuit = createCircuitRegistry({ failureThreshold: 2 });
  const result = await runWithFailover({
    providers,
    timeoutMs: 3000,
    circuit,
    request: async (provider, model, signal) => {
      calls.push({ provider: provider.id, signal });
      if (provider.id === 'primary') throw new Error('upstream timeout');
      return response();
    }
  });

  assert.equal(result.provider, 'fallback');
  assert.equal(calls.length, 2);
  assert.notEqual(calls[0].signal, calls[1].signal);
  assert.equal(calls[1].signal.aborted, false);
  assert.equal(result.failures.length, 1);
});

test('an actual AbortSignal.timeout expiry falls through to the next provider', async () => {
  const calls = [];
  const providers = [
    { id: 'slow', base: 'https://slow.example/v1', key: 'a', models: ['slow-model'] },
    { id: 'healthy', base: 'https://healthy.example/v1', key: 'b', models: ['healthy-model'] }
  ];
  // AbortSignal.timeout() uses an unreferenced timer in Node; keep this test
  // process alive long enough for the real timeout signal to fire.
  const keepAlive = setTimeout(() => {}, 1500);
  try {
    const result = await runWithFailover({
      providers,
      timeoutMs: 1000,
      circuit: createCircuitRegistry(),
      request: async (provider, model, signal) => {
        calls.push(provider.id);
        if (provider.id === 'slow') {
          await new Promise((resolve, reject) => {
            const onAbort = () => reject(signal.reason || new Error('provider request timed out'));
            if (signal.aborted) return onAbort();
            signal.addEventListener('abort', onAbort, { once: true });
          });
        }
        return response();
      }
    });

    assert.deepEqual(calls, ['slow', 'healthy']);
    assert.equal(result.provider, 'healthy');
    assert.equal(result.failures.length, 1);
    assert.match(result.failures[0].error, /timed out|timeout/i);
  } finally {
    clearTimeout(keepAlive);
  }
});

test('HTTP 429 opens the provider circuit and routes immediately to the next company', async () => {
  const circuit = createCircuitRegistry();
  let primaryCalls = 0;
  const providers = [
    { id: 'primary', base: 'https://primary.example/v1', key: 'a', models: ['a1'] },
    { id: 'fallback', base: 'https://fallback.example/v1', key: 'b', models: ['b1'] }
  ];
  const result = await runWithFailover({
    providers,
    circuit,
    request: async provider => {
      if (provider.id === 'primary') {
        primaryCalls += 1;
        return response(429, { 'retry-after': '60' });
      }
      return response();
    }
  });

  assert.equal(result.provider, 'fallback');
  assert.equal(primaryCalls, 1);
  assert.equal(circuit.isOpen('primary'), true);
});

test('a request can retry a provider after a correctable response, then succeed', async () => {
  let attempts = 0;
  const providers = [{ id: 'primary', base: 'https://primary.example/v1', key: 'a', models: ['a1'] }];
  const result = await runWithFailover({
    providers,
    circuit: createCircuitRegistry(),
    request: async () => (++attempts === 1 ? response(400) : response()),
    onResponse: async () => 'retry'
  });

  assert.equal(result.provider, 'primary');
  assert.equal(attempts, 2);
});

test('caller cancellation stops the chain instead of spending on another provider', async () => {
  const controller = new AbortController();
  const calls = [];
  const providers = [
    { id: 'primary', base: 'https://primary.example/v1', key: 'a', models: ['a1'] },
    { id: 'fallback', base: 'https://fallback.example/v1', key: 'b', models: ['b1'] }
  ];

  await assert.rejects(runWithFailover({
    providers,
    clientSignal: controller.signal,
    circuit: createCircuitRegistry(),
    request: async provider => {
      calls.push(provider.id);
      controller.abort(new Error('client left'));
      throw new Error('aborted');
    }
  }), /client left/);
  assert.deepEqual(calls, ['primary']);
});

test('provider circuit recovers after its cooldown expires', () => {
  const circuit = createCircuitRegistry({ cooldownMs: 1000 });
  circuit.recordFailure('p', { status: 503, now: 1000 });
  circuit.recordFailure('p', { status: 503, now: 1001 });
  assert.equal(circuit.isOpen('p', 1500), true);
  assert.equal(circuit.isOpen('p', 2001), false);
});


test('an oversized or malformed provider error body cannot block failover', async () => {
  const text = await readResponseTextSafely({}, async () => {
    throw new Error('response too large');
  }, 8);
  assert.match(text, /provider error body omitted/);
});
