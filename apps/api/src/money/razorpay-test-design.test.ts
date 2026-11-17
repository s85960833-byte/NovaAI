import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseRazorpayTestEvent, verifyRazorpayTestSignature } from "./razorpay-test-design.js";
describe("Razorpay test-mode contract (no network/account)", () => {
  it("validates exact raw-body HMAC signatures", () => {
    const raw = JSON.stringify({ fixture: true });
    const secret = "synthetic-webhook-secret";
    const signature = createHmac("sha256", secret).update(raw).digest("hex");
    expect(verifyRazorpayTestSignature(raw, signature, secret)).toBe(true);
    expect(verifyRazorpayTestSignature(raw + " ", signature, secret)).toBe(false);
    expect(verifyRazorpayTestSignature(raw, "bad", secret)).toBe(false);
  });
  it("normalizes a synthetic captured payment without confusing provider and app IDs", () => {
    const event = parseRazorpayTestEvent(JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_fixture", order_id: "order_fixture", amount: 4900, currency: "INR" } } },
    }));
    expect(event.providerOrderId).toBe("order_fixture");
    expect(event.amountPaise).toBe(4900);
    expect(event.type).toBe("payment.captured");
  });
  it("keeps refund payment IDs separate for an explicit order lookup", () => {
    const event = parseRazorpayTestEvent(JSON.stringify({
      event: "refund.processed",
      payload: { refund: { entity: { id: "rfnd_fixture", payment_id: "pay_fixture", amount: 4900, currency: "INR" } } },
    }));
    expect(event.providerPaymentId).toBe("pay_fixture");
    expect(event.providerOrderId).toBeUndefined();
  });
  it("rejects malformed or unsupported events", () => {
    expect(() => parseRazorpayTestEvent("{")).toThrow("INVALID_JSON");
    expect(() => parseRazorpayTestEvent(JSON.stringify({ event: "payment.authorized", payload: {} }))).toThrow("INVALID_RAZORPAY_TEST_EVENT");
  });
});
