import { createClient } from "npm:@supabase/supabase-js@2.119.0";
const allowedOrigin = Deno.env.get("APP_BASE_URL") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store, private",
  Vary: "Origin",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authHeader || !url || !anon) return Response.json({ error: "NOT_CONFIGURED" }, { status: 503, headers: corsHeaders });
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: corsHeaders });
  const [profile, chats, files, wallet, ledger, usage, jobs] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    client.from("chats").select("id,title,minister,created_at,updated_at,version").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(500),
    client.from("files").select("id,kind,mime,size_bytes,created_at,expires_at,deleted_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    client.from("wallets").select("balance_credits,updated_at").eq("user_id", user.id).maybeSingle(),
    client.from("ledger_entries").select("delta_credits,reason,ref_type,ref_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1000),
    client.from("usage_events").select("feature,model,input_units,output_units,cost_paise,latency_ms,ok,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1000),
    client.from("diwan_jobs").select("id,kind,status,output_json,created_at,expires_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
  ]);
  const errors = [profile.error, chats.error, files.error, wallet.error, ledger.error, usage.error, jobs.error].filter(Boolean);
  if (errors.length) return Response.json({ error: "EXPORT_QUERY_FAILED" }, { status: 503, headers: corsHeaders });
  const chatIds = (chats.data ?? []).map((chat) => chat.id);
  let messages: Array<Record<string, unknown>> = [];
  if (chatIds.length) {
    const result = await client.from("messages").select("id,chat_id,role,content,created_at").eq("user_id", user.id).in("chat_id", chatIds).order("created_at", { ascending: true }).limit(5000);
    if (result.error) return Response.json({ error: "EXPORT_MESSAGES_FAILED" }, { status: 503, headers: corsHeaders });
    messages = result.data ?? [];
  }
  const exportedAt = new Date().toISOString();
  const payload = {
    schema_version: 1,
    exported_at: exportedAt,
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    chats: chats.data ?? [],
    messages,
    files: files.data ?? [],
    wallet: wallet.data,
    ledger: ledger.data ?? [],
    usage_events: usage.data ?? [],
    diwan_jobs: jobs.data ?? [],
    limitations: ["Private file bytes are not included; this export includes metadata only.", "Rows are capped per section; ask support for a larger export if needed."],
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-account-export-${user.id}.json"`,
    },
  });
});
