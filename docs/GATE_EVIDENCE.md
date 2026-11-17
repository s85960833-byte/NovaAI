# NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only when a recorded command/tool result proves it. Source files and successful builds alone do not prove hosted behaviour. Production and NOVA 1.0 remain read-only.

| Gate | Required evidence | Current result | Evidence / limitation |
|---|---|---|---|
| Gate 0 — architecture and parity | Owner-approved ADR, parity, risk and cost pack | PASS | Owner-approved defaults and Phase 0 pack are recorded in \`docs/PHASE_0_GATE_0_PACK.md\`. |
| Gate 1 — isolated rebuild foundation | Dedicated branch, reproducible install, typecheck, lint, tests, secrets/i18n/scheme checks | IN PROGRESS | GitHub Actions run #421 \`checks\` job PASS. The separate \`database\` job is still running. |
| Gate 2 — data/security foundation | Local Supabase migration, RLS assertions, append-only wallet ledger, synthetic integration tests, export/deletion review | IN PROGRESS | Local Supabase migration/RLS and mock-wallet DB tests are running in the isolated CI job. Hosted Supabase Auth and full account deletion are NOT VERIFIED. |
| Gate 3 — product parity and Diwan | Sakha + Diwan flows, mobile E2E, mock AI fixtures, empty scheme data without invented results | IN PROGRESS | Playwright E2E PASS on Chromium CI. Five fixture suites / 150 synthetic cases passed structural validation. Physical Android and real provider parity remain NOT VERIFIED. |
| Gate 4 — wallet/payment safety | Mock provider, signature validation, idempotency, append-only ledger, refunds, spend caps | IN PROGRESS | Synthetic-only mock wallet and spend guard are implemented. Durable DB integration is pending CI; no real payment provider/account or money movement. |
| Gate 5 — performance/reliability | Lighthouse, bundle budgets, API latency, browser frame sampling, backup/restore rehearsal | IN PROGRESS | Lighthouse: Performance 95–96, Accessibility 100, Best Practices 100, SEO 91; LCP 1.9–2.1 s, CLS 0, TBT 0–10 ms. Bundle: JS 203.97 kB / 65.76 kB gzip; CSS 15.83 kB / 3.94 kB gzip. Frame report is 60 Hz emulation only (p50/p95 16.70 ms); physical 90/120 Hz, hosted latency and hosted backup/restore are NOT VERIFIED. |
| Gate 6 — staging and Phase 7 preparation | Staging health, deployed SHA, smoke tests, PR ready, rollback rehearsal, owner pack | IN PROGRESS | Render staging is Live on SHA \`3098a4aa6d98105da930c513894089b949be10b2\`; migration applied; API started; \`/api/health\` HTTP 200. Draft PR #103 is open. Staging rollback rehearsal is NOT VERIFIED. |

## Verified environment facts
- Rebuild branch: \`nova-2.0/rebuild\`.
- Draft integration PR: https://github.com/s85960833-byte/NovaAI/pull/103 (open, unmerged).
- Staging Render service: \`nova-2-staging\`, Free plan, Singapore region, health path \`/api/health\`.
- Staging URL: https://nova-2-staging.onrender.com.
- Staging database: separate Render Free Postgres instance, synthetic-only schema \`nova2_staging\`.
- Production Render latest observed live deploy remains the 2026-11-09 deploy at SHA \`c3cee61906b88ff111b3a645db55c9c2503cd8f7\`; no production deploy/event was initiated in this work.
- GitHub \`main\` remains identical to base SHA \`bdbeb20881f9b6cef51ff5a9d8a3b80131079a50\`.
- Branch protection was not changed because no branch-protection action is exposed in the available GitHub connection.

## Required final evidence to close gates
1. GitHub Actions run #421 with both \`checks\` and \`database\` jobs green.
2. Latest Render staging deploy Live on the rebuild branch SHA.
3. \`/api/health\` HTTP 200 and synthetic Sakha/Diwan/mock-wallet smoke tests.
4. Lighthouse, bundle and frame-sampling artifacts; physical 120 Hz remains separately NOT VERIFIED.
5. CI synthetic backup/restore output; hosted staging backup/restore remains separately NOT VERIFIED.
6. Draft PR #103 with checks green and release instructions; do not merge or deploy to production.
