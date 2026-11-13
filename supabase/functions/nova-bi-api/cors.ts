export const DEFAULT_SITE_URL = "https://novaai-4auo.onrender.com";

export function configuredSiteOrigin(siteUrl?: string): string {
  try {
    const parsed = new URL(siteUrl || DEFAULT_SITE_URL);
    const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
    const localHttp = parsed.protocol === "http:" && localHosts.has(parsed.hostname);
    if (parsed.protocol !== "https:" && !localHttp) {
      throw new Error("NOVA BI site URL must use HTTPS (HTTP is allowed only for loopback development)");
    }
    if (parsed.username || parsed.password) {
      throw new Error("NOVA BI site URL must not contain credentials");
    }
    return parsed.origin;
  } catch {
    throw new Error("NOVA_BI_SITE_URL must be a valid HTTPS URL (HTTP loopback is allowed for development)");
  }
}

export function isAllowedOrigin(origin: string | null, siteOrigin: string): boolean {
  return origin === null || origin === siteOrigin;
}

export function createCorsHeaders(siteOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": siteOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, idempotency-key",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}


/**
 * Apply the site-origin policy before authentication so browser preflights do
 * not fall through to the auth wrapper. The wrapped handler must use
 * withSupabase({ cors: "disabled" }) so its default wildcard CORS cannot
 * override this exact-origin policy.
 */
export function withSiteOrigin(
  handler: (request: Request) => Promise<Response>,
  siteOrigin: string,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin, siteOrigin)) {
      return new Response("Origin not allowed", {
        status: 403,
        headers: { "Vary": "Origin" },
      });
    }

    if (request.method === "OPTIONS") {
      if (!origin) {
        return new Response("Origin required", {
          status: 400,
          headers: { "Vary": "Origin" },
        });
      }
      return new Response("ok", { headers: createCorsHeaders(siteOrigin) });
    }

    const response = await handler(request);
    const headers = new Headers(response.headers);
    const vary = headers.get("Vary");
    headers.set("Vary", vary ? vary.split(/,\\s*/).includes("Origin") ? vary : vary + ", Origin" : "Origin");
    if (origin) {
      for (const [name, value] of Object.entries(createCorsHeaders(siteOrigin))) {
        headers.set(name, value);
      }
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
