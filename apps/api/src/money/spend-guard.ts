export type SpendState = {
  globalTodayInr: number;
  userTodayInr: number;
  globalCapInr: number;
  userCapInr: number;
  killSwitch: boolean;
};
export function canStartProviderCall(state: SpendState, estimatedCostInr: number) {
  if (state.killSwitch) return { allowed: false, reason: "KILL_SWITCH" } as const;
  if (!Number.isFinite(estimatedCostInr) || estimatedCostInr < 0)
    return { allowed: false, reason: "INVALID_ESTIMATE" } as const;
  if (state.globalCapInr <= 0 || state.userCapInr <= 0)
    return { allowed: false, reason: "ZERO_BUDGET" } as const;
  if (state.globalTodayInr + estimatedCostInr > state.globalCapInr)
    return { allowed: false, reason: "GLOBAL_CAP" } as const;
  if (state.userTodayInr + estimatedCostInr > state.userCapInr)
    return { allowed: false, reason: "USER_CAP" } as const;
  return { allowed: true, reason: "OK" } as const;
}
