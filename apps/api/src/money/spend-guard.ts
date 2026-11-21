import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
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
const allowedActor = /^(synthetic-[a-z0-9-]{1,40}|[0-9a-fA-F-]{36})$/;
export async function reserveProviderSpend(
  pool: Pool,
  actorKey: string,
  estimatedCostPaise: number,
  globalCapInr: number,
  userCapInr: number,
): Promise<string | null> {
  if (!allowedActor.test(actorKey)) throw new Error("ACTOR_ID_REQUIRED");
  if (!Number.isSafeInteger(estimatedCostPaise) || estimatedCostPaise < 0)
    throw new Error("INVALID_ESTIMATE");
  const globalCap = Math.floor(globalCapInr * 100);
  const userCap = Math.floor(userCapInr * 100);
  if (
    !Number.isSafeInteger(globalCap) ||
    !Number.isSafeInteger(userCap) ||
    globalCap <= 0 ||
    userCap <= 0
  )
    return null;
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(2026111702)");
    const totals = await client.query<{ global_cost: string; user_cost: string }>(
      `select
        coalesce(sum(cost_paise),0)::text as global_cost,
        coalesce(sum(cost_paise) filter (where actor_key = $1),0)::text as user_cost
       from nova2_staging.ai_spend_events
       where created_at >= date_trunc('day', now()) and status in ('reserved','settled')`,
      [actorKey],
    );
    const globalToday = Number(totals.rows[0]?.global_cost ?? 0);
    const userToday = Number(totals.rows[0]?.user_cost ?? 0);
    if (globalToday + estimatedCostPaise > globalCap || userToday + estimatedCostPaise > userCap) {
      await client.query("rollback");
      return null;
    }
    const id = randomUUID();
    await client.query(
      "insert into nova2_staging.ai_spend_events(id,actor_key,cost_paise,status) values($1,$2,$3,'reserved')",
      [id, actorKey, estimatedCostPaise],
    );
    await client.query("commit");
    return id;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
export async function settleProviderSpend(
  pool: Pool,
  reservationId: string,
  actualCostPaise: number,
) {
  if (!Number.isSafeInteger(actualCostPaise) || actualCostPaise < 0)
    throw new Error("INVALID_ACTUAL_COST");
  const result = await pool.query(
    "update nova2_staging.ai_spend_events set cost_paise=$2,status='settled',updated_at=now() where id=$1 and status='reserved'",
    [reservationId, actualCostPaise],
  );
  return result.rowCount === 1;
}
export async function failProviderSpend(pool: Pool, reservationId: string) {
  const result = await pool.query(
    "update nova2_staging.ai_spend_events set cost_paise=0,status='failed',updated_at=now() where id=$1 and status='reserved'",
    [reservationId],
  );
  return result.rowCount === 1;
}
