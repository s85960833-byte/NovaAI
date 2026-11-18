# NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only for the scope directly tested on the exact referenced commit. Historical CI results are not current-head proof. Local/CI success does not imply hosted Auth, physical-device or production verification. Production and NOVA 1.0 remain read-only.

## Current HEAD status before the corrective commit

- Branch: `nova-2.0/rebuild`
- HEAD: `478c286c488898430a7adad4e06687b190e36c17`
- Draft PR: https://github.com/s85960833-byte/NovaAI/pull/103
- Latest CI: [run #586](https://github.com/s85960833-byte/NovaAI/actions/runs/44207992414), conclusion **FAILURE**.
- CI #586: npm ci, typecheck and lint passed; `format:check` failed on `scripts/check-dependency-audit.mjs`. Unit, i18n, schemes, secrets, mock evals, audit, build, Playwright, bundle and Lighthouse steps were skipped.
- CI #586 database and staging-smoke jobs were skipped because the checks job failed.
- Staging's last observed Live SHA is `5cf3ed56e92e239945ae476ca40537a8bedb1aab`, not the PR head. Public `/perf` and current-head `/api/health` have not been verified in this report.
- Current-head TypeScript/lint success does not certify tests, build, E2E, Lighthouse or DB.

## Historical evidence — CI #513, older source only

| Gate | Historical result | Evidence / limitation |
|---|---|---|
| Architecture and parity | PASS | Phase 0 ADR, audit, research, parity, risk and cost pack recorded. |
| Isolated rebuild foundation | PASS on CI #513 source | Typecheck, lint, formatter, unit, i18n, schemes, secrets, synthetic evals, audit, build, Playwright E2E, bundle and Lighthouse passed on the older tested SHA `5976ef98927977ebd93ae1a47b0f83ce4ab89e6b`. |
| Data/security foundation | PASS in local isolated CI DB | Clean local Supabase reset; RLS/schema, export isolation and synthetic deletion cascade/anonymisation checks passed. Hosted Auth and real export/download endpoint remain NOT VERIFIED. |
| Product and Diwan | PASS in Chromium CI | Responsive shell, language, Sakha mock, Diwan, Scam Check, scheme empty state, RTI, mock wallet, /perf and reduced-motion tests passed on that older CI source. Physical Android remains NOT VERIFIED. |
| Wallet/payment safety | PASS, mock-only | Five PostgreSQL integration tests covered capture, invalid signature, duplicates, event-ID reuse, refunds, delayed capture, late failure, reconciliation, append-only ledger, non-negative balances and spend caps. No real payment occurred. |
| Performance/reliability | Historical lab pass with known later borderline result | Earlier #513 artifact reported 6 scenarios × 90 samples, p50/p95 16.7/16.7 ms, zero dropped frames at 60 Hz Chromium emulation. A later artifact showed drawer-open and Diwan-transition at p95 16.8 ms vs 16.7 ms nominal budget, still with zero dropped frames. This is browser cadence, not physical device proof. |
| Staging load | Historical read-only pass | 24 GET requests; 24 successful, 0 failed; p50 269.6 ms, p95 762 ms, max 773.9 ms. Does not prove the current deployment or /perf route. |
| Backup/restore | Historical isolated test DB pass | CI #513 restored a custom-format PostgreSQL 17 dump to a separate local restore database and compared five table row counts: `3:3:5:6:2`. This is not hosted Render backup/restore. |
| Staging and release preparation | PARTIAL | Historical staging health/load checks passed, but the latest PR source was not Live and the rollback rehearsal was not performed. |

## Environment facts (last checked 18 November 2026)

- Staging: Render service `nova-2-staging`, `srv-dbu3b63l550s739qet70`, branch `nova-2.0/rebuild`, health path `/api/health`, https://nova-2-staging.onrender.com.
- Last confirmed staging deployment: `dep-dbu78el6e07s73c17b80`, SHA `5cf3ed56e92e239945ae476ca40537a8bedb1aab`.
- Previous listed staging deployment: `dep-dbu760jrjlhs73af6190`, SHA `3098a4aa6d98105da930c513894089b949be10b2`.
- Production: Render service `NovaAI`, `srv-dbidhpc9v7es73d6ia80`, branch `main`, URL https://novaai-4auo.onrender.com.
- Production last observed Live deployment: `dep-dbom7bbm8hqs73ec2gi0`, SHA `c3cee61906b88ff111b3a645db55c9c2503cd8f7`; production health-check path is empty.
- GitHub `main` last observed at `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`, unchanged by this work.
- Local Supabase CI is isolated and uses synthetic identities only. No production database was used.

## Current release blockers

1. Fresh full CI on the current corrective HEAD, with every check, database and staging-smoke job completed.
2. Current-HEAD migration, wallet/webhook/spend-cap, account export/delete and backup/restore evidence in `docs/evidence/`.
3. Latest staging SHA must match the reviewed branch head; health and public `/perf` route must be verified.
4. Staging git-revert/revert-of-revert rehearsal with real deploy timings and health results.
5. Physical Android acceptance and screenshot; browser timing cannot certify a 90/120 Hz panel.
6. Hosted Auth/export/download/storage erasure and production rollback remain NOT VERIFIED.
7. Qualified privacy/legal review, owner UI/copy/pricing/scheme decisions, and exact release phrase.

Phase 7 remains LOCKED until the owner types exactly `APPROVE RELEASE`.
