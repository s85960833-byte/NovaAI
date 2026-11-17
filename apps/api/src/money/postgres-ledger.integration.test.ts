import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PostgresMockWalletLedger } from "./postgres-ledger.js";
const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
suite("durable staging mock wallet (synthetic database only)", () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const wallet = new PostgresMockWalletLedger(pool);
  const secret = "local-integration-secret";
  const user = "synthetic-" + randomUUID();
  afterAll(async () => { await pool.end(); });
  it("persists captures, refunds, spends and idempotency in append-only rows", async () => {
    const starter = await wallet.createOrder(user, "starter");
    const captureRaw = JSON.stringify({ id: "capture-" + randomUUID(), type: "payment.captured", orderId: starter.id, amountPaise: starter.amountPaise });
    const captured = await wallet.processWebhook(captureRaw, wallet.sign(captureRaw, secret), secret);
    expect(captured.balance).toBe(49);
    const duplicate = await wallet.processWebhook(captureRaw, wallet.sign(captureRaw, secret), secret);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.balance).toBe(49);
    const refundRaw = JSON.stringify({ id: "refund-" + randomUUID(), type: "refund.processed", orderId: starter.id, amountPaise: starter.amountPaise });
    expect((await wallet.processWebhook(refundRaw, wallet.sign(refundRaw, secret), secret)).balance).toBe(0);
    await expect(wallet.processWebhook(JSON.stringify({ id: "refund-again-" + randomUUID(), type: "refund.processed", orderId: starter.id, amountPaise: starter.amountPaise }), wallet.sign(JSON.stringify({ id: "unused", type: "refund.processed", orderId: starter.id, amountPaise: starter.amountPaise }), secret), secret)).rejects.toThrow();
  });
  it("prevents negative balances and deduplicates spend references", async () => {
    const order = await wallet.createOrder(user, "standard");
    const raw = JSON.stringify({ id: "capture-" + randomUUID(), type: "payment.captured", orderId: order.id, amountPaise: order.amountPaise });
    await wallet.processWebhook(raw, wallet.sign(raw, secret), secret);
    expect(await wallet.spend(user, 10, "integration-task-1")).toBe(89);
    expect(await wallet.spend(user, 10, "integration-task-1")).toBe(89);
    await expect(wallet.spend(user, 100, "integration-task-2")).rejects.toThrow("INSUFFICIENT_CREDITS");
    const rows = await wallet.ledger(user);
    expect(rows.reduce((sum, row) => sum + row.deltaCredits, 0)).toBe(89);
    expect(rows).toHaveLength(4);
  });
});
