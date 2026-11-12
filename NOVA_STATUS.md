# NOVA Status — Current Source of Truth

**Status date:** 12 November 2026  
**Repository:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73eogao0  
**PR #98:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Candidate branch:** `fix/nova-home-learn-first-mobile-20261109`

## Phase status

- **Phase 1 — Total audit: IN PROGRESS.** Source/routes, auth, provider boundaries, npm license metadata, Supabase RLS, Render configuration/logs, CI and browser viewport artifact have been reviewed. Current-head live Staging, physical Android, microphone, complete public route/button/error-state review, restore and load evidence remain open.
- **Phase 2 — Exclusive value: NOT PROVEN.** India competitors Paddlewheel, NavBharatAI and BooDoo have overlapping language-led app-building and deployment claims. NOVA has no validated moat or head-to-head benchmark. Change Budget + Action Proof and Portable Proof Bundle remain hypotheses.
- **Phase 3 — Asset value: PARTIAL.** Architecture/API/roadmap/transfer/security docs, Docker/Compose, RLS and automated checks exist. Durable Express quotas/spend caps, production Auth, account deletion/retention, billing/entitlements, SDK/webhooks/plugins and backup restore are incomplete.
- **Phase 4 — Buyer package: PARTIAL.** Buyer Map (24 categories), pitch preview, deck outline, demo scripts, outreach-for-feedback templates, cost model, valuation, objection review and Data Room exist. No verified buyer interest or responsible adult-operated buyer contact channel.
- **Phase 5 — Buyer objections: NOT PASSED.** CTO/CFO/founder/legal objections remain.
- **Phase 6 — Valuation: PARTIAL.** Gross replacement-labour scenario is ₹35.1–104.7 lakh; independent cost audit/comparable deals are absent. Tier 1 ₹15–20 lakh fair value unsupported; Tier 2 ₹10–20 crore scenario only.

## Exact-head CI evidence

- Commit `0615457f15fb7998ec221e4f6daf464b6256be2b` is the latest previously verified documentation/market candidate.
- Main workflow [#43234738243](https://github.com/s85960833-byte/NovaAI/actions/runs/43234738243): **success**.
- Browser workflow [#43234738226](https://github.com/s85960833-byte/NovaAI/actions/runs/43234738226): **success**.
- The latest Main artifact is #13952570332 (`nova-integrated-browser-verification`). It contains integrated Chromium viewport evidence and test reports for that verified candidate.
- Main workflow still skips release-only/live Production checks while this PR is unmerged. CI pass does not certify deployment.
- An intermediate docs-only commit failed a buyer-preview wording guard when README was overwritten. Logs were inspected; the original README was restored and reruns passed. No Production code was changed by that correction.

## Render Production

- Service `srv-dbidhpc9v7es73d6ia80`, branch `main`, Free plan, Singapore, one instance.
- Latest Live deployment `dep-dbom7bbm8hqs73ec2gi0` serves `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.
- Health Check Path is blank; live public HTTP/uptime evidence was not obtained in this review.
- Production branch, deployment and URL have not been changed by PR #98 work.

## Render Staging

- Service `srv-dbqm035g1s2s73eogao0`, existing URL https://novaai-pr98-staging.onrender.com, correct PR branch configured, Auto Deploy enabled, Free plan, Singapore, one instance.
- Latest Live deployment `dep-dbqnenhe35nc73f81k4g` still serves old SHA `195739a04895de364a5af22aa61f930d5d782cbb`, not the candidate.
- Health Check Path blank. Connected Render tools do not expose an action to update it; auto-deploy has not advanced despite pushes.
- Old Staging self-test showed health/static/PWA paths responding, but config and AI chat returned 503 because no LLM/Groq/OpenRouter model key was configured. Several public data providers used rate-limit/timeout fallbacks. These are old-build results, not a test of current candidate.

## Supabase read-only review

- Project `qrfwsewppafhxibdboam`: ACTIVE_HEALTHY, PostgreSQL 17; 11 public tables with RLS enabled, 24 policies, no anon table grants.
- Security and Health Advisors: zero lints; Performance Advisor: 13 INFO-level unused-index notices. No indexes or policies were changed during this audit.
- `nova-bi-api` ACTIVE v14 with JWT verification.
- Hosted Auth email/token flows, two-account isolation, deletion and backup restore remain unverified.

## Repository/configuration evidence

- `.env.example` documents all Express `E.*` runtime variables; its separate `NOVA_BI_SITE_URL` value documents the Supabase Edge Function setting.
- The tracked tree has `.env.example` but no tracked `.env` file. This is a repository inventory check, not a guarantee that every source/asset is free of embedded secrets.
- npm lockfile audit: 72 packages, declared metadata MIT/ISC/BSD-3-Clause/Apache-2.0; no GPL/AGPL identifier detected in npm metadata. Deno dependencies, CDNs, fonts/media and original asset provenance remain incomplete.
- Transfer Pack is a technical checklist, not evidence that project accounts can be transferred or that backups restore.
- Privacy Notice and Terms are drafts; qualified Indian legal review, operator identity, age/consent process, retention, grievance and deletion workflow are not complete.

## Completed in latest work

- India competition and qualitative review signals documented; no unsupported uniqueness claim.
- Itemized replacement-labour model, revised valuation memo and 37/100 weighted buyer-readiness scorecard documented.
- Architecture/API/running-cost/12-month roadmap, pitch deck, buyer map, objection review and Data Room index added or improved.
- Synthetic BI CSV demo datasets created and an automated test suite added to validate them against the same deterministic calculation module. The new test workflow step is part of this pending candidate commit and must pass CI before it is treated as verified.
- No paid spend, Production merge/deploy, or secret retrieval.

## In progress / next

1. Push the synthetic demo fixtures, test suite, workflow step, demo guide and latest status updates to the existing PR branch.
2. Verify new Main and Browser workflows on the exact pushed SHA; fix any failure before moving on.
3. Owner: Staging Render Dashboard → Settings → Health Checks → enter `/health` → Save.
4. Diagnose Staging Auto Deploy and deploy the exact candidate to the existing Staging URL.
5. Enable Express Auth on Staging only; test missing/invalid/expired/valid tokens and provider requests.
6. Owner performs physical Android full-width, drawer, touch, keyboard and microphone checks.
7. Implement durable quotas/spend caps, complete account deletion/retention, backup/restore, monitoring and provider commercial-rights remediation.
8. Run an identical-task benchmark against India competitors and collect permission-based feedback before any moat/pricing claim.

## Blocked on owner/external evidence

- Render Health Check Path requires the owner to use the dashboard.
- Live AI test requires an owner-authorized provider key to be entered privately in Render. Never send keys in chat; no paid API credits or services are approved.
- Physical Android/mic testing needs the actual handset.
- Provider invoices/contracts, account transferability, owner/operator identity, support/grievance contact, age/consent policy, contributor assignments and final IP/legal review require the responsible adult operator and qualified professionals.
- Buyer contact capture/transaction outreach cannot be safely launched until an adult-managed operator, privacy/support contact and legally reviewed process exist. Current outreach templates are for feedback only.

## Decisions

- Keep PR #98 Draft/unmerged; keep Production unchanged until all gates pass and the owner gives explicit final release approval.
- No paid APIs, image credits, billing activation, paid infrastructure or plan upgrade without separate approval.
- Do not claim customers, revenue, exclusive technology, valuation, uptime SLA, certification or production security without evidence.
- Use synthetic/non-sensitive demo data only; no confidential or personal data in previews.

## Estimates

- Overall S-tier Definition of Done: **28%** qualitative estimate across all phases.
- Buyer-readiness: **36.8/100 ≈ 37/100**; weighted internal estimate, not appraisal.
- Tier 1 ₹15–20 lakh: unsupported fair asset value today.
- Tier 2 ₹10–20 crore: aspiration only; requires sustained audited paid ARR, retention, growth, margins, clean IP/provider rights and independent valuation.
