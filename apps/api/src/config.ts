import { z } from "zod";
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(Number(process.env.PORT ?? 8787)),
  APP_BASE_URL: z.string().url().default("http://localhost:4173"),
  AI_PROVIDER: z.enum(["mock", "disabled"]).default("mock"),
  AI_KILL_SWITCH: z
    .string()
    .default("true")
    .transform((v) => v !== "false"),
  AI_GLOBAL_DAILY_SPEND_CAP_INR: z.coerce.number().nonnegative().default(0),
  AI_USER_DAILY_SPEND_CAP_INR: z.coerce.number().nonnegative().default(0),
  MOCK_FEATURES_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MOCK_WEBHOOK_SECRET: z.string().default("local-mock-only-secret"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),
});
export const config = schema.parse(process.env);
