# NOVA Status — Current Source of Truth

**Last exact CI verification:** 12 November 2026 (updated after current-head verification)  
**Repository:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80  
**PR #98:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Candidate branch:** `fix/nova-home-learn-first-mobile-20261109`  
**Verified code candidate:** `76e89066d04f00e991b7a49b59cb93c4839a6ab7` (functional code; latest PR head `0afe73fa8093034e341329b6dc7e3e3d0fad5758` is a documentation-only follow-up)

## Phase status

- Phase 1 — Total audit: **IN PROGRESS**. Source/routes/auth/provider boundaries, npm metadata, Supabase RLS, Render history/logs, CI and browser viewport artifacts reviewed. Current-head Staging/live HTTP, physical Android/microphone, restore/load and complete live UI checks remain open.
- Phase 2 — Exclusive value engine: **NOT PROVEN**. Paddlewheel, NavBharatAI and BooDoo overlap with broad India-language app-building; NavBharatAI also publicly claims failed-build fee protection and rupee pay-as-you-go billing. No unique moat or same-task benchmark.
- Phase 3 — Asset value: **PARTIAL**. Architecture/API/roadmap/transfer/Data Room, synthetic demo data, allowlisted download routes, SHA-256 source proof and CSV auto-mapping improvements exist in candidate. Durable quotas/spend caps, billing, SDK/webhooks/plugins, full account deletion/retention and restore proof remain incomplete.
- Phase 4 — Buyer package: **PARTIAL**. Buyer Map (24 categories), preview pitch, non-paid feedback templates, cost/valuation/objection docs and Data Room exist. No buyer interest or adult-managed transaction/contact channel.
- Phase 5 — Buyer objections: **NOT PASSED**.
- Phase 6 — Valuation: **PARTIAL**. ₹35.1–104.7 lakh gross labour scenario only, not independent valuation; ₹15–20 lakh fair asset value unsupported; ₹10–20 crore scenario only.

## Latest PR-head verification — 12 November 2026

- Current PR #98 head: `0afe73fa8093034e341329b6dc7e3e3d0fad5758` (documentation-only follow-up to the code candidate `76e8906`).
- Main workflow [#43253211824](https://github.com/s85960833-byte/NovaAI/actions/runs/43253211824): **success** on exact head `0afe73f`; 45 successful steps, 0 failed, 4 live/release-only steps skipped.
- Browser workflow [#43253211819](https://github.com/s85960833-byte/NovaAI/actions/runs/43253211819): **success** on exact head `0afe73f`; all 17 steps successful, 0 skipped, 0 failed.
- Duplicate Browser retry [#43253192075](https://github.com/s85960833-byte/NovaAI/actions/runs/43253192075) also passed. Duplicate Main retry [#43253191880](https://github.com/s85960833-byte/NovaAI/actions/runs/43253191880) was still in progress at checkpoint and is not required to rely on because the primary exact-head Main run passed.
- PR remains Open, Draft, unmerged. No review submissions or PR comments were present at this checkpoint.
- CI does not establish deployed Staging/Production behavior: the four live/release-only checks above were skipped.

## Exact-head CI evidence — 12 November 2026

- Main workflow [#43251147719](https://github.com/s85960833-byte/NovaAI/actions/runs/43251147719): **success** on SHA `76e89066d04f00e991b7a49b59cb93c4839a6ab7`; 45 successful steps, 0 failed, 4 live/release-only steps skipped.
- Browser workflow [#43251147695](https://github.com/s85960833-byte/NovaAI/actions/runs/43251147695): **success** on the same SHA; all 16 workflow steps succeeded.
- Duplicate exact-SHA retry pair [#43251164087](https://github.com/s85960833-byte/NovaAI/actions/runs/43251164087) and [#43251164091](https://github.com/s85960833-byte/NovaAI/actions/runs/43251164091) also completed successfully.
- Main passing steps include Node/browser security tests, npm SBOM generation/validation, dependency audit, PostgreSQL migrations/RLS, Deno type checks, BI calculations, synthetic demo data calculations, local API/runtime smoke, Docker image build and health smoke, Chromium interaction tests and five-viewport mobile/drawer regression.
- Main skipped steps: deployed NOVA BI Edge Function auth/CORS smoke, wait-for-merged-revision on Render, live Production/provider smoke and live free-image smoke. These are not passes.
- Browser proof test verifies SHA-256 of the exact uploaded expense CSV against an independent Node hash, exported Action Proof JSON metadata and no raw CSV bytes in the portable bundle.
- Browser regression exposed that `Amount (INR)` was not auto-mapped. Candidate safely matches exact headers first, then currency-suffixed prefix/suffix variants. Browser CI verifies this mapping and the resulting ₹2,12,000 sample calculation.
- Two prior Browser CI failures were diagnosed, not bypassed: first the test did not report import/security-context state; second diagnostics identified the unmapped amount header. Both are addressed on the green exact SHA.

## Render Production

- Service `srv-dbidhpc9v7es73d6ia80`; branch `main`; Free/Singapore/one instance.
- Latest Live deployment `dep-dbom7bbm8hqs73ec2gi0` on commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.
- Production was not changed, merged or redeployed. Direct live HTTP response and uptime remain unverified from this review environment. Health Check Path is blank.

## Render Staging

- Service `srv-dbqm035g1s2s73eogao0`; URL https://novaai-pr98-staging.onrender.com; PR branch configured, Auto Deploy enabled; Free/Singapore/one instance.
- Latest Live deployment remains `dep-dbqnenhe35nc73f81k4g` on old SHA `195739a04895de364a5af22aa61f930d5d782cbb`, not the candidate.
- Health Check Path remains blank. Connected Render tools cannot update it; Auto Deploy has not moved to PR head.
- Old deployment logs recorded AI chat 503 because no model key was configured. This is not current-candidate evidence.

## Supabase read-only review

- Project `qrfwsewppafhxibdboam`, PostgreSQL 17.11, ACTIVE_HEALTHY, eu-west-1.
- 11/11 public tables RLS-enabled; 24 policies; no anon table grants; Security/Health Advisors zero lints; 13 Performance Advisor INFO unused-index notices.
- `nova-bi-api` ACTIVE v14 with JWT verification.
- Live Auth email/token tests, two-account isolation, full deletion/retention, backup export/restore remain unverified.

## Completed in this candidate

- India competitor research updated with NavBharatAI public pricing/failure-handling policy; no unique pricing claim.
- Cost-to-replicate report labels ₹35.1–104.7 lakh as gross modelled replacement labour, not fair market value.
- Synthetic demo samples, deterministic Node tests and allowlisted downloads.
- Source CSV SHA-256 digest and portable Action Proof export; raw CSV bytes are omitted, and the bundle is not digitally signed.
- Fixed currency-suffixed CSV auto-mapping and added Browser regression evidence.
- Exact-head Main and Browser CI both passed twice.
- No paid spend, Production change, merge or secret retrieval.

## Next / owner actions

1. Owner: Staging Dashboard → Settings → Health Checks → set `/health` → Save.
2. Diagnose Staging Auto Deploy and deploy exact candidate to the same Staging URL.
3. Run current-head Staging health/routes/provider/account smoke. Enable Express API authentication on Staging only; test missing/invalid/expired/valid tokens.
4. Owner tests actual Android full width, drawer, touch targets, keyboard and microphone.
5. Implement durable quotas/spend caps, full Auth account deletion/retention, monitoring, backup/restore, provider-rights remediation and final legal/IP review.
6. Run identical-task competitor benchmark; no differentiation claim until independently reproducible.

## Owner/external blockers

- Health Check Path and Staging deployment require Render dashboard owner action.
- AI test requires an approved provider key entered privately in Render; no paid spend.
- Physical Android/microphone testing requires the actual handset.
- Provider contracts/invoices, account-transfer rights, legal operator identity, support/grievance contact, age/consent policy, contributor assignments and IP chain of title require responsible adult operator and qualified professionals.
- Acquire/Partner contact route is not implemented without a verified adult-managed business contact and privacy/support owner.

## Decisions

- PR #98 stays Draft/unmerged; Production stays unchanged until all gates and explicit owner approval.
- No paid API, paid image, infrastructure, plan upgrade, payment or billing activation.
- Do not claim customers, revenue, exclusivity, fair valuation, uptime SLA, certification, production security or buyer interest without evidence.
- Synthetic/non-sensitive demo data only; no confidential/customer-data onboarding.

## Estimates

- Overall S-Tier Definition of Done: **30%** qualitative cross-phase estimate.
- Buyer-readiness: **36.8/100 ≈ 37/100**, weighted internal estimate; not appraisal.
- Tier 1 ₹15–20 lakh fair asset value: unsupported today.
- Tier 2 ₹10–20 crore: aspirational only; requires sustained audited paid ARR, retention, growth, margins, clean IP/provider rights and independent valuation.
