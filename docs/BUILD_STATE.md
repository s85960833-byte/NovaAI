# NOVA 2.0 Build State

**Updated:** 2026-11-18 11:10 UTC  
**Branch:** \`nova-2.0/rebuild\`  
**Verified source SHA for CI #513:** \`5976ef98927977ebd93ae1a47b0f83ce4ab89e6b\`  
**Draft PR:** [#103](https://github.com/s85960833-byte/NovaAI/pull/103)  
**Staging:** https://nova-2-staging.onrender.com

## Current head and NEXT ACTION — 18 November 2026

- PR #103 remains Open, Draft and unmerged. Exact tested source HEAD: `79129155ca4ea439ce20f50767aec78cae32ba54`; base/main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`.
- **Exact-head CI #625 PASS:** [run 44290595546](https://github.com/s85960833-byte/NovaAI/actions/runs/44290595546). All three jobs passed: checks, database and staging-smoke.
- Checks job: Typecheck, Lint, Format, Unit (including 22 Playwright E2E), translation, scheme checks, secret scan, synthetic evals, dependency audit, build, bundle budget and Lighthouse all passed.
- Playwright: 22/22 passed. Includes all three Learn/Build/Agents shortcuts inside the unified shell, legacy mode group visibility, same-origin frame headers, 390px mobile width, accessibility and reduced-motion. The old group-specific mode registry and histories remain in use.
- Bundle: JS gzip 77,127 bytes; CSS gzip 4,859 bytes; configured JS budget 174,080 bytes.
- Lighthouse (3 mobile emulation runs): Performance 99/100/100, Accessibility 100, Best Practices 100, SEO 91; LCP 1.3–1.6 s, TBT 10–80 ms, CLS 0.
- Frame cadence: 6 Chromium-emulated scenarios, p50 16.7 ms / p95 16.7–16.8 ms, 0 dropped frames. This is 60 Hz browser emulation, not physical Android or 90/120 Hz certification.
- Database job: clean isolated Supabase reset; RLS/schema and account-export isolation passed; synthetic deletion cascade/anonymisation passed; 5 wallet integration tests passed; PostgreSQL 17 backup/restore passed for 5 tables with matching row counts `3:3:5:6:2`.
- Staging smoke: 24/24 read-only GETs passed, `/perf` reachable, p50 291.9 ms, p95 733.9 ms, max 804.3 ms, 0 failures. **Important:** this smoke reached the existing staging service but did not prove the deployed source SHA.
- Render `nova-2-staging` service is configured for branch `nova-2.0/rebuild` with auto-deploy enabled, but its latest recorded Live deploy is still old SHA `5cf3ed56e92e239945ae476ca40537a8bedb1aab`, not the tested SHA above. No new staging deploy event is recorded yet. Staging exact-head deployment is therefore BLOCKED / NOT VERIFIED.
- The React home exposes Learn, Build and Agents inside a same-origin `/classic?workspace=...` iframe bridge. This preserves the original mode registry, per-mode history, origin storage and old API handlers. It is **not** a native React rewrite; chat/history, voice/live voice, search/citations, files, image generation, auth/account lifecycle and each specialist mode still need feature-level parity tests.
- Physical Android/Infinix review, hosted Supabase Auth, hosted export/deletion/object-storage erasure, hosted backup/restore and actual rollback are NOT VERIFIED.
- **NEXT ACTION:** resolve why Render auto-deploy has not produced a deployment for the current branch HEAD; once the exact SHA is Live on free staging, re-check `/api/health`, embedded Learn/Build/Agents and read-only smoke against that exact deployment. Then continue remaining feature parity and physical-device checks.
- Production proof: `main` remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; production Render latest Live SHA remains `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. No main, production Render or production Supabase writes were made. Phase 7 remains LOCKED until exact text `APPROVE RELEASE`.

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


## 2026-11-18 unified legacy integration update

The current branch update makes the original NOVA workspace a first-class in-app destination rather than a standalone legacy link. The React shell selects Learn / Build / Agents, the iframe loads the corresponding original group on the same origin, and the old application keeps its existing scripts, browser storage, cookies and legacy API routes. The route-specific frame-header exception is restricted to `/classic`.

The previous CI #513/#591/#593/#620 summaries above or below are tied to their recorded SHAs and must not be treated as proof for a different HEAD. Current exact-head evidence is only CI #620 once it completes.


## Exact-head evidence — CI #625

- Run: https://github.com/s85960833-byte/NovaAI/actions/runs/44290595546
- Artifacts: database evidence `14421097349`, Playwright evidence `14421107270`, Lighthouse evidence `14421192203`, staging-load evidence `14421781625`.
- Playwright confirms 22/22 tests including the embedded same-origin workspace bridge. Frame sampling is Chromium emulation only.
- Staging-load evidence confirms 24/24 GET requests against `https://nova-2-staging.onrender.com`; the service's currently deployed SHA is older than this source HEAD, so this is availability/load evidence only, not current-commit deployment proof.

## 2026-11-18 — legacy NOVA integration follow-up (supersedes older exact-head notes)

### Source changes after the last green CI run

- Current PR branch has moved beyond the last green CI SHA `16def28d3f8c3c4d48254304e1d818d26013311c`.
- Sakha now attempts the existing NOVA live endpoint `/api/chat/completions` first, sending up to the 12 most recent local conversation messages with `stream:false`. It falls back to the isolated `/api/sakha/chat` preview only when the legacy provider does not return a usable response; the resulting mock answer is labelled `MOCK`, while a live answer is labelled `LIVE AI`.
- The original server proxy now removes stale `Content-Encoding` after Express has parsed/inflated JSON, preventing a compressed-request header from being forwarded with a newly serialized plain JSON body.
- Playwright tests were added for live Sakha responses, conversation-context continuity and clearly labelled mock fallback.
- `docs/LEGACY_NOVA_INTEGRATION.md` was rewritten to distinguish the same-origin compatibility bridge from native feature parity; `docs/DECISIONS.md` records the provider and proxy decisions.

### Exact verification boundary

- Latest fully green CI run: #626, `https://github.com/s85960833-byte/NovaAI/actions/runs/44292042385`, on SHA `16def28d3f8c3c4d48254304e1d818d26013311c`. Checks, database and staging-smoke jobs all succeeded.
- **That CI run predates the Sakha adapter, the proxy header fix and the two new Sakha UI tests.** It is historical evidence only and does not verify the current PR head.
- Current source changes have no exact-HEAD CI result yet. Format, typecheck, lint, unit, Playwright, audit, database and staging-smoke must all be rerun on the latest PR head before the branch is treated as verified.
- The latest documented Render staging Live SHA is still `5cf3ed56e92e239945ae476ca40537a8bedb1aab`; it is not proof of the current branch. No staging deploy is being triggered while source and exact-HEAD checks are still pending.
- The root production Render service, production Supabase, `main`, production secrets and real user data remain unchanged. PR #103 remains Draft and unmerged; Phase 7 remains locked.

### Remaining work for the requested single-URL upgrade

1. Obtain a green exact-HEAD CI run including the newly added Sakha tests.
2. Verify staging deploy SHA equals that exact tested SHA, then smoke-test `/`, `/classic`, `/api/health` and all compatibility paths.
3. Exercise every original capability (chat/history, voice/live voice, search/citations, files, images, login/session, Learn/Build/Agents) with synthetic fixtures. The iframe bridge preserves access but is not proof of native feature parity.
4. Complete isolated hosted Auth, account export/deletion and object-storage erasure proof; current SQL-only CI tests are not hosted proof.
5. Perform physical Android/Infinix, accessibility, backup/restore and rollback rehearsals.
6. Only after all gates are green can the production Render build/start configuration and the original public URL be considered for release. No production action is authorized before the exact owner phrase `APPROVE RELEASE`.
