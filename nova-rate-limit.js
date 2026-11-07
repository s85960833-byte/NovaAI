'use strict';

// Sliding-window counters for the Express API. The caller appends the current
// timestamp after this function returns. Expired IP buckets are pruned when
// the map reaches its cap so spoofed/churning addresses cannot grow memory
// without bound.
function rateWindow(store, key, now, windowMs, maxKeys = 10000) {
  if (!(store instanceof Map)) throw new TypeError('store must be a Map');
  const id = String(key ?? '');
  const timestamp = Number(now);
  const duration = Number(windowMs);
  const cap = Number(maxKeys);
  if (!id || !Number.isFinite(timestamp) || !Number.isFinite(duration) || duration <= 0 ||
      !Number.isInteger(cap) || cap < 1) {
    throw new TypeError('invalid rate-window arguments');
  }

  let hits = store.get(id);
  if (!Array.isArray(hits)) {
    hits = [];
  } else {
    const cutoff = timestamp - duration;
    let firstValid = 0;
    while (firstValid < hits.length && hits[firstValid] <= cutoff) firstValid += 1;
    if (firstValid) hits = hits.slice(firstValid);
  }

  if (!store.has(id) && store.size >= cap) {
    const cutoff = timestamp - duration;
    for (const [existingKey, existingHits] of store) {
      if (!Array.isArray(existingHits) || existingHits.length === 0 ||
          existingHits[existingHits.length - 1] <= cutoff) {
        store.delete(existingKey);
      }
    }
    // Never evict a live client's counter to make room for a new key: doing so
    // would let high-cardinality traffic repeatedly reset other clients' limits.
    if (store.size >= cap) return null;
  }

  store.set(id, hits);
  return hits;
}

module.exports = { rateWindow };
