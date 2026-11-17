import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const razorpayFixtureSchema = z.object({
  event: z.enum(["payment.captured", "payment.failed", "refund.processed"]),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string().min(1),
          order_id: z.string().min(1),
          amount: z.number().int().positive(),
          currency: z.literal("INR"),
        }),
      })
      .optional(),
    refund: z
      .object({
        entity: z.object({
          id: z.string().min(1),
          payment_id: z.string().min(1),
          amount: z.number().int().positive(),
          currency: z.literal("INR"),
        }),
      })
      .optional(),
  }),
});
export type RazorpayTestEvent = {
  id: string;
  type: "payment.captured" | "payment.failed" | "refund.processed";
  providerOrderId?: string;
  providerPaymentId?: string;
  amountPaise: number;
};
export function verifyRazorpayTestSignature(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string,
) {
  if (!webhookSecret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
export function parseRazorpayTestEvent(rawBody: string): RazorpayTestEvent {
  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new Error("INVALID_JSON");
  }
  const parsed = razorpayFixtureSchema.safeParse(value);
  if (!parsed.success) throw new Error("INVALID_RAZORPAY_TEST_EVENT");
  if (parsed.data.event === "refund.processed") {
    const entity = parsed.data.payload.refund?.entity;
    if (!entity) throw new Error("REFUND_ENTITY_REQUIRED");
    return {
      id: entity.id,
      type: "refund.processed",
      providerPaymentId: entity.payment_id,
      amountPaise: entity.amount,
    };
  }
  const entity = parsed.data.payload.payment?.entity;
  if (!entity) throw new Error("PAYMENT_ENTITY_REQUIRED");
  return {
    id: entity.id,
    type: parsed.data.event,
    providerOrderId: entity.order_id,
    amountPaise: entity.amount,
  };
}
