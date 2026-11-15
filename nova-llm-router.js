'use strict';

const PROVIDER_FAILURE_STATUSES = new Set([401, 402, 403, 408, 409, 425, 429, 500, 502, 503, 504]);

function normalizeBase(base) {
  const url = new URL(String(base || ''));
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('AI provider base must be a public HTTPS URL without credentials or query parameters');
  }
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.origin + url.pathname;
}

function buildChatProviders(env = {}, options = {}) {
  const vision = options.vision === true;
  const bases = options.bases || {};
  const providers = [];
  const seenHosts = new Set();

  function add(id, base, key, models) {
    if (typeof key !== 'string' || !key.trim() || !base) return;
    const normalizedBase = normalizeBase(base);
    const host = new URL(normalizedBase).hostname.toLowerCase();
    if (seenHosts.has(host)) return; // Never rotate multiple credentials for one provider company.
    const uniqueModels = [...new Set((models || []).map(x => String(x || '').trim()).filter(Boolean))];
    if (!uniqueModels.length) return;
    seenHosts.add(host);
    providers.push({ id, host, base: normalizedBase, key: key.trim(), models: uniqueModels });
  }

  if (env.LLM_KEY && env.LLM_MODEL) {
    const models = vision
      ? [env.LLM_VISION_MODEL || options.defaultVisionModel]
      : [env.LLM_MODEL, ...String(env.LLM_FALLBACK_MODELS || '').split(',')];
    add('primary', bases.primary || env.LLM_BASE, env.LLM_KEY, models);
  }

  if (env.GROQ_API_KEY && env.GROQ_MODEL) {
    add(
      'groq',
      bases.groq || env.GROQ_BASE || 'https://api.groq.com/openai/v1',
      env.GROQ_API_KEY,
      vision ? [env.GROQ_VISION_MODEL] : [env.GROQ_MODEL]
    );
  }

  if (env.OPENROUTER_API_KEY) {
    add(
      'openrouter',
      bases.openrouter || env.OPENROUTER_BASE || 'https://openrouter.ai/api/v1',
      env.OPENROUTER_API_KEY,
      vision ? [env.OPENROUTER_VISION_MODEL] : [env.OPENROUTER_MODEL || 'openrouter/free']
    );
  }

  // Cloudflare Workers AI is an optional fourth company-level fallback.
  // It is not used for code or research until task-specific quality is benchmarked.
  const cloudflareAccountId = String(env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (env.NOVA_ALLOW_CLOUDFLARE === '1' && options.allowCloudflare !== false &&
      /^[a-f0-9]{32}$/i.test(cloudflareAccountId) &&
      typeof env.CLOUDFLARE_API_TOKEN === 'string' &&
      env.CLOUDFLARE_API_TOKEN.trim()) {
    add(
      'cloudflare-workers-ai',
      bases.cloudflare || `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/v1`,
      env.CLOUDFLARE_API_TOKEN,
      vision ? [env.CLOUDFLARE_VISION_MODEL] : [env.CLOUDFLARE_MODEL]
    );
  }

  return providers;
}

async function readResponseTextSafely(response, reader, maxBytes = 1024 * 1024) {
  if (typeof reader !== 'function') throw new TypeError('response reader callback is required');
  try {
    return await reader(response, maxBytes);
  } catch {
    // Oversized/malformed error bodies must not prevent trying the next provider.
    return '[provider error body omitted: unreadable or over the size limit]';
  }
}

function parseRetryAfterMs(response) {
  const raw = response && response.headers && response.headers.get('retry-after');
  if (!raw) return 30000;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(5 * 60 * 1000, seconds * 1000);
  const date = Date.parse(raw);
  return Number.isFinite(date) ? Math.max(1000, Math.min(5 * 60 * 1000, date - Date.now())) : 30000;
}

function calculateRetryDelayMs(retryIndex, options = {}) {
  const baseRaw = Number(options.retryBaseDelayMs);
  const capRaw = Number(options.retryMaxDelayMs);
  const base = Number.isFinite(baseRaw) ? Math.max(0, Math.min(5000, baseRaw)) : 250;
  const cap = Number.isFinite(capRaw) ? Math.max(base, Math.min(10000, capRaw)) : 2000;
  const exponent = Math.max(0, Math.min(10, Math.floor(Number(retryIndex) || 0)));
  const exponential = Math.min(cap, base * (2 ** exponent));
  const randomSource = typeof options.random === 'function' ? options.random : Math.random;
  const sample = Number(randomSource());
  const jitter = Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0.5;
  return Math.min(cap, Math.max(0, Math.round(exponential * (0.5 + jitter))));
}

async function waitForRetry(ms, signal, customSleep) {
  if (signal && signal.aborted) {
    throw signal.reason || new Error('client request aborted');
  }
  if (ms > 0) {
    if (typeof customSleep === 'function') {
      await customSleep(ms, signal);
    } else {
      await new Promise((resolve, reject) => {
        let timer;
        const cleanup = () => {
          if (signal) signal.removeEventListener('abort', onAbort);
          if (timer) clearTimeout(timer);
        };
        const onAbort = () => {
          cleanup();
          reject((signal && signal.reason) || new Error('client request aborted'));
        };
        const onDone = () => {
          cleanup();
          resolve();
        };
        timer = setTimeout(onDone, ms);
        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
          if (signal.aborted) onAbort();
        }
      });
    }
  }
  if (signal && signal.aborted) {
    throw signal.reason || new Error('client request aborted');
  }
}

function createCircuitRegistry(options = {}) {
  const states = new Map();
  const threshold = Math.max(1, Number(options.failureThreshold) || 2);
  const cooldownMs = Math.max(1000, Number(options.cooldownMs) || 45000);
  const authCooldownMs = Math.max(60000, Number(options.authCooldownMs) || 15 * 60 * 1000);

  return {
    isOpen(key, now = Date.now()) {
      const state = states.get(String(key));
      if (!state || state.openUntil <= now) {
        if (state) states.delete(String(key));
        return false;
      }
      return true;
    },
    recordSuccess(key) {
      states.delete(String(key));
    },
    recordFailure(key, details = {}) {
      const id = String(key);
      const now = Number(details.now) || Date.now();
      const status = Number(details.status) || 0;
      const previous = states.get(id) || { failures: 0, openUntil: 0 };
      const failures = previous.failures + 1;
      let waitMs = 0;

      if (status === 429) waitMs = Math.max(1000, Math.min(5 * 60 * 1000, Number(details.retryAfterMs) || 30000));
      else if ([401, 402, 403].includes(status)) waitMs = authCooldownMs;
      else if (failures >= threshold) waitMs = cooldownMs;

      states.set(id, { failures, openUntil: waitMs ? now + waitMs : previous.openUntil });
    },
    snapshot() {
      return [...states.entries()].map(([id, state]) => ({ id, ...state }));
    }
  };
}

const defaultCircuit = createCircuitRegistry();

async function runWithFailover(options = {}) {
  const providers = Array.isArray(options.providers) ? options.providers : [];
  if (typeof options.request !== 'function') throw new TypeError('request callback is required');

  const timeoutMs = Math.max(1000, Math.min(120000, Number(options.timeoutMs) || 90000));
  const clientSignal = options.clientSignal;
  const maxAttemptsRaw = Number(options.maxAttempts);
  const maxAttempts = Number.isFinite(maxAttemptsRaw) ? Math.max(1, Math.min(5, Math.floor(maxAttemptsRaw))) : 3;
  const circuit = options.circuit || defaultCircuit;
  const failures = [];

  for (const provider of providers) {
    const providerKey = provider.id || provider.host || provider.base;
    if (circuit.isOpen(providerKey)) {
      failures.push({ provider: providerKey, error: 'circuit open' });
      continue;
    }

    let providerUnavailable = false;
    for (const model of provider.models || []) {
      for (let retryIndex = 0; retryIndex < maxAttempts; retryIndex += 1) {
        if (clientSignal && clientSignal.aborted) {
          throw clientSignal.reason || new Error('client request aborted');
        }

        const timeoutSignal = AbortSignal.timeout(timeoutMs);
        const signal = clientSignal ? AbortSignal.any([timeoutSignal, clientSignal]) : timeoutSignal;
        let response;

        try {
          response = await options.request(provider, model, signal, retryIndex);
        } catch (error) {
          if (clientSignal && clientSignal.aborted) throw (clientSignal.reason || error);
          failures.push({
            provider: providerKey,
            model,
            error: String(error && error.message || error).slice(0, 120)
          });
          circuit.recordFailure(providerKey, { status: 0 });
          providerUnavailable = true;
          break;
        }

        if (response && response.ok) {
          circuit.recordSuccess(providerKey);
          return { response, provider: providerKey, model, failures };
        }

        let decision = 'next-provider';
        if (typeof options.onResponse === 'function') {
          decision = await options.onResponse(response, { provider, model, retryIndex });
        }

        if (decision === 'retry') {
          if (retryIndex + 1 < maxAttempts) {
            const delayMs = calculateRetryDelayMs(retryIndex, options);
            await waitForRetry(delayMs, clientSignal, options.sleep);
            continue;
          }
          // A retry decision at the attempt limit becomes a normal failover event.
          decision = 'next-provider';
        }

        const status = Number(response && response.status) || 0;
        failures.push({ provider: providerKey, model, status });
        if (PROVIDER_FAILURE_STATUSES.has(status)) {
          circuit.recordFailure(providerKey, {
            status,
            retryAfterMs: parseRetryAfterMs(response)
          });
        }

        if (decision === 'next-model' || (status === 400 || status === 404)) break;
        providerUnavailable = true;
        break;
      }
      if (providerUnavailable) break;
    }
  }

  return { response: null, provider: null, model: null, failures };
}

module.exports = {
  buildChatProviders,
  calculateRetryDelayMs,
  createCircuitRegistry,
  normalizeBase,
  readResponseTextSafely,
  runWithFailover
};
