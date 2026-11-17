export const LIMITS = {
  jsonBodyBytes: 1_048_576,
  uploadBytes: 8_000_000,
  documentPages: 5,
  documentImageLongEdge: 1600,
  chatChars: 20_000,
  diwanTextChars: 40_000,
  requestsPerMinute: 60,
  aiUserDailyCapInr: 0,
  aiGlobalDailyCapInr: 0,
  freePoolDailyCapInr: 0,
} as const;
