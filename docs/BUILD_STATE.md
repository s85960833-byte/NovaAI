# NOVA 2.0 Build State

**Updated:** 2026-11-17 16:24 UTC  
**Branch:** \`nova-2.0/rebuild\`  
**Verified source SHA for CI #513:** \`5976ef98927977ebd93ae1a47b0f83ce4ab89e6b\`  
**Draft PR:** [#103](https://github.com/s85960833-byte/NovaAI/pull/103)  
**Staging:** https://nova-2-staging.onrender.com

## Phase 1–6 implementation and automated evidence
- NOVA 2.0 modular React/Vite app, Node API, shared contracts, PostgreSQL migrations, Darbar, Sakha, Diwan and synthetic mock wallet are present on the isolated rebuild branch.
- 150 synthetic eval cases across five tasks and Hindi/English/Hinglish passed fixture checks.
- GitHub Actions run #513 completed all three jobs successfully: checks, database and staging-smoke.
- Checks: typecheck, lint, formatter, unit tests, i18n/scheme/secret checks, mock evals, npm audit, build, Playwright E2E, bundle budget and Lighthouse passed.
- Database: isolated local Supabase stack started; clean reset applied migration \`20261117120000_nova2_initial.sql\`; RLS/schema assertion passed; account export visibility and synthetic deletion cascade/usage anonymisation passed; 5 durable wallet integration tests passed; PostgreSQL 17 backup/restore passed.
- Backup/restore restored 5 \`nova2_staging\` tables. Row counts matched before/after restore: \`3:3:5:6:2\` for wallet accounts, orders, ledger, events and AI spend events. Artifact \`nova2-database-evidence\` contains the dump/table list.
- Staging-smoke: 24/24 read-only GET requests succeeded; p50 269.6 ms, p95 762 ms, max 773.9 ms, 0 failures.
- Frame sampling: six scenarios (entry, Darbar idle, drawer, Diwan transition, Diwan scroll, Sakha chat), 90 samples each; p50/p95 16.7/16.7 ms and 0 dropped frames in each scenario. This is Playwright Chromium 60 Hz emulation only.
- Lighthouse: three mobile runs; Performance 88/95/95 (median 95), Accessibility 100, Best Practices 100, SEO 91; LCP 2.06–2.28 s; CLS 0; TBT 0–260 ms. The composite configured assertion passed; one individual run was below the 90 Performance target and one TBT sample exceeded 200 ms.
- Bundle: JavaScript 203.97 kB (65.76 kB gzip); CSS 15.83 kB (3.94 kB gzip). npm audit reported 0 vulnerabilities.
- Public \`/perf\` screen is implemented and covered by Playwright; it estimates browser cadence, displays p50/p95/dropped frames, PASS/FAIL and a hardware-estimate disclaimer.

## Gate status

| Gate | Current result | Evidence / remaining limitation |
|---|---|---|
| Gate 0 — architecture/parity | PASS | Phase 0 audit, parity, ADR, cost and risk decisions recorded. |
| Gate 1 — isolated rebuild / CI | PASS | Run #513 checks job completed successfully. A clean CI run without the temporary formatter-candidate step is now running after source formatting was committed. |
| Gate 2 — database/security | PASS (CI test DB) | Fresh migration, schema/RLS, export visibility and synthetic deletion tests passed. Hosted Supabase Auth, hosted export API and object-storage deletion are NOT VERIFIED. |
| Gate 3 — product / E2E | PASS (Chromium CI) | Playwright suite passed, including responsive viewports, /perf, mock flows, wallet isolation, upload safety and reduced-motion fallback. Physical Android is NOT VERIFIED. |
| Gate 4 — mock wallet/payment safety | PASS (synthetic only) | 5 DB integration tests passed, including success/failure/duplicate/delayed/late webhooks, refund, spend caps, ledger reconciliation and append-only checks. No real payment provider or money movement. |
| Gate 5 — performance/reliability | PASS (automated scope) | Frame scenarios, bundle, Lighthouse composite and 24-request staging load passed. Physical refresh rate, hosted backup/restore and sustained load remain NOT VERIFIED. |
| Gate 6 — staging/release preparation | PARTIAL | Staging health and read-only smoke/load passed, but Render still confirms an older SHA than the tested source. Hosted /perf deployment and actual previous-deploy rollback are NOT VERIFIED. |

## Safety boundaries and production proof
- Production Render service \`srv-dbidhpc9v7es73d6ia80\`, production Supabase, GitHub \`main\`, production secrets and production data were not changed.
- \`main\` was last verified identical to base SHA \`bdbeb20881f9b6cef51ff5a9d8a3b80131079a50\`.
- Production Render last observed Live deploy remains SHA \`c3cee61906b88ff111b3a645db55c9c2503cd8f7\` from 2026-11-09.
- AI provider checks use mock/fixtures; no real documents or provider calls. Wallet/payments remain synthetic.
- Free services only; no KYC, settlement, money movement or real user data.
- PR #103 remains Draft and unmerged. Phase 7 remains prohibited until exact text \`APPROVE RELEASE\`.

## NOT VERIFIED / open risks
- Last confirmed staging Live SHA is \`5cf3ed56e92e239945ae476ca40537a8bedb1aab\`, older than tested source SHA \`5976ef98927977ebd93ae1a47b0f83ce4ab89e6b\`; hosted /perf route is not confirmed live.
- Actual staging rollback, previous-deploy selection and under-5-minute timing are NOT VERIFIED; no Render rollback-to-specific-deploy action is exposed by the available connection.
- Hosted Supabase Auth, real session login, account export/download endpoint, full hosted account deletion and object-storage erasure are NOT VERIFIED. CI SQL validates RLS export visibility and deletion cascades only.
- Physical Android/Infinix layout, screen-reader/assistive-tech review, and true 90/120 Hz hardware refresh are NOT VERIFIED.
- Hosted Render Postgres backup/restore is NOT VERIFIED. The successful rehearsal used an isolated ephemeral local Supabase test database.
- Real-model quality/cost/privacy and official government scheme/contact records remain unverified/empty.
- Lighthouse had one lower Performance run (88) and one TBT sample 260 ms; investigate repeatability before release.

## Evidence references
- GitHub Actions run #513: https://github.com/s85960833-byte/NovaAI/actions/runs/44123718181
- Database artifact #14347895119: https://github.com/s85960833-byte/NovaAI/actions/runs/44123718181/artifacts/14347895119
- Staging-load artifact #14346728224: https://github.com/s85960833-byte/NovaAI/actions/runs/44123718181/artifacts/14346728224
- Lighthouse artifact #14346572746 and Playwright artifact #14346343144 are attached to the same run.
