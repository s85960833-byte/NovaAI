import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {
  authConfirmSchema,
  authSignInSchema,
  authSignUpSchema,
  authEmailSchema,
} from "@nova/shared/schemas";
import { config } from "../config.js";
import { createAuthClient } from "./client.js";
const router = Router();
const accessCookie = "nova_access";
const refreshCookie = "nova_refresh";
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
});
function sameOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.header("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(config.APP_BASE_URL).origin)
      return res.status(403).json({ error: { code: "ORIGIN_REJECTED" } });
  } catch {
    return res.status(403).json({ error: { code: "ORIGIN_REJECTED" } });
  }
  next();
}
function unavailable(res: Response) {
  return res
    .status(503)
    .json({
      error: {
        code: "AUTH_NOT_CONFIGURED",
        message: {
          en: "Sign-in is not configured on this staging build.",
          hi: "इस staging बिल्ड में साइन-इन सेट नहीं है।",
        },
      },
    });
}
function setSessionCookies(
  res: Response,
  session: { access_token: string; refresh_token: string; expires_in: number },
) {
  const secure = config.NODE_ENV === "production";
  res.cookie(accessCookie, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, session.expires_in) * 1000,
  });
  res.cookie(refreshCookie, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
function clearSessionCookies(res: Response) {
  const secure = config.NODE_ENV === "production";
  res.clearCookie(accessCookie, { httpOnly: true, secure, sameSite: "lax", path: "/" });
  res.clearCookie(refreshCookie, { httpOnly: true, secure, sameSite: "lax", path: "/api/auth" });
}
router.post("/signup", authLimiter, sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const parsed = authSignUpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  const { data, error } = await client.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: new URL("/auth/confirm", config.APP_BASE_URL).toString() },
  });
  if (error)
    return res
      .status(400)
      .json({
        error: {
          code: "SIGNUP_FAILED",
          message: {
            en: "Could not create the account. Check the details and try again.",
            hi: "खाता नहीं बन पाया। जानकारी जाँचकर फिर कोशिश करें।",
          },
        },
      });
  if (data.session) setSessionCookies(res, data.session);
  return res
    .status(202)
    .json({
      ok: true,
      confirmationRequired: !data.session,
      message: {
        en: "Check your email to confirm the account.",
        hi: "खाता पक्का करने के लिए अपना ईमेल देखें।",
      },
    });
});
router.post("/signin", authLimiter, sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const parsed = authSignInSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INPUT" } });
  const { data, error } = await client.auth.signInWithPassword(parsed.data);
  if (error || !data.session)
    return res
      .status(401)
      .json({
        error: {
          code: "SIGNIN_FAILED",
          message: {
            en: "Email or password was not accepted.",
            hi: "ईमेल या पासवर्ड सही नहीं है।",
          },
        },
      });
  setSessionCookies(res, data.session);
  return res.json({ ok: true, user: { id: data.user.id, email: data.user.email } });
});
router.get("/session", async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const token = req.cookies?.[accessCookie];
  if (typeof token !== "string") return res.status(401).json({ authenticated: false });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    clearSessionCookies(res);
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, user: { id: data.user.id, email: data.user.email } });
});
router.post("/refresh", sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const refresh = req.cookies?.[refreshCookie];
  if (typeof refresh !== "string")
    return res.status(401).json({ error: { code: "SESSION_EXPIRED" } });
  const { data, error } = await client.auth.refreshSession({ refresh_token: refresh });
  if (error || !data.session) {
    clearSessionCookies(res);
    return res.status(401).json({ error: { code: "SESSION_EXPIRED" } });
  }
  setSessionCookies(res, data.session);
  return res.json({ ok: true });
});
router.post("/logout", sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (client) {
    const access = req.cookies?.[accessCookie];
    const refresh = req.cookies?.[refreshCookie];
    if (typeof access === "string" && typeof refresh === "string") {
      await client.auth.setSession({ access_token: access, refresh_token: refresh });
      await client.auth.signOut({ scope: "global" });
    }
  }
  clearSessionCookies(res);
  return res.json({ ok: true });
});
router.post("/password-reset", authLimiter, sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const parsed = authEmailSchema.safeParse(req.body?.email);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_EMAIL" } });
  const { error } = await client.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: new URL("/auth/reset", config.APP_BASE_URL).toString(),
  });
  if (error) return res.status(400).json({ error: { code: "RESET_REQUEST_FAILED" } });
  return res
    .status(202)
    .json({
      ok: true,
      message: {
        en: "If the account exists, a reset email will be sent.",
        hi: "यदि यह खाता मौजूद है, तो पासवर्ड रीसेट ईमेल भेजा जाएगा।",
      },
    });
});
router.post("/confirm", sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const parsed = authConfirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_CONFIRMATION" } });
  const { data, error } = await client.auth.verifyOtp(parsed.data);
  if (error || !data.session)
    return res.status(400).json({ error: { code: "CONFIRMATION_FAILED" } });
  setSessionCookies(res, data.session);
  return res.json({ ok: true });
});
router.post("/update-password", sameOrigin, async (req, res) => {
  const client = createAuthClient();
  if (!client) return unavailable(res);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password.length < 12 || password.length > 128)
    return res.status(400).json({ error: { code: "INVALID_PASSWORD" } });
  const access = req.cookies?.[accessCookie];
  const refresh = req.cookies?.[refreshCookie];
  if (typeof access !== "string" || typeof refresh !== "string")
    return res.status(401).json({ error: { code: "SESSION_REQUIRED" } });
  const { error: sessionError } = await client.auth.setSession({
    access_token: access,
    refresh_token: refresh,
  });
  if (sessionError) return res.status(401).json({ error: { code: "SESSION_EXPIRED" } });
  const { error } = await client.auth.updateUser({ password });
  if (error) return res.status(400).json({ error: { code: "PASSWORD_UPDATE_FAILED" } });
  return res.json({ ok: true });
});
export { router as authRouter };
