'use strict';

function normalizeSupabaseAuthUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('SUPABASE_URL is required when NOVA_API_AUTH_REQUIRED=1');
  }
  let url;
  try { url = new URL(value); } catch { throw new Error('SUPABASE_URL must be a valid HTTPS project URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    throw new Error('SUPABASE_URL must be an HTTPS project origin without credentials, path, query or fragment');
  }
  return url.origin + '/auth/v1/user';
}

async function readBoundedAuthUser(response, maxBytes = 64 * 1024) {
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) throw new Error('Supabase Auth response exceeded the size limit');
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      try { await reader.cancel(); } catch {}
      throw error;
    }
    return JSON.parse(text);
  }

  // The fallback supports minimal test doubles; real Node fetch responses use the
  // bounded streaming branch above.
  if (typeof response.text === 'function') {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('Supabase Auth response exceeded the size limit');
    return JSON.parse(text);
  }
  const user = await response.json();
  if (new TextEncoder().encode(JSON.stringify(user)).byteLength > maxBytes) throw new Error('Supabase Auth response exceeded the size limit');
  return user;
}

function createSupabaseUserMiddleware({ supabaseUrl, publishableKey, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const authUserUrl = normalizeSupabaseAuthUrl(supabaseUrl);
  if (typeof publishableKey !== 'string' || !publishableKey.trim()) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY is required when NOVA_API_AUTH_REQUIRED=1');
  }
  if (typeof fetchImpl !== 'function') throw new Error('A server-side fetch implementation is required');

  return async function requireSupabaseUser(req, res, next) {
    const header = typeof req.get === 'function' ? req.get('authorization') : req.headers?.authorization;
    const match = typeof header === 'string' && /^Bearer\s+(\S+)$/i.exec(header);
    if (!match || match[1].length > 8192) {
      return res.status(401).json({ error: 'Sign in is required to use this service.' });
    }

    try {
      const response = await fetchImpl(authUserUrl, {
        method: 'GET',
        redirect: 'error',
        headers: {
          apikey: publishableKey,
          Authorization: 'Bearer ' + match[1],
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
      }
      if (!response.ok) {
        return res.status(503).json({ error: 'Account verification is temporarily unavailable. Please retry.' });
      }
      const user = await readBoundedAuthUser(response);
      if (!user || typeof user.id !== 'string' || !user.id.trim()) {
        return res.status(401).json({ error: 'A valid signed-in account is required.' });
      }
      req.novaUser = {
        id: user.id,
        email: typeof user.email === 'string' ? user.email : null
      };
      return next();
    } catch {
      return res.status(503).json({ error: 'Account verification is temporarily unavailable. Please retry.' });
    }
  };
}

module.exports = { createSupabaseUserMiddleware, normalizeSupabaseAuthUrl };
