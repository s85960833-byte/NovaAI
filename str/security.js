'use strict';

function sameOrigin(req) {
  const fetchSite = String(req.get('sec-fetch-site') || '').toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin') return false;
  const origin = req.get('origin');
  if (!origin) return req.method === 'GET';
  if (origin === 'null') return false;
  try {
    const parsed = new URL(origin);
    const expectedProtocol = req.protocol || 'http';
    const expectedHost = req.get('host');
    return parsed.origin === expectedProtocol + '://' + expectedHost;
  } catch {
    return false;
  }
}

function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = keys.slice().sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function validClientId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

function consumeWindow(store, key, now, limit, windowMs, maxKeys = 1000) {
  if (store.size >= maxKeys && !store.has(key)) {
    for (const [k, entry] of store) if (now - entry.start >= windowMs) store.delete(k);
    if (store.size >= maxKeys) return { allowed: false, capacity: true, remaining: 0 };
  }
  let entry = store.get(key);
  if (!entry || now - entry.start >= windowMs) {
    entry = { start: now, count: 0 };
    store.set(key, entry);
  }
  if (entry.count >= limit) return { allowed: false, capacity: false, remaining: 0 };
  entry.count += 1;
  return { allowed: true, capacity: false, remaining: limit - entry.count };
}

function plainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

module.exports = { sameOrigin, exactKeys, validClientId, consumeWindow, plainObject };
