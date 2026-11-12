# NOVA Status — Source of Truth

**Last verified:** 12 Nov 2026, 13:38 UTC  
**Repo:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production Dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80  
**PR:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Candidate branch:** `fix/nova-home-learn-first-mobile-20261109`

## Phase status
- Phase 1 audit: **IN PROGRESS** — source, route, CI, screenshot, Docker/SBOM and limited Supabase/Render review done; current-head live Staging and physical-device evidence missing.
- Phase 2 differentiation: **NOT PROVEN** — evidence-first, bilingual learning/build, decision-trace and portable handoff are hypotheses; no exclusive claim.
- Phase 3 asset engineering: **PARTIAL** — architecture, API, cost, roadmap, transfer and Data Room docs; durable quotas, subscriptions, SDK/webhooks/plugins, account deletion and restore proof missing.
- Phase 4 buyer pack: **PARTIAL** — 24-category map, preview pitch kit, demo script, objection review and valuation memo exist. No buyer interest or verified buyer-contact channel.
- Phase 5 buyer objection test: **NOT PASSED** — CTO/CFO/founder/legal blockers remain.
- Phase 6 valuation: **PARTIAL** — cost-to-replicate and comparables undetermined; ₹15–20 lakh unsupported; ₹10–20 crore hypothetical only.

## CI (exact pre-documentation candidate)
- PR #98 was Open, Draft and unmerged.
- Main run [43228795552](https://github.com/s85960833-byte/NovaAI/actions/runs/43228795552) passed on `2639072565c7e270b03131890152694e187c0fdb`.
- Browser run [43228795499](https://github.com/s85960833-byte/NovaAI/actions/runs/43228795499) passed on same SHA (16 workflow steps).
- Main skipped four live/release checks: deployed BI Edge Function auth/CORS, merged-revision wait, live Production/provider smoke and live free-image smoke.
- Main artifact contains screenshots at 360×800, 390×844, 412×915, 760×1024 and 1280×800 plus SPDX SBOM. Screenshot inspection at 360/412/760/1280 showed full emulated viewport width; no real Android/mic test.

## Render Production
- Service `srv-dbidhpc9v7es73d6ia80`; main; Free; Singapore; 1 instance.
- Latest Live deployment `dep-dbom7bbm8hqs73ec2gi0`, commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.
- Health Check Path blank. Direct public HTTP smoke/uptime not proven from review environment.
- Production not changed, merged or deployed by this work.

## Render Staging
- Service `srv-dbqm035g1s2s73eogao0`; existing URL https://novaai-pr98-staging.onrender.com; candidate branch configured, Auto Deploy enabled, Free, Singapore, one instance.
- Latest Live deploy `dep-dbqnenhe35nc73f81k4g` remains old SHA `195739a04895de364a5af22aa61f930d5d782cbb`.
- Health Check Path blank; connected Render tools cannot update this field. Auto Deploy did not advance to PR head.
- Old build logs show startup on port 10000 and clean SIGTERM; restart cause not established.
- Old build internal self-test: health/static/PWA and some retrieval routes passed; config 503, AI chat 503 due to no model key, and some provider timeout/429 fallbacks. Not a current candidate test.

## Supabase read-only review
- Project `qrfwsewppafhxibdboam` ACTIVE_HEALTHY, PostgreSQL 17; 11/11 public tables RLS enabled; 24 policies; no anon table grants.
- Security/Health Advisors zero lints; Performance Advisor 13 INFO unused-index notices, no indexes changed.
- `nova-bi-api` ACTIVE v14 with JWT verification enabled.
- Live Auth emails/tokens, two-account isolation, account deletion and backup restore remain unverified.

## Done
- Exact-head Main/Browser CI green, with skipped live checks disclosed.
- 360/412/760/1280px screenshots inspected.
- Source route, API, auth, provider, license, BI and deployment boundaries reviewed.
- Architecture/API/cost/roadmap/scorecard/Data Room materials created in this candidate documentation update.
- No paid spend, Production merge/deploy or secrets retrieval.

## In progress / next
1. Owner: Staging Dashboard → Settings → Health Checks → set `/health` → Save.
2. Diagnose Staging Auto Deploy; deploy and smoke-test exact candidate at existing Staging URL.
3. Enable Express auth on Staging only; verify missing/invalid/expired/valid tokens.
4. Owner tests actual Android full width, drawer, touch, keyboard and microphone.
5. Implement durable quotas/spend caps, full account deletion/retention, monitoring, backup/restore, provider rights and legal/IP evidence.

## Blocked on owner/external evidence
- Render health-check field requires owner dashboard access.
- Live AI test requires approved provider key entered privately in Render; never send a key in chat and do not spend paid credits.
- Actual handset/microphone test requires physical device.
- Provider invoices/contracts, operator identity, support/grievance, age policy and IP assignments require responsible adult operator and qualified legal review.

## Decisions
- Keep PR #98 Draft/unmerged and Production unchanged until every release gate passes.
- No paid APIs, paid image, billing or service upgrades.
- No unverified customer/revenue/uniqueness/valuation/SLA/certification/production security claims.
- Synthetic/non-sensitive demo content only; no confidential customer data.

## Estimates
- Overall S-tier DoD: **27%** qualitative.
- Buyer readiness: **38/100** weighted internal score, not appraisal.
- Tier 1 ₹15–20 lakh: unsupported today.
- Tier 2 ₹10–20 crore: aspiration only; would require sustained auditable paid ARR, retention, growth, margins, rights and independent valuation.
