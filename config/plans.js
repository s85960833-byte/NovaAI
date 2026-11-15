'use strict';
// Unset or invalid owner limits remain null: quota enforcement fails closed.
function ownerCreditLimit(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 && value <= 10000000 ? value : null;
}
module.exports = Object.freeze({
  free: Object.freeze({ monthlyCredits: ownerCreditLimit('NOVA_FREE_MONTHLY_CREDITS'), decision: 'OWNER DECISION' }),
  pro: Object.freeze({ monthlyCredits: ownerCreditLimit('NOVA_PRO_MONTHLY_CREDITS'), decision: 'OWNER DECISION' }),
  ultra: Object.freeze({ monthlyCredits: ownerCreditLimit('NOVA_ULTRA_MONTHLY_CREDITS'), decision: 'OWNER DECISION' })
});
