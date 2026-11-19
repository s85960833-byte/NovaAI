'use strict';

const REQUIRED_LIMITS = ['requests_per_minute', 'tokens_per_minute', 'requests_per_day', 'tokens_per_day'];

function quotasKnown(provider) {
  return REQUIRED_LIMITS.every(key => Number.isSafeInteger(provider[key]) && provider[key] > 0);
}

function verifiedDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function verifiedTermsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}
function customerDataControlsVerified(provider) {
  return provider.data_tier === 'paid_no_training' &&
    verifiedDate(provider.verified_on) &&
    verifiedTermsUrl(provider.terms_url) &&
    verifiedDate(provider.terms_reviewed_on) &&
    provider.no_training_confirmed === true &&
    verifiedDate(provider.owner_access_verified_on) &&
    provider.owner_only_access === true;
}

function eligibleProviders(config, dataClass, estimate = {}) {
  if (!config || !Array.isArray(config.providers)) return [];
  if (!['owner_non_personal_test_data', 'customer_data'].includes(dataClass)) return [];
  const input = Number(estimate.inputTokens || 0), output = Number(estimate.outputTokens || 0);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0) return [];
  return config.providers.filter(provider => {
    if (!provider || typeof provider.model !== 'string' || !provider.model.trim() || !quotasKnown(provider)) return false;
    if (dataClass === 'customer_data' && !customerDataControlsVerified(provider)) return false;
    if (dataClass === 'owner_non_personal_test_data' && !['paid_no_training', 'unpaid', 'unverified'].includes(provider.data_tier)) return false;
    const total = input + output;
    if (total > provider.tokens_per_minute || total > provider.tokens_per_day) return false;
    return provider.requests_per_minute >= 1 && provider.requests_per_day >= 1;
  });
}

function chooseProvider(config, dataClass, estimate = {}) {
  const providers = eligibleProviders(config, dataClass, estimate);
  if (providers.length) return { provider: providers[0], reason: null };
  if (dataClass === 'customer_data') return { provider: null, reason: 'no_verified_paid_no_training_provider_with_known_quotas' };
  if (dataClass === 'owner_non_personal_test_data') return { provider: null, reason: 'no_configured_provider_with_known_quotas' };
  return { provider: null, reason: 'unknown_data_class' };
}

module.exports = { REQUIRED_LIMITS, quotasKnown, verifiedDate, verifiedTermsUrl, customerDataControlsVerified, eligibleProviders, chooseProvider };
