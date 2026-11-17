# NOVA 2.0 Phase 1–6 Gate Evidence

**Evidence policy:** a gate is PASS only for the scope directly tested. Local/CI success does not imply hosted Auth, physical-device or production verification. Production and NOVA 1.0 remain read-only.

| Gate | Result | Exact evidence / limitation |
|---|---|---|
| Gate 0 — architecture and parity | PASS | Phase 0 ADR, audit, research, parity, risk and cost pack recorded. |
| Gate 1 — isolated rebuild foundation | PASS | GitHub Actions run #513 checks job completed success: typecheck, lint, formatter, unit, i18n, schemes, secrets, 150 synthetic evals, audit, build, Playwright E2E, bundle and Lighthouse. A final clean CI run after removing the temporary formatter-candidate helper is being run. |
| Gate 2 — data/security foundation | PASS (isolated CI DB) | Local Supabase stack started. Clean \`supabase db reset\` applied migration \`20261117120000_nova2_initial.sql\`; \`RLS_AND_SCHEMA_CHECK_PASS\`; \`ACCOUNT_EXPORT_RLS_ISOLATION_PASS\`; \`ACCOUNT_DELETE_CASCADE_AND_USAGE_ANONYMISATION_PASS\`. Hosted Auth and application export/download endpoint remain NOT VERIFIED. |
| Gate 3 — product and Diwan | PASS (Chromium CI) | Playwright E2E passed. Tests include responsive viewports, language, Sakha mock, Diwan Paper Reader, Scam Check, scheme empty state, RTI, mock wallet, /perf and reduced-motion fallback. Physical Android remains NOT VERIFIED. |
| Gate 4 — wallet/payment safety | PASS (mock-only) | 5 DB integration tests passed: capture/invalid signature/duplicate/event-ID reuse/refund/second refund; delayed capture and late failure; concurrent duplicate; insufficient balance/dedupe/reconciliation/append-only; user/global spend caps and provider failure. No real payment rails or money movement. |
| Gate 5 — performance/reliability | PASS (automated envelope) | Six frame scenarios × 90 samples: p50/p95 16.7/16.7 ms, zero dropped frames, 60 Hz Chromium emulation. Lighthouse three runs 88/95/95 Performance (median95), A11y100, Best100, SEO91; LCP 2.06–2.28 s; CLS0; TBT 0–260 ms. Staging read-only load 24/24; p50 269.6 ms, p95 762 ms, max773.9 ms. Physical 90/120 Hz, repeated worst-case Lighthouse, hosted backup and sustained load remain NOT VERIFIED. |
| Gate 6 — staging and release preparation | PARTIAL | Staging /api/health and read-only load passed, but Render's last confirmed Live SHA is older than tested branch source; hosted /perf live route and actual previous-deploy rollback are NOT VERIFIED. |

## Verified environment facts
- Rebuild branch: \`nova-2.0/rebuild\`.
- Draft integration PR: https://github.com/s85960833-byte/NovaAI/pull/103 (open, unmerged).
- Verified source under CI #513: \`5976ef98927977ebd93ae1a47b0f83ce4ab89e6b\`.
- Free staging service: \`nova-2-staging\`, Singapore, health path \`/api/health\`, https://nova-2-staging.onrender.com.
- Last confirmed Render Live deployment: \`dep-dbu78el6e07s73c17b80\`, SHA \`5cf3ed56e92e239945ae476ca40537a8bedb1aab\`; later branch head has not been observed Live.
- Database CI uses an ephemeral local Supabase stack only; no production Supabase connection.
- Production Render latest observed Live deploy: 2026-11-09, SHA \`c3cee61906b88ff111b3a645db55c9c2503cd8f7\`.
- GitHub \`main\` unchanged at base SHA \`bdbeb20881f9b6cef51ff5a9d8a3b80131079a50\`.
- Branch protection not changed; no branch-protection API action available.

## Restore evidence

CI #513 backup artifact #14347895119 contains a custom-format dump and table list. Database job used \`postgres:17-alpine\` tools to match Supabase Postgres 17.12, dumped only \`nova2_staging\`, restored to separate local \`nova2_restore_check\`, compared row counts, and passed:
- Tables restored: 5
- Rows before/after (wallet_accounts:wallet_orders:wallet_ledger:wallet_events:ai_spend_events): \`3:3:5:6:2\`
- Output: \`SYNTHETIC BACKUP/RESTORE PASS\`
This is an ephemeral CI test database rehearsal, not a hosted Render backup.

## Staging read-only load evidence

CI #513 staging-smoke job made 24 requests (3 workers × 8), alternating \`/api/health\` and homepage, no writes/user data:
- Succeeded 24; failed 0
- p50 269.6 ms; p95 762 ms; max 773.9 ms
- PASS, target p95 < 3 seconds
Artifact #14346728224.

## Remaining release-gate proof required
1. Fresh clean CI after temporary formatter candidate generation removal; standard \`format:check\` must pass from committed files.
2. Render latest staging deploy must match reviewed branch SHA; test hosted \`/perf\` after deployment.
3. Physical phone test and screenshot, including real refresh cadence estimate and Android layout.
4. Render Dashboard manual rollback rehearsal from the previous known-good deploy, timed target <5 minutes, followed by health and synthetic smoke verification.
5. Hosted Supabase/Auth, full export/download endpoint, full account deletion and file-storage erasure require a separate Free test project and explicit owner setup/review.
6. Hosted backup/restore, sustained load and production rollback remain NOT VERIFIED.
