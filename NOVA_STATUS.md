# NOVA Status — Current Source of Truth

Last verified: 12 November 2026 (UTC; exact-head CI and Render Staging recheck)
Repository: https://github.com/s85960833-byte/NovaAI
Production: https://novaai-4auo.onrender.com (main branch; unchanged)
Candidate: PR #98 — https://github.com/s85960833-byte/NovaAI/pull/98
Candidate branch: `fix/nova-home-learn-first-mobile-20261109`
Latest exact PR head with passing Main + Browser CI: `15208ab028074f9c18deebd80934da8df2846922` (documentation-only refresh atop code-bearing revision `1634a1f9563c190d83119a680af811a688120c7d`)

## Exact-head CI evidence

- PR #98 is Open, Draft, unmerged, and targets `main`. Production main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; no candidate merge or Production deployment has occurred.
- Main verification [run 43219573881](https://github.com/s85960833-byte/NovaAI/actions/runs/43219573881) passed on exact PR head `15208ab`: 44 successful steps, 4 release/live steps skipped, 0 failed.
- Browser verification [run 43219573641](https://github.com/s85960833-byte/NovaAI/actions/runs/43219573641) passed on the same exact head: 16 successful steps, 0 skipped, 0 failed.
- Both push-triggered and pull-request-triggered workflows completed successfully on `15208ab`; older superseded runs that were canceled during rapid commits are not counted as failures.
- The candidate fixed a rate-limit key mismatch: Live Search and image-generation counters previously looked up the authenticated user key but wrote the timestamp array under the IP key. Both now read and write the same user/IP key; regression assertions were added. Both exact-head CI workflows passed after this fix.
- New API-auth test step passed on exact head. It covers HTTPS-only Supabase URL validation, missing/malformed/oversized bearer tokens, valid user identity mapping, invalid/expired token rejection, malformed/oversized Auth response, upstream outage fail-closed behavior, startup configuration checks, auth gate ordering before JSON parsing, browser bearer-token forwarding, image-job owner binding and user-scoped live/image rate keys.
- Main coverage also includes dependency SBOM, syntax, provider defaults, Markdown injection escaping, mode registry, Cloud Sync merge/conflict, bounded IP rate window/timezone, environment/container configuration, accessibility, HTTPS provider URLs, safe redirects/bounded reads, AI Horde privacy, PDF.js mitigation, PostgreSQL migration + tenant RLS, Deno Edge Function type-check/invitation tests, BI calculations/CSV validation, 60-case AI evaluation, npm dependency audit, local routes/PWA, graceful shutdown and Docker build/health.
- The four skipped Main CI steps are deployed NOVA BI Edge Function auth/CORS smoke, waiting for a merged revision on Render, live Production website/provider smoke, and live free image-generation smoke. Skipped does not mean passed.
- Browser emulation is not physical Android certification. CI does not prove live credentials, email delivery, real microphone capture or handset layout.

## Supabase read-only audit

- Project `qrfwsewppafhxibdboam` is ACTIVE_HEALTHY, PostgreSQL 17.
- Latest Security Advisor: zero lints. Latest Health Advisor: zero lints.
- Performance Advisor: 13 INFO-level unused-index notices. No index was dropped; retain until representative query traffic supports safe removal.
- NOVA BI Edge Function `nova-bi-api` is ACTIVE version 14 with `verify_jwt=true`. Its deployed code uses authenticated user context, exact-site-origin CORS, database-backed per-user rate limits and tenant-scoped operations. Live valid/invalid-token, email-delivery, redirect allow-list and two-account isolation tests remain outstanding.
- No Supabase schema, user, project, secrets or deployment changes were made in the read-only audit.

## Express API authentication work

- Added `nova-api-auth.js`: validates a configured HTTPS Supabase project origin, accepts only bounded Bearer tokens, verifies each token server-side through Supabase Auth `/auth/v1/user`, caps the streamed Auth user response at 64 KiB, rejects invalid sessions with 401 and returns 503 on Auth service outages.
- When `NOVA_API_AUTH_REQUIRED=1`, middleware protects all `/api/*` routes except read-only `/api/config` and `/api/feed`; it runs before JSON body parsing. Missing `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` fails startup.
- Browser account code forwards the current Supabase access token to same-origin protected API calls; server verification remains authoritative.
- Image jobs are bound to the authenticated user when the gate is enabled, preventing cross-account polling.
- Live-search and image rate windows use authenticated user IDs when available, falling back to IP. These are process-local rate windows only, not durable monthly quotas.
- The feature flag default is deliberately `NOVA_API_AUTH_REQUIRED=0`. It has **not** been enabled on Staging or Production; therefore the deployed Express API remains unauthenticated until an operator enables the flag and verifies live sessions. Do not enable public paid-provider traffic yet.
- Durable per-user quotas, plan entitlements, monthly accounting and hard spend caps are not implemented.

## Staging / Production

- Staging service: `srv-dbqm035g1s2s73eogao0`, https://novaai-pr98-staging.onrender.com
- Staging Auto Deploy is enabled and tracks the candidate branch, but latest recorded Live deployment remains old commit `195739a04895de364a5af22aa61f930d5d782cbb`, not the candidate. Latest deploy/build events on 12 November ended successfully for this old revision; no later candidate deployment is recorded.
- Render Staging Health Check Path is blank. Owner must set `/health` in Staging Dashboard → Settings → Health Checks and save. The connected Render tools do not expose a Health Check Path update action; do not bypass this step with a manual deploy.
- Render app logs show successful process starts on port 10000 and clean SIGTERM/graceful-shutdown messages; no fatal stack trace appears in the inspected sample. Root cause of repeated process restarts is not established. Render HTTP/latency/resource metrics returned empty data, and direct staging HTTP checks could not resolve the hostname from the current audit environment; live health is therefore unverified, not passed.
- Production service remains on deployed commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`; Production has not been changed by this PR.

## Remaining release blockers

1. Staging must run the latest candidate and pass live smoke. Enable the auth gate only on Staging first; test missing, invalid, expired and valid sessions and confirm sign-in UX before Production.
2. Durable per-user quotas, monthly usage accounting, plan entitlements, abuse controls and hard provider spend caps remain incomplete. Process-local IP/user windows reset on restart and are not commercial usage controls.
3. Physical Android full-width layout, touch interactions, drawer behavior and real microphone capture require owner handset testing.
4. Self-service account deletion, complete retention workflow and published retention schedule are incomplete. Deleting cloud backup is not full account deletion.
5. Provider commercial-use rights, quotas, key validity and transfer rights are not all cleared. See `API_INTEGRATION_AUDIT.md`; overall API audit remains NOT PASSED.
6. Privacy Notice and Terms are drafts. Business operator, support/grievance details, age/consent policy and retention terms require owner evidence and qualified legal review.
7. Full source, asset and IP provenance; ownership/assignment evidence; external-host deployment; backup/restore drill; two-device sync; live Auth email; uptime/load evidence; and rollback drill remain incomplete.
8. No customer, revenue, traction, testimonial, buyer interest, certification, valuation or exclusivity evidence has been established. ₹10–20 crore remains an aspirational target, not a present valuation or guarantee.

## Current release decision

**NO-GO for Production.** Keep PR #98 Draft and unmerged. Do not change Production until latest-head Staging, live smoke, physical-device, Express API authentication/quota, data-lifecycle, provider-rights, legal/IP, rollback and owner-approval gates are satisfied.

## Owner-dependent next action

Open the [Staging Render Dashboard](https://dashboard.render.com/web/srv-dbqm035g1s2s73eogao0) and click **Settings**. After that, the next step is **Health Checks** → set `/health` → Save. Wait for owner confirmation before proceeding to the next click. Continue independent work while waiting.

## Scope and estimate

Overall S-tier Definition of Done: approximately 25% complete (working estimate across product, security, operations, legal/IP and buyer evidence; latest CI is green, but Staging/physical/legal/usage-control gates remain open).
Buyer-readiness: approximately 37/100 (qualitative internal estimate, not an appraisal).
