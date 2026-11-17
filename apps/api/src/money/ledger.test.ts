import { describe, it, expect } from "vitest";
import { MockWalletLedger } from "./ledger.js";
const secret = "local-test-secret-only";
function event(
  id: string,
  type: "payment.captured" | "payment.failed" | "refund.processed",
  orderId: string,
  amountPaise: number,
) {
  return JSON.stringify({ id, type, orderId, amountPaise });
}
describe("mock append-only wallet", () => {
  it("credits only after a valid signed capture and ignores duplicate event", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("synthetic-user", "starter");
    const raw = event("evt-1", "payment.captured", order.id, order.amountPaise);
    const sig = wallet.sign(raw, secret);
    expect(wallet.processWebhook(raw, sig, secret).balance).toBe(49);
    expect(wallet.processWebhook(raw, sig, secret).duplicate).toBe(true);
    expect(wallet.balance("synthetic-user")).toBe(49);
    expect(wallet.ledger("synthetic-user")).toHaveLength(1);
  });
  it("rejects invalid signatures and amount mismatch", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("u", "starter");
    const raw = event("evt-2", "payment.captured", order.id, order.amountPaise);
    expect(() => wallet.processWebhook(raw, "00", secret)).toThrow("INVALID_SIGNATURE");
    const wrong = event("evt-3", "payment.captured", order.id, 1);
    expect(() => wallet.processWebhook(wrong, wallet.sign(wrong, secret), secret)).toThrow(
      "AMOUNT_MISMATCH",
    );
  });
  it("never permits a negative balance and records refund as a compensating row", () => {
    const wallet = new MockWalletLedger();
    const order = wallet.createOrder("u", "starter");
    const capture = event("evt-4", "payment.captured", order.id, order.amountPaise);
    wallet.processWebhook(capture, wallet.sign(capture, secret), secret);
    expect(() => wallet.spend("u", 50, "job")).toThrow("INSUFFICIENT_CREDITS");
    const refund = event("evt-5", "refund.processed", order.id, order.amountPaise);
    wallet.processWebhook(refund, wallet.sign(refund, secret), secret);
    expect(wallet.balance("u")).toBe(0);
    expect(wallet.ledger("u").map((x) => x.deltaCredits)).toEqual([49, -49]);
  });
  it("does not accept delayed events for unknown orders", () => {
    const wallet = new MockWalletLedger();
    const raw = event("evt-6", "payment.captured", "missing", 4900);
    expect(() => wallet.processWebhook(raw, wallet.sign(raw, secret), secret)).toThrow(
      "ORDER_NOT_FOUND",
    );
  });
});
