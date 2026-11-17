import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { PRICING } from "@nova/shared/pricing";
const eventSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum(["payment.captured", "payment.failed", "refund.processed"]),
  orderId: z.string().min(1),
  amountPaise: z.number().int().nonnegative(),
});
const userPattern = /^synthetic-[a-z0-9-]{1,40}$/;
type PackId = keyof typeof PRICING.topups;
type EventResult = { duplicate?: boolean; balance: number };
type LedgerRow = { deltaCredits: number; reason: string; createdAt: string };
function verifySignature(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}
export class PostgresMockWalletLedger {
  constructor(private readonly pool: Pool) {}
  sign(raw: string, secret: string) {
    return createHmac("sha256", secret).update(raw).digest("hex");
  }
  private assertUser(userId: string) {
    if (!userPattern.test(userId)) throw new Error("USER_REQUIRED");
  }
  private async balanceWith(client: PoolClient, userId: string) {
    const result = await client.query<{ balance_credits: string }>(
      "select balance_credits::text from nova2_staging.wallet_accounts where synthetic_user_id = $1",
      [userId],
    );
    return Number(result.rows[0]?.balance_credits ?? 0);
  }
  async balance(userId: string) {
    this.assertUser(userId);
    const result = await this.pool.query<{ balance_credits: string }>(
      "select balance_credits::text from nova2_staging.wallet_accounts where synthetic_user_id = $1",
      [userId],
    );
    return Number(result.rows[0]?.balance_credits ?? 0);
  }
  async ledger(userId: string): Promise<LedgerRow[]> {
    this.assertUser(userId);
    const result = await this.pool.query<{
      delta_credits: string;
      reason: string;
      created_at: Date;
    }>(
      "select delta_credits::text, reason, created_at from nova2_staging.wallet_ledger where synthetic_user_id = $1 order by created_at desc limit 100",
      [userId],
    );
    return result.rows.map((row) => ({
      deltaCredits: Number(row.delta_credits),
      reason: row.reason,
      createdAt: row.created_at.toISOString(),
    }));
  }
  async createOrder(userId: string, packId: PackId) {
    this.assertUser(userId);
    const pack = PRICING.topups[packId];
    if (!pack) throw new Error("UNKNOWN_PACK");
    const orderId = "mock_order_" + crypto.randomUUID();
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "insert into nova2_staging.wallet_accounts(synthetic_user_id) values($1) on conflict do nothing",
        [userId],
      );
      await client.query(
        "insert into nova2_staging.wallet_orders(order_id,synthetic_user_id,pack_id,amount_paise,credits,status) values($1,$2,$3,$4,$5,'created')",
        [orderId, userId, packId, pack.rupees * 100, pack.credits],
      );
      await client.query("commit");
      return {
        id: orderId,
        userId,
        packId,
        amountPaise: pack.rupees * 100,
        credits: pack.credits,
        status: "created" as const,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async ownsOrder(userId: string, orderId: string) {
    this.assertUser(userId);
    const result = await this.pool.query(
      "select 1 from nova2_staging.wallet_orders where order_id = $1 and synthetic_user_id = $2",
      [orderId, userId],
    );
    return result.rowCount === 1;
  }
  async spend(userId: string, credits: number, refId: string) {
    this.assertUser(userId);
    if (!Number.isSafeInteger(credits) || credits <= 0) throw new Error("INVALID_CREDITS");
    if (!refId || refId.length > 160) throw new Error("INVALID_REFERENCE");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "insert into nova2_staging.wallet_accounts(synthetic_user_id) values($1) on conflict do nothing",
        [userId],
      );
      const inserted = await client.query(
        "insert into nova2_staging.wallet_ledger(synthetic_user_id,delta_credits,reason,ref_type,ref_id) values($1,$2,'spend','task',$3) on conflict do nothing returning id",
        [userId, -credits, refId],
      );
      const balance = await this.balanceWith(client, userId);
      if (inserted.rowCount === 0) {
        await client.query("commit");
        return balance;
      }
      await client.query("commit");
      return balance;
    } catch (error) {
      await client.query("rollback");
      if (
        error instanceof Error &&
        error.message.includes("wallet_accounts_balance_credits_check")
      ) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      throw error;
    } finally {
      client.release();
    }
  }
  async processWebhook(raw: string, signature: string, secret: string): Promise<EventResult> {
    if (!verifySignature(raw, signature, secret)) throw new Error("INVALID_SIGNATURE");
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error("INVALID_JSON");
    }
    const parsed = eventSchema.safeParse(value);
    if (!parsed.success) throw new Error("INVALID_EVENT");
    const event = parsed.data;
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const orderResult = await client.query<{
        synthetic_user_id: string;
        amount_paise: string;
        credits: string;
        status: string;
      }>(
        "select synthetic_user_id,amount_paise::text,credits::text,status from nova2_staging.wallet_orders where order_id = $1 for update",
        [event.orderId],
      );
      const order = orderResult.rows[0];
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (Number(order.amount_paise) !== event.amountPaise) throw new Error("AMOUNT_MISMATCH");
      const payloadHash = createHash("sha256").update(raw).digest("hex");
      const eventInsert = await client.query(
        "insert into nova2_staging.wallet_events(event_id,order_id,event_type,payload_hash) values($1,$2,$3,$4) on conflict do nothing returning event_id",
        [event.id, event.orderId, event.type, payloadHash],
      );
      if (eventInsert.rowCount === 0) {
        const balance = await this.balanceWith(client, order.synthetic_user_id);
        await client.query("commit");
        return { duplicate: true, balance };
      }
      if (event.type === "payment.failed") {
        if (order.status === "created") {
          await client.query(
            "update nova2_staging.wallet_orders set status='failed' where order_id=$1",
            [event.orderId],
          );
        }
      } else if (event.type === "payment.captured") {
        if (order.status === "refunded") throw new Error("ORDER_ALREADY_REFUNDED");
        if (order.status !== "captured") {
          await client.query(
            "update nova2_staging.wallet_orders set status='captured' where order_id=$1",
            [event.orderId],
          );
          await client.query(
            "insert into nova2_staging.wallet_ledger(synthetic_user_id,delta_credits,reason,ref_type,ref_id) values($1,$2,'topup','order',$3) on conflict do nothing",
            [order.synthetic_user_id, Number(order.credits), event.orderId],
          );
        }
      } else {
        if (order.status === "refunded") throw new Error("ORDER_ALREADY_REFUNDED");
        if (order.status !== "captured") throw new Error("REFUND_WITHOUT_CAPTURE");
        const balance = await this.balanceWith(client, order.synthetic_user_id);
        if (balance < Number(order.credits)) throw new Error("REFUND_BALANCE_CONFLICT");
        await client.query(
          "update nova2_staging.wallet_orders set status='refunded' where order_id=$1",
          [event.orderId],
        );
        await client.query(
          "insert into nova2_staging.wallet_ledger(synthetic_user_id,delta_credits,reason,ref_type,ref_id) values($1,$2,'refund','order',$3) on conflict do nothing",
          [order.synthetic_user_id, -Number(order.credits), event.orderId],
        );
      }
      const balance = await this.balanceWith(client, order.synthetic_user_id);
      await client.query("commit");
      return { balance };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
