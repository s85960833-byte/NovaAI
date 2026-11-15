'use strict';

function normalizeSupabaseOrigin(value) {
  let url;
  try { url = new URL(String(value || '')); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) return null;
  return url.origin;
}

function currentPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

function estimateInputTokens(messages) {
  let bytes = 0;
  try { bytes = Buffer.byteLength(JSON.stringify(Array.isArray(messages) ? messages : []), 'utf8'); }
  catch { return 0; }
  return Math.max(0, Math.ceil(bytes / 4));
}

function createUsageQuota(options = {}) {
  const enabled = options.enabled === true;
  const origin = normalizeSupabaseOrigin(options.supabaseUrl);
  const key = typeof options.serviceRoleKey === 'string' ? options.serviceRoleKey.trim() : '';
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const plans = options.plans || {};
  const clock = typeof options.now === 'function' ? options.now : () => new Date();

  async function request(path, init) {
    if (!origin || !key || typeof fetchImpl !== 'function') throw new Error('Usage ledger configuration unavailable');
    const response = await fetchImpl(new URL(path, origin), {
      ...init,
      redirect: 'error',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        Accept: 'application/json',
        ...(init && init.headers || {})
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Usage ledger request failed');
    return response;
  }

  async function reserve(input = {}) {
    if (!enabled) return { ok: false, reason: 'quota_not_enabled' };
    const userId = typeof input.userId === 'string' ? input.userId : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return { ok: false, reason: 'authenticated_user_required' };
    }

    try {
      const entitlementUrl = new URL('/rest/v1/nova_user_entitlements', origin);
      entitlementUrl.searchParams.set('select', 'plan');
      entitlementUrl.searchParams.set('user_id', 'eq.' + userId);
      const entitlementResponse = await request(entitlementUrl.pathname + entitlementUrl.search, { method: 'GET' });
      const rows = await entitlementResponse.json();
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('Invalid entitlement response');
      const planId = rows.length ? String(rows[0].plan || '') : 'free';
      const plan = plans[planId];
      const limit = plan && plan.monthlyCredits;
      if (!Number.isSafeInteger(limit) || limit < 1) return { ok: false, reason: 'plan_not_configured' };

      const reservationId = typeof input.reservationId === 'string' && input.reservationId
        ? input.reservationId : require('node:crypto').randomUUID();
      const payload = {
        p_user_id: userId,
        p_period: currentPeriod(clock()),
        p_plan: planId,
        p_limit: limit,
        p_mode: ['quick', 'standard', 'detailed'].includes(input.mode) ? input.mode : 'standard',
        p_provider: String(input.provider || 'unknown').slice(0, 80),
        p_input_tokens: Math.max(0, Math.trunc(Number(input.inputTokens) || 0)),
        p_output_tokens: 0,
        p_reservation_id: reservationId
      };
      const rpc = await request('/rest/v1/rpc/nova_reserve_usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const accepted = await rpc.json();
      if (accepted === true) return { ok: true, plan: planId, period: payload.p_period, reservationId };
      if (accepted === false) return { ok: false, reason: 'quota_exceeded' };
      throw new Error('Usage reservation returned an invalid result');
    } catch {
      return { ok: false, reason: 'quota_ledger_unavailable' };
    }
  }

  async function settle(input = {}) {
    if (!enabled) return { ok: false, reason: 'quota_not_enabled' };
    const userId = typeof input.userId === 'string' ? input.userId : '';
    const reservationId = typeof input.reservationId === 'string' ? input.reservationId : '';
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(userId) || !uuid.test(reservationId)) return { ok: false, reason: 'invalid_reservation' };
    const status = input.status === 'provider_failed' ? 'provider_failed' : input.status === 'completed' ? 'completed' : '';
    if (!status) return { ok: false, reason: 'invalid_settlement_status' };
    const outputTokens = input.outputTokens == null ? null : Number(input.outputTokens);
    if (outputTokens !== null && (!Number.isSafeInteger(outputTokens) || outputTokens < 0 || outputTokens > 2147483647)) {
      return { ok: false, reason: 'invalid_output_tokens' };
    }
    try {
      const response = await request('/rest/v1/rpc/nova_settle_usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_user_id: userId, p_reservation_id: reservationId, p_output_tokens: outputTokens, p_status: status })
      });
      const settled = await response.json();
      if (settled === true) return { ok: true, usageKnown: outputTokens !== null };
      if (settled === false) return { ok: false, reason: 'usage_reservation_not_found' };
      throw new Error('Usage settlement returned an invalid result');
    } catch { return { ok: false, reason: 'quota_ledger_unavailable' }; }
  }
  return Object.freeze({ reserve, settle });
}

module.exports = { createUsageQuota, currentPeriod, estimateInputTokens, normalizeSupabaseOrigin };
