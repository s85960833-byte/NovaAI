'use strict';

// Run provider attempts in order. A successful result stops the chain immediately,
// preventing concurrent duplicate paid requests and keeping failover cost predictable.
async function firstSuccessful(providers) {
  const failures = [];
  for (const provider of providers || []) {
    if (!provider || typeof provider.run !== 'function') {
      failures.push({ provider: String(provider && provider.name || 'unknown'), error: 'invalid provider runner' });
      continue;
    }
    try {
      const value = await provider.run();
      const usable = typeof provider.isUsable === 'function'
        ? provider.isUsable(value)
        : !!(value && Array.isArray(value.items) && value.items.length > 0);
      if (!usable) throw new Error('provider returned no usable results');
      return { value, provider: provider.name || 'unnamed', failures };
    } catch (error) {
      failures.push({
        provider: String(provider.name || 'unnamed'),
        error: String(error && error.message || error).slice(0, 100)
      });
    }
  }
  return { value: null, provider: null, failures };
}

module.exports = { firstSuccessful };
