export const DEFAULT_SITE_URL = "https://novaai-4auo.onrender.com";

export function configuredSiteOrigin(siteUrl?: string): string {
  try {
    const parsed = new URL(siteUrl || DEFAULT_SITE_URL);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error("NOVA BI site URL must use HTTPS");
    }
    return parsed.origin;
  } catch {
    throw new Error("NOVA_BI_SITE_URL must be a valid HTTPS URL (localhost is allowed for development)");
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
