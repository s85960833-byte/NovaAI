# NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only when a recorded command/tool result proves it. A source file or successful build alone does not prove hosted behaviour. Production and NOVA 1.0 remain read-only.

| Gate | Required evidence | Current result | Evidence / limitation |
|---|---|---|---|
| Gate 0 — architecture and parity | Owner-approved ADR, parity, risk and cost pack | PASS | Owner approved all 12 Gate 0 defaults in chat; pack saved in `docs/PHASE_0_GATE_0_PACK.md`. |
| Gate 1 — isolated rebuild foundation | Dedicated branch, reproducible install, typecheck, lint, tests, secrets/i18n/scheme checks | IN PROGRESS | Render build PASS at `067ac2fca212ed638924bdbc63796bea84c7f007`; 0 vulnerabilities reported during install. GitHub Actions runs #414/#1500/#3999 returned `action_required` with no jobs exposed; no green CI proof yet. |
| Gate 2 — data/security foundation | Local Supabase migration, RLS/policy assertions, append-only wallet ledger, synthetic integration tests, export/deletion review | IN PROGRESS | Local Supabase job is authoritative. Hosted Supabase Auth is NOT VERIFIED; no hosted Supabase project created. |
| Gate 3 — product parity and Diwan | Sakha + Diwan flows, mobile E2E, mock AI fixtures, empty scheme data without invented results | IN PROGRESS | Playwright suite covers home, drawer, language, Sakha, wallet, scam check, paper reader, RTI and scheme empty state. Await CI result. |
| Gate 4 — wallet/payment safety | Mock provider, signature validation, idempotency, append-only ledger, refunds, spend caps | IN PROGRESS | Synthetic-only ledger and disconnected Razorpay test-design helper. No real provider account or money movement. |
| Gate 5 — performance/reliability | Lighthouse, bundle budgets, API latency, browser frame sampling, backup/restore rehearsal | IN PROGRESS | Render build at `067ac2f` measured 203.97 kB JS / 65.76 kB gzip and 15.83 kB CSS / 3.94 kB gzip. Lighthouse/frame metrics, hosted latency and hosted backup/restore remain NOT VERIFIED. |
| Gate 6 — staging and Phase 7 preparation | Staging health, deployed SHA, smoke tests, PR ready, rollback rehearsal, owner pack | IN PROGRESS | Render build for exact head `067ac2f` succeeded; deploy `dep-dbu755jrjlhs73af3fog` is being checked for migration/startup/health. Prior failure was invalid `DO # NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only when a recorded command/tool result proves it. A source file or successful build alone does not prove hosted behaviour. Production and NOVA 1.0 remain read-only.

| Gate | Required evidence | Current result | Evidence / limitation |
|---|---|---|---|
| Gate 0 — architecture and parity | Owner-approved ADR, parity, risk and cost pack | PASS | Owner approved all 12 Gate 0 defaults in chat; pack saved in `docs/PHASE_0_GATE_0_PACK.md`. |
| Gate 1 — isolated rebuild foundation | Dedicated branch, reproducible install, typecheck, lint, tests, secrets/i18n/scheme checks | IN PROGRESS | Render build PASS at `067ac2fca212ed638924bdbc63796bea84c7f007`; 0 vulnerabilities reported during install. GitHub Actions runs #414/#1500/#3999 returned `action_required` with no jobs exposed; no green CI proof yet. |
| Gate 2 — data/security foundation | Local Supabase migration, RLS/policy assertions, append-only wallet ledger, synthetic integration tests, export/deletion review | IN PROGRESS | Local Supabase job is authoritative. Hosted Supabase Auth is NOT VERIFIED; no hosted Supabase project created. |
| Gate 3 — product parity and Diwan | Sakha + Diwan flows, mobile E2E, mock AI fixtures, empty scheme data without invented results | IN PROGRESS | Playwright suite covers home, drawer, language, Sakha, wallet, scam check, paper reader, RTI and scheme empty state. Await CI result. |
| Gate 4 — wallet/payment safety | Mock provider, signature validation, idempotency, append-only ledger, refunds, spend caps | IN PROGRESS | Synthetic-only ledger and disconnected Razorpay test-design helper. No real provider account or money movement. |
| Gate 5 — performance/reliability | Lighthouse, bundle budgets, API latency, browser frame sampling, backup/restore rehearsal | IN PROGRESS | Render build at `067ac2f` measured 203.97 kB JS / 65.76 kB gzip and 15.83 kB CSS / 3.94 kB gzip. Lighthouse/frame metrics, hosted latency and hosted backup/restore remain NOT VERIFIED. |
 SQL syntax; current migration revision removes that block. |

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
