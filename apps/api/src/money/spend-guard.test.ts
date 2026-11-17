import { it, expect } from "vitest";
import { canStartProviderCall } from "./spend-guard.js";
const base = {
  globalTodayInr: 0,
  userTodayInr: 0,
  globalCapInr: 10,
  userCapInr: 2,
  killSwitch: false,
};
it("allows only a call inside both budgets", () => {
  expect(canStartProviderCall(base, 1).allowed).toBe(true);
  expect(canStartProviderCall({ ...base, userTodayInr: 1.5 }, 1).reason).toBe("USER_CAP");
  expect(canStartProviderCall({ ...base, globalTodayInr: 9.5 }, 1).reason).toBe("GLOBAL_CAP");
});
it("fails closed when kill switch or zero budget is set", () => {
  expect(canStartProviderCall({ ...base, killSwitch: true }, 0).reason).toBe("KILL_SWITCH");
  expect(canStartProviderCall({ ...base, globalCapInr: 0 }, 0).reason).toBe("ZERO_BUDGET");
});
