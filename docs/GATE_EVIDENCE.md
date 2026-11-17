# NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only when a recorded command/tool result proves it. A source file or successful build alone does not prove hosted behaviour. Production and NOVA 1.0 remain read-only.

| Gate | Required evidence | Current result | Evidence / limitation |
|---|---|---|---|
| Gate 0 — architecture and parity | Owner-approved ADR, parity, risk and cost pack | PASS | Owner approved all 12 Gate 0 defaults in chat; pack saved in `docs/PHASE_0_GATE_0_PACK.md`. |
| Gate 1 — isolated rebuild foundation | Dedicated branch, reproducible install, typecheck, lint, tests, secrets/i18n/scheme checks | IN PROGRESS | Branch `nova-2.0/rebuild`; GitHub Actions run recorded in Actions. Final green run SHA to be inserted after completion. |
| Gate 2 — data/security foundation | Local Supabase migration, RLS/policy assertions, append-only wallet ledger, synthetic integration tests, export/deletion review | IN PROGRESS | Local Supabase job is authoritative. Hosted Supabase Auth is NOT VERIFIED; no hosted Supabase project created. |
| Gate 3 — product parity and Diwan | Sakha + Diwan flows, mobile E2E, mock AI fixtures, empty scheme data without invented results | IN PROGRESS | Playwright suite covers home, drawer, language, Sakha, wallet, scam check, paper reader, RTI and scheme empty state. Await CI result. |
| Gate 4 — wallet/payment safety | Mock provider, signature validation, idempotency, append-only ledger, refunds, spend caps | IN PROGRESS | Synthetic-only ledger and disconnected Razorpay test-design helper. No real provider account or money movement. |
| Gate 5 — performance/reliability | Lighthouse, bundle budgets, API latency, browser frame sampling, backup/restore rehearsal | IN PROGRESS | Build artifact reported 228.05 kB JS / 71.39 kB gzip and 15.74 kB CSS / 3.93 kB gzip in Render build logs for commit `a8c4606`; current final commit must be re-measured. Hosted backup/restore NOT VERIFIED. |
| Gate 6 — staging and Phase 7 preparation | Staging health, deployed SHA, smoke tests, PR ready, rollback rehearsal, owner pack | BLOCKED | Render staging service exists at `https://nova-2-staging.onrender.com`; latest observed deployment failed during DB migration due SQL parser error. Fix committed; successful redeploy and health check still required. No PR opened yet. |

## Verified environment facts
- Rebuild branch: `nova-2.0/rebuild`.
- Staging Render service: `nova-2-staging`, Free plan, Singapore region, health path `/api/health`.
- Staging Render URL: `https://nova-2-staging.onrender.com`.
- Staging database: separate Render Free Postgres instance, synthetic-only schema `nova2_staging`.
- Production Render, production environment, production Supabase and `main` source were not changed.
- Branch protection was not changed (no available branch-protection action exposed to this session).

## Required final evidence to close gates
1. Latest GitHub Actions run with both `checks` and `database` jobs green.
2. Latest Render staging deploy is live and its deployed SHA matches the rebuild branch.
3. `/api/health` returns healthy; smoke tests for Sakha, Diwan and mock wallet pass against staging.
4. Lighthouse report and frame-sampling artifact for the final deployed build.
5. CI backup/restore output; hosted staging backup/restore remains separately marked NOT VERIFIED.
6. Open draft PR to `main`, with all checks green and release instructions; do not merge or deploy.
