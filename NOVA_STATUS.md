# NOVA Status — Current Source of Truth

Last verified: 12 November 2026 (UTC)
Repository: https://github.com/s85960833-byte/NovaAI
Production: https://novaai-4auo.onrender.com (main branch; unchanged)
Candidate: PR #98 — https://github.com/s85960833-byte/NovaAI/pull/98
Candidate branch: `fix/nova-home-learn-first-mobile-20261109`
Latest code-bearing candidate revision: `329e9ef0d552aa878852706a00e3b0138c4d84c3`
Latest status/documentation revision: `cd6dd435b1a0615abd6365009a01d9721c173ef9`

## Latest exact-head CI evidence

- PR #98 is Open, Draft, unmerged, and targets `main`. Production main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; no candidate merge or Production deployment has occurred.
- Main verification [run 43214222636](https://github.com/s85960833-byte/NovaAI/actions/runs/43214222636) passed on exact candidate head `cd6dd43`: 43 successful steps, 4 release/live steps skipped, 0 failed.
- Browser verification [run 43214222643](https://github.com/s85960833-byte/NovaAI/actions/runs/43214222643) passed on the same exact head: 16 successful steps, 0 skipped, 0 failed.
- Coverage includes dependency SBOM, syntax, provider defaults, Markdown injection escaping, mode registry, Cloud Sync merge/conflict, bounded rate-window/timezone, environment/container configuration, accessibility names, HTTPS provider URLs, safe redirects/bounded reads, AI Horde privacy, PDF.js mitigation, PostgreSQL migration + tenant RLS, Deno Edge Function type-check/invitation tests, BI calculations/CSV validation, 60-case AI evaluation, npm production dependency audit, local routes/PWA, graceful shutdown, Docker build/health, Chromium browser checks, Company Cloud mobile browser workflows and five-viewport mobile/drawer regression.
- The four skipped Main CI steps are deployed NOVA BI Edge Function auth/CORS smoke, waiting for a merged revision on Render, live Production website/provider smoke, and live free image-generation smoke. Skipped does not mean passed.
- Browser emulation is not physical Android certification. CI uses local test services and fixtures; it does not prove real provider credentials, production traffic, email delivery or physical handset behavior.
- A status-only documentation commit is now being added after these results; its own workflow checks must be read from the live PR Checks tab. No executable code changes are included in that status-only commit.

## Supabase read-only audit

- Project `qrfwsewppafhxibdboam` is ACTIVE_HEALTHY, PostgreSQL 17.
- Latest Security Advisor: zero lints. Latest Health Advisor: zero lints.
- Performance Advisor: 13 INFO-level unused-index notices. No index was dropped; retain until representative query traffic supports safe removal.
- NOVA BI Edge Function `nova-bi-api` is ACTIVE version 14 with `verify_jwt=true`. Its deployed code uses authenticated user context, exact-site-origin CORS, database-backed per-user rate limits and tenant-scoped operations. Live valid/invalid-token, email-delivery, redirect allow-list and two-account isolation tests remain outstanding.
- This was a read-only audit. No Supabase schema, user, project, secrets or deployment changes were made.

## Staging / Production

- Staging service: `srv-dbqm035g1s2s73eogao0`, https://novaai-pr98-staging.onrender.com
- Staging Auto Deploy is enabled and tracks the candidate branch, but latest Live deployment is still old commit `195739a04895de364a5af22aa61f930d5d782cbb`, not the candidate.
- Render Staging Health Check Path is blank. Owner must set `/health` in Staging Dashboard → Settings → Health Checks and save. No manual Production deployment is authorized.
- Production service remains on deployed commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`; Production has not been changed by this PR.

## Release blockers

1. Public Express AI endpoints (`/api/chat/completions`, `/api/search`, `/api/image`, `/api/image/status/:id`, `/api/live`, `/api/transcribe`, and feeds) do not enforce account authentication. Process-local per-IP throttles are not durable per-user/monthly quotas or hard spend caps. The separate NOVA BI Supabase Edge Function's JWT verification does not protect these Express routes. Do not expose billable provider keys or public paid-provider traffic until robust authentication, abuse controls and spend protection are implemented and verified.
2. Staging is not running the latest candidate; live smoke tests are unverified.
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

Overall S-tier Definition of Done: approximately 23% complete (working estimate across product, security, operations, legal/IP and buyer evidence).
Buyer-readiness: approximately 37/100 (qualitative internal estimate, not an appraisal).
