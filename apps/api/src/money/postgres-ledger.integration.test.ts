import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PostgresMockWalletLedger } from "./postgres-ledger.js";
import { failProviderSpend, reserveProviderSpend, settleProviderSpend } from "./spend-guard.js";

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite("durable staging mock wallet (synthetic database only)", () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  const wallet = new PostgresMockWalletLedger(pool);
  const secret = "local-integration-secret";
  const newUser = () => "synthetic-" + randomUUID();

  const webhook = (
    id: string,
    type: "payment.captured" | "payment.failed" | "refund.processed",
    orderId: string,
    amountPaise: number,
  ) => {
    const raw = JSON.stringify({ id, type, orderId, amountPaise });
    return { raw, signature: wallet.sign(raw, secret) };
  };

  afterAll(async () => {
    await pool.end();
  });

  it("persists capture, duplicate, invalid signature, refund and append-only ledger rows", async () => {
    const user = newUser();
    const order = await wallet.createOrder(user, "starter");
    const capture = webhook(
      "capture-" + randomUUID(),
      "payment.captured",
      order.id,
      order.amountPaise,
    );

    await expect(wallet.processWebhook(capture.raw, "00".repeat(32), secret)).rejects.toThrow(
      "INVALID_SIGNATURE",
    );
    expect((await wallet.processWebhook(capture.raw, capture.signature, secret)).balance).toBe(49);

    const duplicate = await wallet.processWebhook(capture.raw, capture.signature, secret);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.balance).toBe(49);

    const reusedId = webhook(
      JSON.parse(capture.raw).id,
      "payment.failed",
      order.id,
      order.amountPaise,
    );
    await expect(wallet.processWebhook(reusedId.raw, reusedId.signature, secret)).rejects.toThrow(
      "EVENT_ID_REUSE",
    );

    const refund = webhook(
      "refund-" + randomUUID(),
      "refund.processed",
      order.id,
      order.amountPaise,
    );
    expect((await wallet.processWebhook(refund.raw, refund.signature, secret)).balance).toBe(0);

    const secondRefund = webhook(
      "refund-again-" + randomUUID(),
      "refund.processed",
      order.id,
      order.amountPaise,
    );
    await expect(
      wallet.processWebhook(secondRefund.raw, secondRefund.signature, secret),
    ).rejects.toThrow("ORDER_ALREADY_REFUNDED");

    const ledger = await pool.query(
      "select reason from nova2_staging.wallet_ledger where synthetic_user_id=$1",
      [user],
    );
    expect(ledger.rows).toHaveLength(2);
  });

  it("accepts delayed capture after payment.failed, ignores late failure and deduplicates concurrent delivery", async () => {
    const user = newUser();
    const order = await wallet.createOrder(user, "starter");
    const failed = webhook(
      "failed-" + randomUUID(),
      "payment.failed",
      order.id,
      order.amountPaise,
    );
    expect((await wallet.processWebhook(failed.raw, failed.signature, secret)).balance).toBe(0);

    const delayedCapture = webhook(
      "late-capture-" + randomUUID(),
      "payment.captured",
      order.id,
      order.amountPaise,
    );
    expect(
      (await wallet.processWebhook(delayedCapture.raw, delayedCapture.signature, secret)).balance,
    ).toBe(49);

    const lateFailure = webhook(
      "late-failure-" + randomUUID(),
      "payment.failed",
      order.id,
      order.amountPaise,
    );
    expect(
      (await wallet.processWebhook(lateFailure.raw, lateFailure.signature, secret)).balance,
    ).toBe(49);

    const results = await Promise.all([
      wallet.processWebhook(delayedCapture.raw, delayedCapture.signature, secret),
      wallet.processWebhook(delayedCapture.raw, delayedCapture.signature, secret),
    ]);
    expect(results.every((item) => item.balance === 49)).toBe(true);

    const state = await pool.query(
      "select status from nova2_staging.wallet_orders where order_id=$1",
      [order.id],
    );
    expect(state.rows[0]?.status).toBe("captured");
  });

  it("prevents negative balances, deduplicates spends and reconciles the ledger balance cache", async () => {
    const user = newUser();
    const order = await wallet.createOrder(user, "standard");
    const capture = webhook(
      "reconcile-capture-" + randomUUID(),
      "payment.captured",
      order.id,
      order.amountPaise,
    );
    await wallet.processWebhook(capture.raw, capture.signature, secret);

    expect(await wallet.spend(user, 10, "integration-task-1")).toBe(89);
    expect(await wallet.spend(user, 10, "integration-task-1")).toBe(89);
    await expect(wallet.spend(user, 100, "integration-task-2")).rejects.toThrow(
      "INSUFFICIENT_CREDITS",
    );

    const rows = await wallet.ledger(user);
    expect(rows.reduce((sum, row) => sum + row.deltaCredits, 0)).toBe(89);

    const reconciliation = await pool.query(
      "select a.balance_credits, coalesce(sum(l.delta_credits),0)::bigint as ledger_balance " +
        "from nova2_staging.wallet_accounts a " +
        "left join nova2_staging.wallet_ledger l using(synthetic_user_id) " +
        "where a.synthetic_user_id=$1 group by a.synthetic_user_id,a.balance_credits",
      [user],
    );
    expect(Number(reconciliation.rows[0]?.balance_credits)).toBe(
      Number(reconciliation.rows[0]?.ledger_balance),
    );

    await expect(
      pool.query(
        "update nova2_staging.wallet_ledger set reason='refund' where synthetic_user_id=$1",
        [user],
      ),
    ).rejects.toThrow("WALLET_LEDGER_APPEND_ONLY");
    await expect(
      pool.query("delete from nova2_staging.wallet_ledger where synthetic_user_id=$1", [user]),
    ).rejects.toThrow("WALLET_LEDGER_APPEND_ONLY");
  });

  it("enforces user/global spend caps and marks failed provider calls", async () => {
    const actor = "synthetic-spend-" + randomUUID().replaceAll("-", "").slice(0, 20);
    const first = await reserveProviderSpend(pool, actor, 60, 1, 1);
    expect(first).toBeTruthy();
    expect(await reserveProviderSpend(pool, actor, 50, 1, 1)).toBeNull();

    const otherActor = "synthetic-other-" + randomUUID().replaceAll("-", "").slice(0, 16);
    expect(await reserveProviderSpend(pool, otherActor, 50, 1, 1)).toBeNull();
    expect(await settleProviderSpend(pool, first!, 60)).toBe(true);

    const failureActor = "synthetic-fail-" + randomUUID().replaceAll("-", "").slice(0, 16);
    const failedReservation = await reserveProviderSpend(pool, failureActor, 30, 2, 1);
    expect(failedReservation).toBeTruthy();
    expect(await failProviderSpend(pool, failedReservation!)).toBe(true);
    expect(await settleProviderSpend(pool, failedReservation!, 30)).toBe(false);

    await expect(reserveProviderSpend(pool, "real-user-id", 1, 1, 1)).rejects.toThrow(
      "ACTOR_ID_REQUIRED",
    );
    expect(await reserveProviderSpend(pool, actor, 1, 0, 0)).toBeNull();
  });

  it("injects a slow database query and records the statement timeout", async () => {
    const client = await pool.connect();
    try {
      await client.query("set statement_timeout = '25ms'");
      await expect(client.query("select pg_sleep(0.2)")).rejects.toThrow(/canceling statement/i);
    } finally {
      await client.query("reset statement_timeout");
      client.release();
    }
  });
});
