import { configuredSiteOrigin, createCorsHeaders, isAllowedOrigin, withSiteOrigin } from "./cors.ts";

Deno.test("NOVA BI CORS allows only the configured exact origin", () => {
  const site = configuredSiteOrigin("https://nova.example.com/app");
  if (site !== "https://nova.example.com") throw new Error("Configured URL must normalize to its origin");
  if (!isAllowedOrigin("https://nova.example.com", site)) throw new Error("Configured origin was rejected");
  if (isAllowedOrigin("https://evil.example", site)) throw new Error("Untrusted origin was accepted");
  if (isAllowedOrigin("https://nova.example.com.evil.test", site)) throw new Error("Lookalike origin was accepted");
  if (isAllowedOrigin("null", site)) throw new Error("Opaque origin was accepted");
  if (!isAllowedOrigin(null, site)) throw new Error("Non-browser server request should remain supported");
});

Deno.test("NOVA BI CORS accepts HTTP only for loopback development hosts", () => {
  for (const url of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
    const parsed = configuredSiteOrigin(url);
    if (parsed !== new URL(url).origin) throw new Error("Loopback development origin was not normalized: " + url);
  }
});

Deno.test("NOVA BI CORS rejects insecure public and unsupported loopback schemes", () => {
  for (const url of [
    "http://nova.example.com",
    "ftp://localhost",
    "file://localhost",
    "ws://127.0.0.1:3000",
  ]) {
    let rejected = false;
    try { configuredSiteOrigin(url); } catch { rejected = true; }
    if (!rejected) throw new Error("Unsupported site URL scheme was accepted: " + url);
  }
});

Deno.test("NOVA BI CORS rejects URL credentials", () => {
  let rejected = false;
  try { configuredSiteOrigin("https://user:password@nova.example.com"); } catch { rejected = true; }
  if (!rejected) throw new Error("Site URL credentials must not be accepted");
});

Deno.test("NOVA BI CORS headers never use wildcard origins", () => {
  const headers = createCorsHeaders("https://nova.example.com");
  if (headers["Access-Control-Allow-Origin"] !== "https://nova.example.com") throw new Error("Exact origin header missing");
  if (String(headers["Access-Control-Allow-Origin"]) === "*") throw new Error("Wildcard CORS is forbidden");
  if (headers["Vary"] !== "Origin") throw new Error("Vary: Origin header missing");
  const allowedHeaders = headers["Access-Control-Allow-Headers"].toLowerCase().split(",").map((value) => value.trim());
  for (const required of ["authorization", "apikey", "content-type", "x-client-info", "idempotency-key"]) {
    if (!allowedHeaders.includes(required)) throw new Error("Required browser request header is not allowed: " + required);
  }
  const allowedMethods = headers["Access-Control-Allow-Methods"].toUpperCase().split(",").map((value) => value.trim());
  for (const required of ["GET", "POST", "DELETE", "OPTIONS"]) {
    if (!allowedMethods.includes(required)) throw new Error("Required browser request method is not allowed: " + required);
  }
});


Deno.test("NOVA BI handles preflight before authentication and never reflects an untrusted origin", async () => {
  const site = "https://nova.example.com";
  let handlerCalls = 0;
  const wrapped = withSiteOrigin(async () => {
    handlerCalls += 1;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }, site);

  const preflight = await wrapped(new Request(site + "/functions/v1/nova-bi-api/me", {
    method: "OPTIONS",
    headers: {
      Origin: site,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, apikey, content-type",
    },
  }));
  if (preflight.status !== 200) throw new Error("Allowed preflight must succeed before auth");
  if (preflight.headers.get("Access-Control-Allow-Origin") !== site) throw new Error("Preflight must use the exact site origin");
  if (handlerCalls !== 0) throw new Error("Preflight must not invoke the authenticated handler");

  const denied = await wrapped(new Request(site + "/functions/v1/nova-bi-api/me", {
    method: "OPTIONS",
    headers: { Origin: "https://attacker.example", "Access-Control-Request-Method": "POST" },
  }));
  if (denied.status !== 403) throw new Error("Untrusted preflight origin must be rejected");
  if (denied.headers.has("Access-Control-Allow-Origin")) throw new Error("Untrusted origin must not receive CORS permission");
  if (handlerCalls !== 0) throw new Error("Untrusted preflight must not invoke the handler");

  const response = await wrapped(new Request(site + "/functions/v1/nova-bi-api/me", {
    headers: { Origin: site },
  }));
  if (response.status !== 200) throw new Error("Allowed request must reach the handler");
  if (response.headers.get("Access-Control-Allow-Origin") !== site) throw new Error("Authenticated responses must use the exact site origin");
  if (Number(handlerCalls) !== 1) throw new Error("Allowed non-preflight request should invoke the handler once");
});
