'use strict';

function getFeatureFlags(env = process.env) {
  return Object.freeze({
    aiChat: env.AI_DISABLED !== '1',
    usageQuotaRequired: env.NOVA_USAGE_QUOTA_REQUIRED !== '0',
    accountDeletion: env.ACCOUNT_DELETION_ENABLED === '1',
    paidImage: env.ALLOW_PAID_IMAGE === 'true',
    pollinationsSpend: env.NOVA_ALLOW_POLLINATIONS_SPEND === '1',
    aiHorde: env.NOVA_ALLOW_AI_HORDE === '1',\n    imageStudio: !!imageStudio,
    cloudflareWorkersAi: env.NOVA_ALLOW_CLOUDFLARE === '1',
    companyCloud: env.NOVA_BI_ENABLED === '1',
    proBilling: false,
    ultraBilling: false
  });
}

module.exports = { getFeatureFlags };
