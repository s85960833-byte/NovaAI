import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chatMessageSchema,
  diwanScamSchema,
  paperReaderSchema,
  rtiDraftSchema,
  complaintSchema,
  walletTopupSchema,
  walletSpendSchema,
  schemeMatchSchema,
} from "@nova/shared/schemas";
import { config } from "./config.js";
import { authRouter } from "./auth/routes.js";
import { fileRouter } from "./files/routes.js";
import { MockWalletLedger } from "./money/ledger.js";
import { PostgresMockWalletLedger } from "./money/postgres-ledger.js";
import { checkScamText } from "./diwan/scam-check.js";
import { conservativePaperFallback } from "./diwan/paper-reader.js";
import { buildRtiDraft, buildComplaintDraft } from "./diwan/drafts.js";
import { loadApprovedSchemes, matchSchemes } from "./diwan/schemes.js";
import { databaseHealth, pool } from "./db/connection.js";
import { requestContext } from "./middleware/request-context.js";
import { createTextProvider, estimateCostPaise } from "./ai/provider.js";
import { failProviderSpend, reserveProviderSpend, settleProviderSpend } from "./money/spend-guard.js";
type RawRequest = express.Request & { rawBody?: Buffer };
const app = express();
const wallet = pool ? new PostgresMockWalletLedger(pool) : new MockWalletLedger();
const providerKey = config.AI_PROVIDER === "openai" ? config.OPENAI_API_KEY : config.AI_PROVIDER === "gemini" ? config.GEMINI_API_KEY : config.AI_PROVIDER === "anthropic" ? config.ANTHROPIC_API_KEY : undefined;
const textProvider = createTextProvider({ provider: config.AI_PROVIDER, killSwitch: config.AI_KILL_SWITCH, apiKey: providerKey, model: config.AI_MODEL });
const approvedSchemes = loadApprovedSchemes();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'"],
        "upgrade-insecure-requests": config.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(requestContext);
app.use(
  express.json({
    limit: "1mb",
    strict: true,
    verify: (req, _res, buf) => {
      (req as RawRequest).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(cookieParser());
app.use(
  rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false }),
);
app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);
app.get("/api/health", async (req, res) => {
  const database = await databaseHealth();
  return res.status(database.configured && !database.ok ? 503 : 200).json({
    ok: true,
    ready: database.ok,
    requestId: req.requestId,
    service: "nova-api",
    version: "2.0.0",
    mode: config.AI_PROVIDER,
    aiEnabled: config.AI_PROVIDER !== "disabled" && !config.AI_KILL_SWITCH,
    mockPreviewEnabled: config.AI_PROVIDER === "mock",
    mockFeatures: config.MOCK_FEATURES_ENABLED,
    authConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    dependencies: { database, provider: config.AI_PROVIDER },
    timestamp: new Date().toISOString(),
  });
});
app.get("/health", (_req, res) => res.redirect(308, "/api/health"));
app.post("/api/sakha/chat", async (req, res) => {
  const parsed = chatMessageSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: { code: "INVALID_INPUT", requestId: req.requestId } });
  let reservationId: string | null = null;
  try {
    if (config.AI_PROVIDER !== "mock") {
      const actor = syntheticUser(req);
      if (!actor) return res.status(400).json({ error: { code: "SYNTHETIC_USER_REQUIRED", requestId: req.requestId } });
      if (!pool) return res.status(503).json({ error: { code: "SPEND_DATABASE_REQUIRED", requestId: req.requestId } });
      const estimated = estimateCostPaise(Math.ceil(parsed.data.content.length / 2), 1200);
      if (estimated === null) return res.status(503).json({ error: { code: "PROVIDER_PRICE_RATES_REQUIRED", requestId: req.requestId } });
      reservationId = await reserveProviderSpend(pool, actor, estimated, config.AI_GLOBAL_DAILY_SPEND_CAP_INR, config.AI_USER_DAILY_SPEND_CAP_INR);
      if (!reservationId) return res.status(429).json({ error: { code: "AI_SPEND_CAP_REACHED", requestId: req.requestId } });
    }
    const generated = await textProvider.generate({
      content: parsed.data.content,
      language: parsed.data.language,
    });
    if (reservationId && pool) await settleProviderSpend(pool, reservationId, generated.costPaise ?? 0);
    return res.json({
      ok: true,
      mode: generated.provider,
      model: generated.model,
      reply: generated.text,
      chargedCredits: 0,
      costPaise: generated.costPaise,
      stored: false,
      requestId: req.requestId,
    });
  } catch {
    if (reservationId && pool) await failProviderSpend(pool, reservationId).catch(() => false);
    return res.status(503).json({ error: { code: "PROVIDER_DISABLED", requestId: req.requestId } });
  }
});
app.post("/api/diwan/scam-check", (req, res) => {
  const parsed = diwanScamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  return res.json({ ok: true, result: checkScamText(parsed.data.text) });
});
app.post("/api/diwan/paper-reader", (req, res) => {
  const parsed = paperReaderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "CONSENT_OR_INPUT_INVALID" } });
  return res.json({
    ok: true,
    mode: "conservative-fallback",
    result: conservativePaperFallback(parsed.data.documentText),
  });
});
app.post("/api/diwan/rti", (req, res) => {
  const parsed = rtiDraftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  return res.json({
    ok: true,
    draft: buildRtiDraft(parsed.data),
    notice:
      "Verify the authority, fee and submission process using the official portal before sending.",
  });
});
app.post("/api/diwan/complaint", (req, res) => {
  const parsed = complaintSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  return res.json({
    ok: true,
    draft: buildComplaintDraft(parsed.data),
    notice: "Verify the correct official filing channel before sending.",
  });
});
app.post("/api/diwan/schemes/match", (req, res) => {
  const parsed = schemeMatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  const result = matchSchemes(approvedSchemes, parsed.data);
  return res.json({
    ok: true,
    ...result,
    message:
      result.datasetStatus === "owner_review_pending"
        ? "The official scheme dataset is awaiting owner review."
        : undefined,
  });
});
function syntheticUser(req: express.Request) {
  const value = req.header("x-nova-synthetic-user") ?? "";
  return /^synthetic-[a-z0-9-]{1,40}$/.test(value) ? value : null;
}
app.get("/api/wallet/mock", async (req, res) => {
  if (!config.MOCK_FEATURES_ENABLED)
    return res.status(404).json({ error: { code: "MOCK_WALLET_DISABLED" } });
  const user = syntheticUser(req);
  if (!user) return res.status(400).json({ error: { code: "SYNTHETIC_USER_REQUIRED" } });
  try {
    return res.json({
      ok: true,
      balance: await wallet.balance(user),
      ledger: await wallet.ledger(user),
      mode: "mock-only",
    });
  } catch {
    return res.status(503).json({ error: { code: "MOCK_WALLET_UNAVAILABLE" } });
  }
});
app.post("/api/wallet/mock/orders", async (req, res) => {
  if (!config.MOCK_FEATURES_ENABLED)
    return res.status(404).json({ error: { code: "MOCK_WALLET_DISABLED" } });
  const user = syntheticUser(req);
  if (!user) return res.status(400).json({ error: { code: "SYNTHETIC_USER_REQUIRED" } });
  const parsed = walletTopupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_PACK" } });
  try {
    return res
      .status(201)
      .json({ ok: true, order: await wallet.createOrder(user, parsed.data.packId) });
  } catch {
    return res.status(503).json({ error: { code: "MOCK_WALLET_UNAVAILABLE" } });
  }
});
app.post("/api/wallet/mock/simulate", async (req, res) => {
  if (!config.MOCK_FEATURES_ENABLED)
    return res.status(404).json({ error: { code: "MOCK_WALLET_DISABLED" } });
  const user = syntheticUser(req);
  if (!user) return res.status(400).json({ error: { code: "SYNTHETIC_USER_REQUIRED" } });
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId : "";
  try {
    if (!(await wallet.ownsOrder(user, orderId)))
      return res.status(404).json({ error: { code: "ORDER_NOT_FOUND" } });
    const eventId =
      typeof req.body?.eventId === "string" ? req.body.eventId : "mock-event-" + randomUUID();
    const type = req.body?.type;
    if (type !== "payment.captured" && type !== "payment.failed" && type !== "refund.processed")
      return res.status(400).json({ error: { code: "INVALID_MOCK_EVENT_TYPE" } });
    const raw = JSON.stringify({ id: eventId, type, orderId, amountPaise: req.body?.amountPaise });
    const signature = wallet.sign(raw, config.MOCK_WEBHOOK_SECRET);
    const result = await wallet.processWebhook(raw, signature, config.MOCK_WEBHOOK_SECRET);
    return res.json({ ok: true, ...result, mode: "mock-only" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: { code: error instanceof Error ? error.message : "MOCK_EVENT_REJECTED" } });
  }
});
app.post("/api/wallet/mock/spend", async (req, res) => {
  if (!config.MOCK_FEATURES_ENABLED)
    return res.status(404).json({ error: { code: "MOCK_WALLET_DISABLED" } });
  const user = syntheticUser(req);
  if (!user) return res.status(400).json({ error: { code: "SYNTHETIC_USER_REQUIRED" } });
  const parsed = walletSpendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_SPEND" } });
  try {
    const balance = await wallet.spend(user, parsed.data.credits, parsed.data.refId);
    return res.json({ ok: true, balance, mode: "mock-only" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MOCK_SPEND_REJECTED";
    return res.status(code === "INSUFFICIENT_CREDITS" ? 409 : 400).json({ error: { code } });
  }
});
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
app.use(express.static(webRoot, { index: false, fallthrough: true }));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(resolve(webRoot, "index.html"), (error) => {
    if (error) next(error);
  });
});
app.use((_req, res) =>
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: { en: "The requested route was not found.", hi: "यह पेज उपलब्ध नहीं है।" },
    },
  }),
);
app.use(
  (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    const id = req.requestId ?? randomUUID();
    process.stderr.write(
      JSON.stringify({
        level: "error",
        requestId: id,
        kind: err instanceof Error ? err.name : "unknown",
      }) + "\n",
    );
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        requestId: id,
        message: {
          en: "Something went wrong. Please try again.",
          hi: "कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।",
        },
      },
    });
  },
);
if (config.NODE_ENV !== "test")
  app.listen(config.API_PORT, "0.0.0.0", () =>
    process.stdout.write(
      JSON.stringify({ level: "info", event: "api_started", port: config.API_PORT }) + "\n",
    ),
  );
export { app };
