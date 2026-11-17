import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";
export function createAuthClient() {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) return null;
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
export function authConfigured() {
  return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
}
