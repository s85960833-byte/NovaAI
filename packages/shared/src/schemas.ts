import { z } from "zod";
export const chatMessageSchema = z.object({
  content: z.string().trim().min(1).max(20_000),
  language: z.enum(["hi", "en", "hinglish"]).default("hi"),
});
export const diwanScamSchema = z.object({
  text: z.string().trim().min(8).max(8_000),
  language: z.enum(["hi", "en"]).default("hi"),
});
export const rtiDraftSchema = z.object({
  authority: z.string().trim().min(2).max(200),
  subject: z.string().trim().min(5).max(500),
  questions: z.array(z.string().trim().min(5).max(500)).min(1).max(10),
  period: z.string().max(100).optional(),
  language: z.enum(["hi", "en"]).default("hi"),
});
export const complaintSchema = z.object({
  category: z.enum([
    "consumer",
    "police",
    "municipal",
    "electricity",
    "bank",
    "telecom",
    "education",
  ]),
  facts: z.string().trim().min(20).max(5_000),
  relief: z.string().trim().min(5).max(500),
  language: z.enum(["hi", "en"]).default("hi"),
});
export const paperReaderSchema = z.object({
  documentText: z.string().trim().min(1).max(40_000),
  language: z.enum(["hi", "en"]).default("hi"),
  consent: z.literal(true),
});
export const schemeMatchSchema = z.object({
  state: z.string().trim().min(2).max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  age: z.number().int().min(0).max(120).optional(),
  annual_income: z.number().nonnegative().max(100_000_000).optional(),
});
export const walletTopupSchema = z.object({ packId: z.enum(["starter", "standard", "plus"]) });
export const walletSpendSchema = z.object({
  credits: z.number().int().min(1).max(100_000),
  refId: z.string().trim().min(1).max(160),
});
export const webhookEventSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum(["payment.captured", "payment.failed", "refund.processed"]),
  orderId: z.string().min(1),
  amountPaise: z.number().int().nonnegative(),
});
export const authEmailSchema = z.string().trim().email().max(254);
export const authSignUpSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(12).max(128),
});
export const authSignInSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1).max(128),
});
export const authConfirmSchema = z.object({
  token_hash: z.string().min(20).max(512),
  type: z.enum(["email", "recovery", "signup", "invite", "magiclink", "email_change"]),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type PaperReaderInput = z.infer<typeof paperReaderSchema>;
