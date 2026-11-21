import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer, type Server } from "node:http";
const mocks = vi.hoisted(() => ({
  createAuthClient: vi.fn(),
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    refreshSession: vi.fn(),
    setSession: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    verifyOtp: vi.fn(),
    updateUser: vi.fn(),
  },
}));
vi.mock("./client.js", () => ({ createAuthClient: mocks.createAuthClient }));
import { authRouter } from "./routes.js";
const session = { access_token: "access-token", refresh_token: "refresh-token", expires_in: 3600 };
let server: Server;
let baseUrl = "";
async function request(method: string, path: string, body?: unknown, cookie?: string) {
  const headers: Record<string, string> = { origin: "http://localhost:4173" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  return fetch(baseUrl + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TEST_SERVER_NOT_STARTED");
  baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createAuthClient.mockReturnValue({ auth: mocks.auth });
  mocks.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.signInWithPassword.mockResolvedValue({
    data: { session, user: { id: "synthetic-user", email: "test@example.com" } },
    error: null,
  });
  mocks.auth.getUser.mockResolvedValue({
    data: { user: { id: "synthetic-user", email: "test@example.com" } },
    error: null,
  });
  mocks.auth.refreshSession.mockResolvedValue({ data: { session }, error: null });
  mocks.auth.setSession.mockResolvedValue({ error: null });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
});
describe("auth routes", () => {
  it("rejects cross-origin requests", async () => {
    const response = await fetch(baseUrl + "/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://attacker.invalid" },
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("ORIGIN_REJECTED");
  });
  it("validates sign-up input and accepts a valid email confirmation flow", async () => {
    expect(
      (await request("POST", "/api/auth/signup", { email: "bad", password: "short" })).status,
    ).toBe(400);
    const response = await request("POST", "/api/auth/signup", {
      email: "test@example.com",
      password: "a-long-test-password",
    });
    expect(response.status).toBe(202);
    expect((await response.json()).confirmationRequired).toBe(true);
    mocks.auth.signUp.mockResolvedValueOnce({
      data: { session, user: { id: "synthetic-user", email: "test@example.com" } },
      error: null,
    });
    const immediate = await request("POST", "/api/auth/signup", {
      email: "test@example.com",
      password: "a-long-test-password",
    });
    expect(immediate.status).toBe(202);
    expect(immediate.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("handles sign-up provider errors", async () => {
    mocks.auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("fixture"),
    });
    expect(
      (
        await request("POST", "/api/auth/signup", {
          email: "test@example.com",
          password: "a-long-test-password",
        })
      ).status,
    ).toBe(400);
  });
  it("sets httpOnly session cookies on successful sign-in", async () => {
    const response = await request("POST", "/api/auth/signin", {
      email: "test@example.com",
      password: "password",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("rejects failed sign-in", async () => {
    mocks.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("fixture"),
    });
    expect(
      (
        await request("POST", "/api/auth/signin", {
          email: "test@example.com",
          password: "password",
        })
      ).status,
    ).toBe(401);
  });
  it("returns session state and clears invalid session cookies", async () => {
    expect((await fetch(baseUrl + "/api/auth/session")).status).toBe(401);
    const response = await fetch(baseUrl + "/api/auth/session", {
      headers: { cookie: "nova_access=access-token" },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).authenticated).toBe(true);
    mocks.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("expired") });
    const expired = await fetch(baseUrl + "/api/auth/session", {
      headers: { cookie: "nova_access=bad" },
    });
    expect(expired.status).toBe(401);
    expect(expired.headers.get("set-cookie")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });
  it("refreshes sessions and rejects missing refresh tokens", async () => {
    expect((await request("POST", "/api/auth/refresh")).status).toBe(401);
    expect(
      (await request("POST", "/api/auth/refresh", {}, "nova_refresh=refresh-token")).status,
    ).toBe(200);
  });
  it("logs out and clears session cookies", async () => {
    const response = await request(
      "POST",
      "/api/auth/logout",
      {},
      "nova_access=access-token; nova_refresh=refresh-token",
    );
    expect(response.status).toBe(200);
    expect(mocks.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
  it("supports password reset, OTP confirmation and password update validation", async () => {
    expect((await request("POST", "/api/auth/password-reset", { email: "bad" })).status).toBe(400);
    expect(
      (await request("POST", "/api/auth/password-reset", { email: "test@example.com" })).status,
    ).toBe(202);
    expect(
      (await request("POST", "/api/auth/confirm", { token_hash: "short", type: "email" })).status,
    ).toBe(400);
    expect(
      (
        await request("POST", "/api/auth/confirm", {
          token_hash: "12345678901234567890",
          type: "email",
        })
      ).status,
    ).toBe(200);
    expect((await request("POST", "/api/auth/update-password", { password: "short" })).status).toBe(
      400,
    );
    expect(
      (await request("POST", "/api/auth/update-password", { password: "a-long-new-password" }))
        .status,
    ).toBe(401);
    expect(
      (
        await request(
          "POST",
          "/api/auth/update-password",
          { password: "a-long-new-password" },
          "nova_access=access-token; nova_refresh=refresh-token",
        )
      ).status,
    ).toBe(200);
  });
  it("rejects missing and malformed Origin headers", async () => {
    const missing = await fetch(baseUrl + "/api/auth/logout", { method: "POST" });
    expect(missing.status).toBe(403);
    const malformed = await fetch(baseUrl + "/api/auth/logout", {
      method: "POST",
      headers: { origin: "not-a-valid-url" },
    });
    expect(malformed.status).toBe(403);
  });
  it("clears cookies when a refresh token is rejected", async () => {
    mocks.auth.refreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("expired"),
    });
    const response = await request("POST", "/api/auth/refresh", {}, "nova_refresh=bad-token");
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  });
  it("rejects confirmation provider errors", async () => {
    mocks.auth.verifyOtp.mockResolvedValueOnce({
      data: { session: null },
      error: new Error("bad token"),
    });
    const response = await request("POST", "/api/auth/confirm", {
      token_hash: "12345678901234567890",
      type: "email",
    });
    expect(response.status).toBe(400);
  });
  it("rejects expired sessions and provider password-update failures", async () => {
    mocks.auth.setSession.mockResolvedValueOnce({ error: new Error("expired") });
    const expired = await request(
      "POST",
      "/api/auth/update-password",
      { password: "a-long-new-password" },
      "nova_access=bad; nova_refresh=bad",
    );
    expect(expired.status).toBe(401);
    mocks.auth.updateUser.mockResolvedValueOnce({ error: new Error("provider failure") });
    const failed = await request(
      "POST",
      "/api/auth/update-password",
      { password: "a-long-new-password" },
      "nova_access=access-token; nova_refresh=refresh-token",
    );
    expect(failed.status).toBe(400);
  });
  it("clears cookies on logout when no session is present", async () => {
    const response = await request("POST", "/api/auth/logout");
    expect(response.status).toBe(200);
    expect(mocks.auth.signOut).not.toHaveBeenCalled();
  });
});
