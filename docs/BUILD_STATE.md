# NOVA 2.0 Build State

Updated: 2026-11-17 15:36 UTC  
Branch: nova-2.0/rebuild  
Candidate SHA: 5cf3ed56e92e239945ae476ca40537a8bedb1aab  
Current phase: Phases 1–6 implementation complete; evidence closure and Phase 7 preparation in progress.

## Completed and evidenced
- Gate 0 and the Phase 0 audit, research, parity, risk, cost and architecture decision pack are recorded.
- NOVA 2.0 modular React/Vite web app, Node API, shared contracts, PostgreSQL schema, Darbar, Sakha, Diwan and synthetic mock wallet are implemented on the isolated rebuild branch.
- Five synthetic evaluation sets contain 30 cases each (150 total), with Hindi, English and Hinglish coverage; fixture validation passed.
- GitHub Actions run #421: the checks job passed typecheck, lint, format, unit tests, i18n, scheme and secret checks, mock evals, npm audit, build, Playwright E2E, bundle budget and Lighthouse.
- Lighthouse: Performance 95–96, Accessibility 100, Best Practices 100, SEO 91; LCP 1.9–2.1 s; CLS 0; TBT 0–10 ms.
- Bundle: JavaScript 203.97 kB (65.76 kB gzip); CSS 15.83 kB (3.94 kB gzip). Render npm install reported 0 vulnerabilities.
- Free Render staging service nova-2-staging is live at https://nova-2-staging.onrender.com. Last confirmed live SHA is 3098a4aa6d98105da930c513894089b949be10b2; the documentation-only candidate 5cf3ed56e92e239945ae476ca40537a8bedb1aab has a staging deployment in progress.
- Staging migration log confirms the NOVA 2.0 staging mock-wallet schema applied; API started and /api/health returned HTTP 200.
- PR #103 is open as Draft, unmerged and mergeable. main remains identical to its base SHA; the rebuild branch is 410 commits ahead and 0 behind.
- CI was hardened to read-only repository permissions and deterministic lockfile installs; no CI bot push is required.

## Gates
- Gate 0: PASS.
- Gate 1: IN PROGRESS — checks job passed; isolated database job is still running.
- Gate 2: IN PROGRESS — local Supabase migration/RLS, durable mock-wallet integration and synthetic backup/restore are pending the database job. Hosted Supabase Auth is NOT VERIFIED.
- Gate 3: IN PROGRESS — Playwright E2E passed; physical Android and real provider parity remain NOT VERIFIED.
- Gate 4: IN PROGRESS — wallet is synthetic/mock-only; database integration job is pending. No real payment provider or money movement.
- Gate 5: IN PROGRESS — Lighthouse and bundle targets passed. CI frame sampling is 60 Hz browser emulation only; physical 90/120 Hz is NOT VERIFIED. Hosted load/latency and hosted backup/restore are NOT VERIFIED.
- Gate 6: IN PROGRESS — staging is live and healthy on the last confirmed deployment; latest documentation-only deployment is in progress. Staging rollback rehearsal remains NOT VERIFIED.

## Hard boundaries
- Production Render service srv-dbidhpc9v7es73d6ia80, production Supabase, main, production secrets and production data were not changed.
- No paid resources, real provider calls, real user data, real documents, payment account, KYC, settlement or money movement.
- AI and wallet remain mock-first. No real-model evaluation is run without an existing staging key; no real documents are sent to providers.
- Phase 7 remains prohibited until the owner types exactly APPROVE RELEASE.

## NOT VERIFIED / open risks
- Isolated local Supabase database job and hosted test-database table inspection.
- Hosted Supabase Auth, real sign-in, account export/deletion and storage deletion.
- Physical Android layout on the target phone, screen-reader review and actual 90/120 Hz performance.
- Hosted backup/restore and Render staging rollback rehearsal.
- Real AI provider quality, cost and privacy; no staging provider key is configured.
- Official scheme records and official contact dataset remain intentionally empty.
- Load testing, hosted latency, production compatibility and production rollback.

## NEXT ACTION
Finish GitHub Actions run #421 database job; capture schema, wallet and synthetic backup/restore results. Then verify the latest documentation-only staging deploy and finalize gate evidence without merging or deploying to production.
