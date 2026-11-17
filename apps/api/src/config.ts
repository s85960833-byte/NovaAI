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
  AI_PROVIDER: z.enum(["mock", "disabled", "openai", "gemini", "anthropic"]).default("mock"),
  AI_MODEL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(10).optional(),
  GEMINI_API_KEY: z.string().min(10).optional(),
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
  AI_INPUT_USD_PER_MILLION: z.coerce.number().nonnegative().optional(),
  AI_OUTPUT_USD_PER_MILLION: z.coerce.number().nonnegative().optional(),
  AI_USD_INR: z.coerce.number().positive().default(93.66),
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
