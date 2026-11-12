# NOVA Status — Current Source of Truth

Last verified: 12 November 2026 (UTC)
Repository: https://github.com/s85960833-byte/NovaAI
Production: https://novaai-4auo.onrender.com (main branch; unchanged)
Candidate: PR #98 — https://github.com/s85960833-byte/NovaAI/pull/98
Candidate branch: `fix/nova-home-learn-first-mobile-20261109`
Candidate head verified before this status-only update: `329e9ef0d552aa878852706a00e3b0138c4d84c3`

## Verified candidate checks

- PR #98 is Open, Draft, unmerged, and targets `main`. Production main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; no candidate merge or Production deployment has occurred.
- Main verification [run 43213818437](https://github.com/s85960833-byte/NovaAI/actions/runs/43213818437) completed successfully on exact candidate head `329e9ef`: 43 workflow steps passed, 4 release/live steps were skipped, and 0 failed.
- Browser verification [run 43213818426](https://github.com/s85960833-byte/NovaAI/actions/runs/43213818426) completed successfully on the same exact head.
- Main CI passed: dependency SBOM validation, backend/frontend syntax, provider defaults, Markdown injection escaping, mode registry, cloud-sync merge/conflict tests, rate-window/timezone tests, environment documentation, Docker config/secret exclusions, accessibility names, HTTPS provider URLs, safe redirects/bounded reads, AI Horde privacy, PDF.js mitigation, PostgreSQL migration + tenant RLS integration, Deno dependency install/type-check/invitation tests, BI calculations/CSV validation, 60-case AI evaluation fixture, npm production dependency audit, local route/PWA smoke, graceful shutdown, Docker build/health smoke, Chromium browser tests, Company Cloud mobile browser flows, and five-viewport mobile/drawer regression.
- The four skipped checks are deployed NOVA BI Edge Function auth/CORS smoke, waiting for a merged revision on Render, live Production website/provider smoke, and live free image-generation smoke. They are skipped because this is an unmerged feature branch, not passed checks.
- Browser logs confirmed: Learn/Build/Agents separation, Agents chat and history, mocked Hindi voice transcription flow, Image Studio job polling, Learn photo-question launch, Android-sized touch navigation, reduced-motion behavior, no browser page errors/CSP violations, Company Cloud CSV/risk/scenario/workflow/Action Proof flows, account signup/reset/recovery UI, invitations, export, and mobile flows. Five-viewport Playwright suite: 7/7 passed. Browser emulation is not physical Android certification.
- CI run details are automated tests against local test services and fixtures. They do not prove real provider account validity, production traffic, real email delivery, or physical handset behavior.

## Supabase configuration audit (read-only)

- Project `qrfwsewppafhxibdboam` reports ACTIVE_HEALTHY, PostgreSQL 17.
- Latest Security Advisor: zero lints. Latest Health Advisor: zero lints.
- Performance Advisor: 13 INFO-level unused-index notices. These indexes are retained pending representative real traffic; no index was dropped.
- `nova-bi-api` Edge Function is ACTIVE version 14 with JWT verification enabled. This does not replace live valid/invalid-token, email-delivery, redirect-allow-list or two-account cross-tenant testing.
- This was a read-only check; no Supabase schema, user, project or deployment changes were made.

## Staging / Production

- Staging service: `srv-dbqm035g1s2s73eogao0`, https://novaai-pr98-staging.onrender.com
- Staging Auto Deploy is enabled and tracks the candidate branch, but latest Live deployment is still old commit `195739a04895de364a5af22aa61f930d5d782cbb`, not candidate head `329e9ef0d552aa878852706a00e3b0138c4d84c3`.
- Render Staging Health Check Path is blank. Owner must set `/health` in Staging Dashboard → Settings → Health Checks and save. No manual Production deployment is authorized.
- Production service and URL remain unchanged. No Production merge or deploy has been performed.

## Release blockers

1. Public Express AI endpoints (including chat, search, image, live retrieval and transcription) do not enforce account authentication. Current in-memory per-IP throttles are not durable per-user/monthly quotas or hard spend limits. Do not expose billable provider keys or public paid-provider traffic until robust authentication, abuse controls and spend caps are implemented and verified.
2. Staging is not running the candidate head; live smoke tests are therefore not verified.
3. Physical Android full-width layout, touch interactions, drawer behavior and real microphone capture require owner handset testing.
4. Real self-service account deletion, complete retention workflow and published retention schedule are incomplete; deleting cloud backup is not full account deletion.
5. Provider commercial-use rights, quotas, key validity and transfer rights are not all cleared. See `API_INTEGRATION_AUDIT.md`; overall API audit remains NOT PASSED.
6. Privacy Notice and Terms are drafts. Business operator, support/grievance details, age/consent policy and retention terms require owner evidence and qualified legal review.
7. Full source, asset and IP provenance; ownership/assignment evidence; external-host deployment; backup/restore drill; two-device sync; live Auth email; uptime/load evidence; and rollback drill remain incomplete.
8. No customer, revenue, traction, testimonial, buyer interest, certification, valuation or exclusivity evidence has been established. ₹10–20 crore remains an aspirational target, not a present valuation or guarantee.

## Current release decision

**NO-GO for Production.** Keep PR #98 Draft and unmerged. Do not change Production until latest-head Staging, live smoke, physical-device, authentication/quota, data-lifecycle, provider-rights, legal/IP, rollback and owner-approval gates are satisfied.

## Owner-dependent next action

Open the [Staging Render Dashboard](https://dashboard.render.com/web/srv-dbqm035g1s2s73eogao0), click **Settings**, then open **Health Checks**, set path to `/health`, and save. The current owner instruction is to complete the Settings/Health Checks step; until confirmed, do not claim Staging has the candidate deployment.

## Scope and estimate

Overall S-tier Definition of Done: approximately 23% complete (working estimate across product, security, operations, legal/IP and buyer evidence).
Buyer-readiness: approximately 37/100 (qualitative internal estimate, not an appraisal).
