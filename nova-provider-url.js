'use strict';

function secureProviderBase(name, raw, fallback, allowLocal = process.env.NODE_ENV !== 'production') {
  const value = String(raw || fallback || '').trim();
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(name + ' must be an absolute URL');
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  const localHttp = allowLocal && parsed.protocol === 'http:' && localHosts.has(parsed.hostname);
  if (parsed.protocol !== 'https:' && !localHttp) {
    throw new TypeError(name + ' must use HTTPS (HTTP is allowed only for local development)');
  }
  if (parsed.username || parsed.password) {
    throw new TypeError(name + ' must not contain URL credentials');
  }
  if (parsed.search || parsed.hash) {
    throw new TypeError(name + ' must not contain a query string or fragment');
  }
  if (!parsed.hostname) throw new TypeError(name + ' must include a hostname');

  return parsed.href.replace(/\\/+$/, '');
}

module.exports = { secureProviderBase };
