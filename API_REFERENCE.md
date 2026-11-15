# NOVA AI — Current API Surface

**Status:** Source inventory for the PR #98 candidate. This is not a public API contract, SDK, webhook service or uptime guarantee.

## Express routes found in `nova-server.txt`

| Method | Route | Function | Important limitation |
|---|---|---|---|
| GET | `/health` | Process liveness | Does not validate AI providers, Auth, DB, or user experience |
| GET | `/api/config` | Client-safe runtime configuration | Public read-only exception under optional API-auth gate |
| GET | `/api/feed` | News/feed response | Public read-only exception; source/provider rights still apply |
| POST | `/api/chat/completions` | Chat completion | Requires a configured model provider; not a customer billing API |
| POST | `/api/search` | Search/retrieval | Provider availability and commercial rights vary |
| POST | `/api/live` | Live data/retrieval | Freshness and provider rights vary |
| POST | `/api/image` | Image job submission | Paid generation disabled by default; commercial rights remain open |
| GET | `/api/image/status/:id` | Image job polling | Candidate user binding applies only when auth is enabled |
| POST | `/api/transcribe` | Speech transcription | Provider configuration and physical microphone test required |
| GET | `/api/live/selftest` | Operator diagnostics | 404 unless `LIVE_SELFTEST_ENABLED=1`; keep disabled outside supervised tests |
| GET | `/`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/sw.js` | App and PWA assets | Static delivery, not an external developer API |

## Optional Express authentication

- `NOVA_API_AUTH_REQUIRED=1` protects `/api/*` except read-only `/api/config` and `/api/feed`.
- The browser forwards its current Supabase access token; Express verifies it against the configured HTTPS Supabase Auth user endpoint.
- Missing/invalid tokens return 401; Auth service outage fails closed with 503.
- Missing Supabase URL/publishable key prevents startup when enabled.
- **Default remains 0.** The deployed Express API must be treated as unauthenticated until enabled and tested live.
- NOVA BI's Edge Function has its own JWT verification and DB-backed per-user request limit; that does not secure the separate Express API.

## Quotas and billing

Express user/IP rate windows are process-local and reset when the process restarts. They are not durable per-user quotas, monthly usage accounting, plan entitlements, abuse controls or hard provider spend caps. Do not expose billable public traffic until all are implemented and tested.

## Not implemented

- Public OpenAPI specification and stable semantic API versioning.
- TypeScript/JavaScript SDK or client libraries.
- Signed outbound webhooks with retries, replay protection and idempotency.
- External developer keys, organization billing, usage dashboard or API SLA.
- Plugin manifest, permission model, sandbox or marketplace.

Before public API launch, add schema/version contracts, authentication, tenant boundaries, durable quotas, spend kill switches, SDK conformance, signed/replay-protected webhooks and load/recovery tests.
