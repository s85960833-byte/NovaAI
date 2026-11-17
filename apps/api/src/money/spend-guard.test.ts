import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import {
  canStartProviderCall,
  failProviderSpend,
  reserveProviderSpend,
  settleProviderSpend,
} from "./spend-guard.js";

const base = {
  globalTodayInr: 0,
  userTodayInr: 0,
  globalCapInr: 10,
  userCapInr: 2,
  killSwitch: false,
};

function fakePool(totals = { global_cost: "0", user_cost: "0" }, failInsert = false) {
  const client = {
    query: vi.fn(async (sql: string) => {
      if (sql.includes("coalesce(sum(cost_paise)")) return { rows: [totals], rowCount: 1 };
      if (failInsert && sql.startsWith("insert into nova2_staging.ai_spend_events"))
        throw new Error("DB_WRITE_FAILED");
      return { rows: [], rowCount: 1 };
    }),
    release: vi.fn(),
  };
  const pool = {
    connect: vi.fn().mockResolvedValue(client),
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
  } as unknown as Pool;
  return { pool, client };
}

describe("provider spend guard", () => {
  afterEach(() => vi.restoreAllMocks());

  it("allows only calls inside both budgets", () => {
    expect(canStartProviderCall(base, 1)).toEqual({ allowed: true, reason: "OK" });
    expect(canStartProviderCall({ ...base, userTodayInr: 1.5 }, 1).reason).toBe("USER_CAP");
    expect(canStartProviderCall({ ...base, globalTodayInr: 9.5 }, 1).reason).toBe("GLOBAL_CAP");
  });

  it("fails closed on kill switch, invalid estimates and zero budget", () => {
    expect(canStartProviderCall({ ...base, killSwitch: true }, 0).reason).toBe("KILL_SWITCH");
    expect(canStartProviderCall(base, -1).reason).toBe("INVALID_ESTIMATE");
    expect(canStartProviderCall(base, Number.NaN).reason).toBe("INVALID_ESTIMATE");
    expect(canStartProviderCall({ ...base, globalCapInr: 0 }, 0).reason).toBe("ZERO_BUDGET");
  });

  it("reserves a synthetic actor budget transactionally", async () => {
    const { pool, client } = fakePool();
    const id = await reserveProviderSpend(pool, "synthetic-user-1", 60, 1, 1);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(client.query).toHaveBeenCalledWith("begin");
    expect(client.query).toHaveBeenCalledWith("select pg_advisory_xact_lock(2026111702)");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("insert into nova2_staging.ai_spend_events"),
      expect.arrayContaining([id, "synthetic-user-1", 60]),
    );
    expect(client.query).toHaveBeenCalledWith("commit");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("accepts a verified UUID actor but rejects untrusted actor IDs", async () => {
    const { pool } = fakePool();
    expect(await reserveProviderSpend(pool, "123e4567-e89b-12d3-a456-426614174000", 1, 1, 1)).toBeTruthy();
    await expect(reserveProviderSpend(pool, "real-user-id", 1, 1, 1)).rejects.toThrow("ACTOR_ID_REQUIRED");
    await expect(reserveProviderSpend(pool, "synthetic-user-1", -1, 1, 1)).rejects.toThrow("INVALID_ESTIMATE");
    await expect(reserveProviderSpend(pool, "synthetic-user-1", 1.5, 1, 1)).rejects.toThrow("INVALID_ESTIMATE");
    expect(await reserveProviderSpend(pool, "synthetic-user-1", 1, 0, 1)).toBeNull();
    expect(await reserveProviderSpend(pool, "synthetic-user-1", 1, 1, 0)).toBeNull();
  });

  it("rejects reservations that exceed the global daily cap", async () => {
    const { pool, client } = fakePool({ global_cost: "90", user_cost: "10" });
    expect(await reserveProviderSpend(pool, "synthetic-user-1", 20, 1, 1)).toBeNull();
    expect(client.query).toHaveBeenCalledWith("rollback");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rejects reservations that exceed the per-user daily cap", async () => {
    const { pool, client } = fakePool({ global_cost: "20", user_cost: "90" });
    expect(await reserveProviderSpend(pool, "synthetic-user-1", 20, 2, 1)).toBeNull();
    expect(client.query).toHaveBeenCalledWith("rollback");
  });

  it("rolls back failed inserts and releases the client", async () => {
    const { pool, client } = fakePool(undefined, true);
    await expect(reserveProviderSpend(pool, "synthetic-user-1", 10, 1, 1)).rejects.toThrow("DB_WRITE_FAILED");
    expect(client.query).toHaveBeenCalledWith("rollback");
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("settles or fails a reservation only once", async () => {
    const { pool } = fakePool();
    expect(await settleProviderSpend(pool, "reservation-1", 10)).toBe(true);
    expect(await failProviderSpend(pool, "reservation-2")).toBe(true);
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    expect(await settleProviderSpend(pool, "missing", 10)).toBe(false);
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    expect(await failProviderSpend(pool, "missing")).toBe(false);
    await expect(settleProviderSpend(pool, "bad", -1)).rejects.toThrow("INVALID_ACTUAL_COST");
    await expect(settleProviderSpend(pool, "bad", 1.5)).rejects.toThrow("INVALID_ACTUAL_COST");
  });
});
