# NOVA Status — Source of Truth

**Last verified:** 12 Nov 2026, 13:58 UTC  
**Repo:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80  
**PR:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Branch:** `fix/nova-home-learn-first-mobile-20261109`

## Phase status
- Phase 1 audit: **IN PROGRESS** — source, route, CI, browser viewport artifacts, Docker/SBOM and limited Supabase/Render configuration review done; current-head Staging and physical Android proof missing.
- Phase 2 differentiation: **NOT PROVEN** — direct Indian competitors have overlapping language-led app-building and assistant positioning. No exclusive feature or moat is proven.
- Phase 3 asset engineering: **PARTIAL** — architecture, API, cost, roadmap, transfer and Data Room docs exist; durable quotas, billing/entitlements, SDK/webhooks/plugins, account deletion and backup restore incomplete.
- Phase 4 buyer package: **PARTIAL** — Buyer Map, pitch kit, deck outline, demo script, objection review and valuation memo exist. No buyer interest or verified business contact channel.
- Phase 5 objection test: **NOT PASSED** — CTO/CFO/founder/legal blockers remain.
- Phase 6 valuation: **PARTIAL** — preliminary labour parity model ₹35–105 lakh; no verified comparable deals; Tier 1 fair value unsupported; Tier 2 scenario only.

## Exact CI checkpoints
- PR #98 pre-doc candidate `2639072565c7e270b03131890152694e187c0fdb`: Main #43228795552 and Browser #43228795499 passed; four live/release checks skipped in Main.
- Docs candidate `726edc57302483598852f056e5de60ec227dc57a`: Main #43232714683 and Browser #43232714688 both passed; duplicate exact SHA runs #43232701048 and #43232701110 also passed.
- Intermediate docs commit `4533b9835ab1a94d0cde22069235c62f1eaaaadf` failed browser guard because README was overwritten and the safeguard wording disappeared. README was restored from parent and re-appended; no production code was changed by the correction.
- Browser artifact #13949132338 contains screenshots at 360×800, 390×844, 412×915, 760×1024 and 1280×800 plus SPDX SBOM. Screenshots at 360/412/760/1280 showed full emulated viewport width; no physical Android/microphone test.

## Render Production
- Service `srv-dbidhpc9v7es73d6ia80`; branch main; Free; Singapore; one instance.
- Latest live deploy `dep-dbom7bbm8hqs73ec2gi0` on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.
- Health Check Path blank; public HTTP/uptime evidence not established by this review.
- Production unchanged.

## Render Staging
- Service `srv-dbqm035g1s2s73eogao0`; existing URL https://novaai-pr98-staging.onrender.com; branch configured, Auto Deploy enabled, Free, Singapore, one instance.
- Latest Live deployment `dep-dbqnenhe35nc73f81k4g` remains old SHA `195739a04895de364a5af22aa61f930d5d782cbb`.
- Health Check Path blank; connected Render tools cannot change this field; Auto Deploy has not advanced to candidate.
- Old build logs show startup on port 10000 and clean SIGTERM; restart cause unknown.
- Old self-test: health/static/PWA and selected feeds passed; config 503 and AI chat 503 because no model key; some provider timeouts/429. Not current-candidate evidence.

## Supabase read-only review
- Project `qrfwsewppafhxibdboam` ACTIVE_HEALTHY, PostgreSQL 17; 11/11 public tables RLS enabled; 24 policies; no anon table grants.
- Security/Health Advisors zero lints; Performance Advisor 13 INFO unused-index notices; no changes made.
- `nova-bi-api` ACTIVE v14, JWT verification enabled.
- Live Auth email/token tests, two-account isolation, deletion and restore unverified.

## Completed
- Exact-head Main/Browser CI passes verified on two pre-market docs candidate SHAs; failed intermediate README-only docs commit diagnosed and corrected.
- Browser viewport artifact reviewed; repo architecture/API/cost/roadmap/scorecard/Data Room and pitch deck outline added.
- Direct Indian competitors and qualitative user pain signals researched; no unsupported uniqueness claim.
- Itemized replacement-labour model and updated buyer-readiness score prepared.
- No paid spend, Production merge/deploy, or secrets retrieval.

## In progress / next
1. Owner: Staging Render Dashboard → Settings → Health Checks → set `/health` → Save.
2. Diagnose Auto Deploy and deploy exact candidate on the existing Staging URL.
3. Enable Express auth on Staging only; test missing/invalid/expired/valid tokens.
4. Owner tests real Android full width, drawer, touch, keyboard and microphone.
5. Implement durable quota/spend controls, full account deletion/retention, monitoring, backup/restore, provider rights and legal/IP proof.
6. Run same-task benchmark against direct India competition and obtain permission-based user research; do not claim results before running it.

## Blocked on owner/external evidence
- Render Health Check Path requires owner dashboard click.
- AI test requires an approved provider key entered privately in Render; no paid spend.
- Physical Android/microphone test requires the handset.
- Provider invoices/contracts, operator identity, support/grievance, age/consent policy, contributor assignments, IP chain of title and final legal review require responsible adult operator and qualified counsel.
- Acquire/Partner contact channel not implemented without a verified adult-operated business contact and privacy/support owner.

## Decisions
- Keep PR #98 Draft/unmerged and Production unchanged until all gates pass.
- No paid APIs, paid image generation, billing activation or plan upgrades.
- Do not claim customers, revenue, exclusivity, valuation, SLA, certification or production security without evidence.
- Synthetic/non-sensitive demo data only.

## Estimates
- Overall S-tier DoD: **27%** qualitative.
- Buyer-readiness: **36.8/100 ≈ 37/100** weighted internal estimate, not appraisal.
- Tier 1 ₹15–20 lakh fair asset value: unsupported.
- Tier 2 ₹10–20 crore: aspiration only; requires sustained audited paid ARR, retention, growth, margin, rights and independent valuation.


## Market and replacement-cost update — 12 November 2026

- India competition review now includes Paddlewheel, BooDoo and NavBharatAI; their public listings overlap with Hindi/Indian-language app building, live preview/publish, code export and Indian payments. No broad exclusivity claim is allowed.
- Selected Lovable and Bolt reviews show credit/rework, reliability, export and support complaint themes; reviews are self-selected and not representative market research.
- Itemized preliminary replacement-labour estimate added in `COST_TO_REPLICATE.md`: 1,500–2,280 hours × India agency pricing reference US$25–49/hour, converted at ₹93.68/USD on 12 Nov 2026 = approximately ₹35.1–104.7 lakh. This is not independently quoted, not a fair-value opinion, and not proof a buyer will pay.
- Weighted buyer-readiness revised to **36.8/100 ≈ 37/100** because broad differentiation is weaker than previously assessed.
- Tier 1 ₹15–20 lakh remains unsupported as a fair asset price even though gross replacement labour may be higher.
- Current PR head at the time of this market research: `726edc57302483598852f056e5de60ec227dc57a`; Main and Browser CI passed on that exact head after restoring README.
- Release remains NO-GO: Staging stale, Production unchanged, no real Android test, no Auth live test, no durable quotas, no provider/IP/legal clearance.
- Acquire/Partner contact form not implemented: no verified adult-operated business contact, support owner or approved privacy/legal contact channel exists. Do not collect personal contact details in an unstaffed form.
