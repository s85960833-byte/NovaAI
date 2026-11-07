import { configuredSiteOrigin, createCorsHeaders, isAllowedOrigin } from "./cors.ts";

Deno.test("NOVA BI CORS allows only the configured exact origin", () => {
  const site = configuredSiteOrigin("https://nova.example.com/app");
  if (site !== "https://nova.example.com") throw new Error("Configured URL must normalize to its origin");
  if (!isAllowedOrigin("https://nova.example.com", site)) throw new Error("Configured origin was rejected");
  if (isAllowedOrigin("https://evil.example", site)) throw new Error("Untrusted origin was accepted");
  if (isAllowedOrigin("https://nova.example.com.evil.test", site)) throw new Error("Lookalike origin was accepted");
  if (isAllowedOrigin("null", site)) throw new Error("Opaque origin was accepted");
  if (!isAllowedOrigin(null, site)) throw new Error("Non-browser server request should remain supported");
});

Deno.test("NOVA BI CORS rejects insecure public site URLs", () => {
  let rejected = false;
  try { configuredSiteOrigin("http://nova.example.com"); } catch { rejected = true; }
  if (!rejected) throw new Error("Insecure public site URL was accepted");
});

Deno.test("NOVA BI CORS headers never use wildcard origins", () => {
  const headers = createCorsHeaders("https://nova.example.com");
  if (headers["Access-Control-Allow-Origin"] !== "https://nova.example.com") throw new Error("Exact origin header missing");
  if (headers["Access-Control-Allow-Origin"] === "*") throw new Error("Wildcard CORS is forbidden");
  if (headers["Vary"] !== "Origin") throw new Error("Vary: Origin header missing");
});
