import { createClient } from "npm:@supabase/supabase-js@2.119.0";
function constantTimeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: { "Cache-Control": "no-store" } });
  const expected = Deno.env.get("CRON_SECRET") ?? "";
  const supplied = req.headers.get("x-cron-secret") ?? "";
  if (!expected || !constantTimeEqual(expected, supplied)) return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return Response.json({ error: "NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = Deno.env.get("PRIVATE_FILE_BUCKET") ?? "private-documents";
  const { data: rows, error } = await admin.from("files").select("id,storage_key").is("deleted_at", null).lt("expires_at", new Date().toISOString()).limit(100);
  if (error) return Response.json({ error: "EXPIRED_FILE_LOOKUP_FAILED" }, { status: 503 });
  const safe = (rows ?? []).filter((row) => typeof row.storage_key === "string" && row.storage_key.startsWith(row.user_id ? row.user_id + "/" : "__never__"));
  const keys = safe.map((row) => row.storage_key);
  if (keys.length) {
    const { error: storageError } = await admin.storage.from(bucket).remove(keys);
    if (storageError) return Response.json({ error: "EXPIRED_FILE_STORAGE_DELETE_FAILED" }, { status: 503 });
  }
  const ids = safe.map((row) => row.id);
  if (ids.length) {
    const { error: rowError } = await admin.from("files").delete().in("id", ids);
    if (rowError) return Response.json({ error: "EXPIRED_FILE_ROW_DELETE_FAILED" }, { status: 503 });
  }
  return Response.json({ ok: true, expiredRowsFound: (rows ?? []).length, deleted: ids.length }, { headers: { "Cache-Control": "no-store" } });
});
