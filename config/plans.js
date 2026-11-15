'use strict';

// MONTHLY CREDIT COUNTS ARE OWNER DECISIONS. Keep null until provider costs,
// expected usage, terms and a price/credit model have been measured and approved.
module.exports = Object.freeze({
  free: Object.freeze({ monthlyCredits: null, decision: 'OWNER DECISION' }),
  pro: Object.freeze({ monthlyCredits: null, decision: 'OWNER DECISION' }),
  ultra: Object.freeze({ monthlyCredits: null, decision: 'OWNER DECISION' })
});
