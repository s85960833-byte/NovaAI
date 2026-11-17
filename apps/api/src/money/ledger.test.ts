import { describe, it, expect } from "vitest";
import { MockWalletLedger } from "./ledger.js";
const secret = "local-test-secret-only";
function rawEvent(id: string, type: string, orderId: string, amountPaise: unknown) {
  return JSON.stringify({ id, type, orderId, amountPaise });
}
function deliver(wallet: MockWalletLedger, raw: string) {
  return wallet.processWebhook(raw, wallet.sign(raw, secret), secret);
}
describe("mock append-only wallet", () => {
  it("credits only after a valid signed capture and ignores duplicate event", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("synthetic-user", "starter");
    expect(wallet.ownsOrder("synthetic-user", order.id)).toBe(true);
    expect(wallet.ownsOrder("other-user", order.id)).toBe(false);
    const raw = rawEvent("evt-1", "payment.captured", order.id, order.amountPaise);
    expect(deliver(wallet, raw).balance).toBe(49);
    expect(deliver(wallet, raw).duplicate).toBe(true);
    expect(wallet.balance("synthetic-user")).toBe(49);
    expect(wallet.ledger("synthetic-user")).toHaveLength(1);
  });
  it("rejects missing users, invalid signatures, JSON, event schema and amounts", () => {
    const wallet = new MockWalletLedger();
    expect(() => wallet.createOrder("", "starter")).toThrow("USER_REQUIRED");
    const order = wallet.createOrder("u", "starter");
    const raw = rawEvent("evt-2", "payment.captured", order.id, order.amountPaise);
    expect(() => wallet.processWebhook(raw, "00", secret)).toThrow("INVALID_SIGNATURE");
    expect(() => wallet.processWebhook("{", wallet.sign("{", secret), secret)).toThrow(
      "INVALID_JSON",
    );
    expect(() =>
      wallet.processWebhook("not-json", wallet.sign("not-json", secret), secret),
    ).toThrow("INVALID_JSON");
    const bad = rawEvent("evt-3", "payment.captured", order.id, 1);
    expect(() => deliver(wallet, bad)).toThrow("AMOUNT_MISMATCH");
  });
  it("handles failed payment then later capture without crediting the failed event", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("u", "standard");
    const failed = rawEvent("evt-4", "payment.failed", order.id, order.amountPaise);
    expect(deliver(wallet, failed).balance).toBe(0);
    const capture = rawEvent("evt-5", "payment.captured", order.id, order.amountPaise);
    expect(deliver(wallet, capture).balance).toBe(99);
  });
  it("prevents negative balances and records successful spend and refund as compensating rows", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("u", "starter");
    const capture = rawEvent("evt-6", "payment.captured", order.id, order.amountPaise);
    deliver(wallet, capture);
    expect(() => wallet.spend("u", 0, "job")).toThrow("INVALID_CREDITS");
    expect(() => wallet.spend("u", 50, "job")).toThrow("INSUFFICIENT_CREDITS");
    expect(wallet.spend("u", 10, "job")).toBe(39);
    const refund = rawEvent("evt-7", "refund.processed", order.id, order.amountPaise);
    expect(() => deliver(wallet, refund)).toThrow("REFUND_BALANCE_CONFLICT");
  });
  it("records a full refund and rejects a second capture or refund before capture", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("u", "starter");
    const earlyRefund = rawEvent("evt-8", "refund.processed", order.id, order.amountPaise);
    expect(() => deliver(wallet, earlyRefund)).toThrow("REFUND_WITHOUT_CAPTURE");
    deliver(wallet, rawEvent("evt-9", "payment.captured", order.id, order.amountPaise));
    const refund = rawEvent("evt-10", "refund.processed", order.id, order.amountPaise);
    expect(deliver(wallet, refund).balance).toBe(0);
    expect(() =>
      deliver(wallet, rawEvent("evt-11", "payment.captured", order.id, order.amountPaise)),
    ).toThrow("ORDER_ALREADY_REFUNDED");
    expect(wallet.ledger("u").map((row) => row.deltaCredits)).toEqual([49, -49]);
  });
  it("rejects unknown orders", () => {
    const wallet = new MockWalletLedger();
    const raw = rawEvent("evt-12", "payment.captured", "missing", 4900);
    expect(() => deliver(wallet, raw)).toThrow("ORDER_NOT_FOUND");
  });
});
