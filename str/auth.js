'use strict';

const SUPABASE_URL = process.env.NOVA_SUPABASE_URL || 'https://qrfwsewppafhxibdboam.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.NOVA_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uprqEe5o0URtEDZGN0ji2w_LiDiMJQ';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOwnerIds(value) {
  const entries = String(value || '').split(',').map(item => item.trim()).filter(Boolean);
  const ids = entries.filter(item => UUID_RE.test(item)).map(item => item.toLowerCase());
  return { ids: new Set(ids), invalid: ids.length !== entries.length };
}

function createOwnerGuard(options = {}) {
  const ownerConfig = options.ownerIds instanceof Set
    ? { ids: options.ownerIds, invalid: false }
    : options.ownerIds
      ? { ids: new Set(options.ownerIds.map(id => String(id).toLowerCase()).filter(id => UUID_RE.test(id))), invalid: options.ownerIds.some(id => !UUID_RE.test(String(id))) }
      : parseOwnerIds(process.env.STR_OWNER_USER_IDS);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const projectUrl = options.projectUrl || SUPABASE_URL;
  const publishableKey = options.publishableKey || SUPABASE_PUBLISHABLE_KEY;

  return async function requireStrOwner(req, res, next) {
    const authorization = String(req.get('authorization') || '');
    const match = authorization.match(/^Bearer ([A-Za-z0-9._~+/-]+=*)$/);
    if (!match || match[1].length < 30 || match[1].length > 8192) {
      return res.status(401).json({
        error: 'Sign in to your NOVA account to access STR.',
        code: 'STR_AUTH_REQUIRED'
      });
    }
    if (ownerConfig.invalid || ownerConfig.ids.size === 0) {
      return res.status(503).json({
        error: 'STR owner access has not been configured. Access remains blocked.',
        code: 'STR_OWNER_GATE_NOT_CONFIGURED'
      });
    }
    if (typeof fetchImpl !== 'function' || !/^https:\/\//i.test(projectUrl) ||
        !/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(publishableKey)) {
      return res.status(503).json({
        error: 'STR account verification is unavailable. Access remains blocked.',
        code: 'STR_AUTH_UNAVAILABLE'
      });
    }

    try {
      const endpoint = new URL('/auth/v1/user', projectUrl);
      const response = await fetchImpl(endpoint, {
        method: 'GET',
        headers: {
          apikey: publishableKey,
          Authorization: 'Bearer ' + match[1],
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(5000),
        cache: 'no-store'
      });
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({
          error: 'Your NOVA sign-in has expired. Sign in again to access STR.',
          code: 'STR_SESSION_INVALID'
        });
      }
      if (!response.ok) {
        return res.status(503).json({
          error: 'NOVA account verification is temporarily unavailable. Access remains blocked.',
          code: 'STR_AUTH_UNAVAILABLE'
        });
      }
      const user = await response.json();
      const userId = String(user && user.id || '').toLowerCase();
      if (!UUID_RE.test(userId)) {
        return res.status(401).json({
          error: 'NOVA did not return a valid signed-in account. Sign in again.',
          code: 'STR_SESSION_INVALID'
        });
      }
      if (!ownerConfig.ids.has(userId)) {
        return res.status(403).json({
          error: 'This NOVA account is not authorized for STR owner access.',
          code: 'STR_OWNER_NOT_ALLOWED'
        });
      }
      req.strOwner = Object.freeze({ id: userId });
      return next();
    } catch {
      return res.status(503).json({
        error: 'NOVA account verification timed out or failed. Access remains blocked.',
        code: 'STR_AUTH_UNAVAILABLE'
      });
    }
  };
}

module.exports = { createOwnerGuard, parseOwnerIds, UUID_RE };
