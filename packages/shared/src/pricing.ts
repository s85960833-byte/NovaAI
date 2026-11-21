export const PRICING = {
  currency: "INR",
  creditValuePaise: 100,
  topups: {
    starter: { rupees: 49, credits: 49 },
    standard: { rupees: 99, credits: 99 },
    plus: { rupees: 199, credits: 199 },
  },
  tasks: {
    paperReader: 15,
    scamCheck: 5,
    rtiDraft: 39,
    complaint: 39,
    schemeFinder: 19,
    sakhaMessagesPerCredit: 3,
  },
  free: { sakhaMessagesPerDay: 10, imagesPerDay: 1, filesPerDay: 1, scamChecksPerDay: 2 },
  darbarPass: { monthlyRupees: 99, sixMonthRupees: 499 },
} as const;
