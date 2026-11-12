# NOVA Status — Current Source of Truth

**Status date:** 12 November 2026  
**Repository:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80  
**PR #98:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Candidate branch:** `fix/nova-home-learn-first-mobile-20261109`

## Phase status
- Phase 1 audit: **IN PROGRESS** — code/routes/auth/provider boundaries, npm lockfile metadata, Supabase RLS, Render status/logs, CI and browser viewport artefact reviewed. Current-head live Staging, real Android/mic and operational restore/load evidence remain open.
- Phase 2 differentiation: **NOT PROVEN** — Indian competitors overlap with broad Hindi/English app-builder claims; no moat or head-to-head benchmark.
- Phase 3 asset value: **PARTIAL** — architecture, API, cost, roadmap, transfer and Data Room docs; durable core quotas/spend caps, production Auth, full account deletion/retention, billing, SDK/webhooks/plugins and restore proof incomplete.
- Phase 4 buyer package: **PARTIAL** — Buyer Map, pitch materials, cost model, valuation, objection review, Data Room, feedback-only outreach templates and synthetic BI demo fixtures exist. No buyer interest/contact channel.
- Phase 5 buyer objections: **NOT PASSED** — CTO/CFO/founder/legal blockers remain.
- Phase 6 valuation: **PARTIAL** — modelled labour parity ₹35.1–104.7 lakh; independent quotes/comparables absent; ₹15–20 lakh fair value unsupported; ₹10–20 crore scenario only.

## Exact CI status
- Last fully green exact SHA: `0615457f15fb7998ec221e4f6daf464b6256be2b`, Main #43234738243 and Browser #43234738226 successful.
- Candidate `e263a1530eb1cecb3940f14ed76be31a1ad8050c` adds synthetic BI datasets and a deterministic test step; Main #43237105986 was still running at the last check and Browser #43237105954 was queued. Do not count these as passed until the workflow conclusions finish.
- Main release-only live checks remain skipped for the Draft PR. CI does not prove Render deployment or physical-device behavior.

## Render status
- Production service `srv-dbidhpc9v7es73d6ia80`, branch main, Free/Singapore/one instance; latest live deployment `dep-dbom7bbm8hqs73ec2gi0` on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. Health Check Path blank. Production unchanged.
- Staging service `srv-dbqm035g1s2s73eogao0` has correct PR branch and Auto Deploy enabled, but last Live deployment `dep-dbqnenhe35nc73f81k4g` remains old SHA `195739a04895de364a5af22aa61f930d5d782cbb`. Health Check Path blank; auto-deploy has not advanced.
- Old Staging self-test had health/static/PWA OK, but config/AI chat 503 without a model provider key. This is not current-candidate evidence.

## Supabase read-only evidence
- Project `qrfwsewppafhxibdboam` ACTIVE_HEALTHY, PostgreSQL 17, all 11 public tables RLS-enabled, 24 policies, no anon table grants, zero Security/Health Advisor lints; 13 performance INFO unused-index notes.
- `nova-bi-api` ACTIVE v14 with JWT verification. Live Auth email/session/two-account tests, deletion and restore not verified.

## Completed
- Exact pre-sample commit CI was green; README guard failure on an intermediate docs commit was diagnosed and fixed.
- Architecture/API/running-cost/roadmap/scorecard/Data Room/pitch/buyer/transfer/legal/license docs updated.
- India competitor overlaps researched; no exclusivity claims.
- Synthetic sample CSVs added with automated deterministic-output tests.
- A secure, allowlisted sample-download route and NOVA BI download links are being added in the current follow-up candidate; runtime smoke tests cover allowlist and path traversal.
- No paid spend, Production merge/deploy, or secret retrieval.

## Next / blocked
1. Verify both workflows on the latest exact PR SHA and fix any test failures.
2. Owner: Staging Dashboard → Settings → Health Checks → set `/health` → Save.
3. Diagnose Render Staging Auto Deploy, then smoke-test the current candidate at the existing Staging URL.
4. Enable Express Auth on Staging only; test missing/invalid/expired/valid tokens.
5. Owner tests actual Android full width, drawer, touch, keyboard and microphone.
6. Add durable quotas/spend caps, full account deletion/retention, monitoring, backup/restore, provider-rights and final legal/IP evidence.
7. Run a real same-task benchmark and obtain permitted user research; do not assert a moat or willingness-to-pay before evidence.

## Decisions
- PR #98 remains Draft/unmerged. Production remains unchanged until all release gates pass and the owner explicitly approves.
- No paid APIs, image credits, infrastructure, billing or plan upgrade.
- No claim of customers, revenue, exclusive technology, fair valuation, uptime SLA, certification or production security.
- Synthetic/non-sensitive data only; no customer, employee or confidential data in previews.
- All outreach templates are for adult-supervised, non-paid product feedback, not a sale or paid trial.

## Current estimates
- Overall S-tier Definition of Done: **28%** qualitative.
- Buyer-readiness: **36.8/100 ≈ 37/100**, internal weighted estimate, not an appraisal.
- Tier 1 ₹15–20 lakh fair asset value unsupported.
- Tier 2 ₹10–20 crore only aspirational; depends on sustained paid ARR, retention, growth, margins, clean IP/provider rights and independent valuation.
