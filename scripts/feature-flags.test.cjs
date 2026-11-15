'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getFeatureFlags } = require('../nova-feature-flags');

test('risky flags default OFF and quota enforcement defaults fail-closed', () => {
  const flags = getFeatureFlags({});
  assert.equal(flags.aiChat, true);
  assert.equal(flags.usageQuotaRequired, true);
  for (const name of [
    'accountDeletion', 'paidImage', 'pollinationsSpend', 'aiHorde', 'imageStudio',
    'cloudflareWorkersAi', 'companyCloud', 'proBilling', 'ultraBilling'
  ]) assert.equal(flags[name], false, name);
});

test('risky flags require explicit opt-in and billing cannot be enabled by environment variables', () => {
  const flags = getFeatureFlags({
    AI_DISABLED: '1',
    NOVA_USAGE_QUOTA_REQUIRED: '1',
    ACCOUNT_DELETION_ENABLED: '1',
    ALLOW_PAID_IMAGE: 'true',
    NOVA_ALLOW_POLLINATIONS_SPEND: '1',
    NOVA_ALLOW_AI_HORDE: '1',
    NOVA_ALLOW_CLOUDFLARE: '1',
    NOVA_BI_ENABLED: '1',
    PRO_BILLING_ENABLED: '1',
    ULTRA_BILLING_ENABLED: '1'
  });
  assert.equal(flags.aiChat, false);
  assert.equal(flags.usageQuotaRequired, true);
  for (const name of [
    'accountDeletion', 'paidImage', 'pollinationsSpend', 'aiHorde',
    'cloudflareWorkersAi', 'companyCloud'
  ]) assert.equal(flags[name], true, name);
  assert.equal(flags.proBilling, false);
  assert.equal(flags.ultraBilling, false);
});

test('Image Studio is visible only when an explicitly enabled server image provider is configured', () => {
  assert.equal(getFeatureFlags({ ALLOW_PAID_IMAGE: 'true' }).imageStudio, false);
  assert.equal(getFeatureFlags({ ALLOW_PAID_IMAGE: 'true', IMAGE_KEY: 'fake', IMAGE_MODEL: 'fake-model' }).imageStudio, true);
  assert.equal(getFeatureFlags({ NOVA_ALLOW_AI_HORDE: '1', HORDE_API_KEY: 'fake' }).imageStudio, true);
  assert.equal(getFeatureFlags({ NOVA_ALLOW_POLLINATIONS_SPEND: '1', POLLI_KEY: 'fake' }).imageStudio, true);
  assert.equal(getFeatureFlags({ IMAGE_OFF: '1', NOVA_ALLOW_AI_HORDE: '1', HORDE_API_KEY: 'fake' }).imageStudio, false);
});
