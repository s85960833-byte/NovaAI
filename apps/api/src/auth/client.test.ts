import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  config: { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" },
  createClient: vi.fn(),
}));
vi.mock("../config.js", () => ({ config: mocks.config }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
import { authConfigured, createAuthClient } from "./client.js";
beforeEach(() => {
  mocks.config.SUPABASE_URL = "";
  mocks.config.SUPABASE_ANON_KEY = "";
  mocks.createClient.mockReset();
});
it("fails closed when hosted auth credentials are absent", () => {
  expect(authConfigured()).toBe(false);
  expect(createAuthClient()).toBeNull();
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("creates a stateless server client only when both credentials exist", () => {
  mocks.config.SUPABASE_URL = "https://synthetic-project.supabase.co";
  mocks.config.SUPABASE_ANON_KEY = "synthetic-anon-key";
  mocks.createClient.mockReturnValue({ auth: {} });
  expect(authConfigured()).toBe(true);
  expect(createAuthClient()).toEqual({ auth: {} });
  expect(mocks.createClient).toHaveBeenCalledWith(
    "https://synthetic-project.supabase.co",
    "synthetic-anon-key",
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );
});
