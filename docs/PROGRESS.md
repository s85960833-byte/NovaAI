# NOVA Indian Study & Work Assistant — Progress Checkpoint

**Last updated:** 15 November 2026  
**Current phase:** Phase 0 — Audit, safety net and known issues  
**Status:** IN PROGRESS — gate not passed  
**Production:** unchanged; no merge or deploy performed.

## Exact repository state

| Item | Verified value |
|---|---|
| Repository | `s85960833-byte/NovaAI` |
| Default branch | `main` |
| Audited main SHA | `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50` |
| Work branch | `feature/nova-indian-study-work-phase0-20261115` |
| Most recent phase-0 source/doc commit at checkpoint authoring | `756e5e48bdf03cd9abc783e7aa6c32d9fe723217` (docs inventory) |
| Prior focused source fix commit | `2ca4d1c51c2e39222b37a2874227e6f619120594` (legacy splash marker migration) |
| Backup branch | `backup/pre-upgrade` — created from `main` before work-branch code changes |
| Backup tag | NOT CREATED — GitHub connection has no tag-create operation exposed in this session; recorded in `docs/ASSUMPTIONS.md` |
| New work PR | Not opened yet; open only after Phase-0 docs and fix are committed on the isolated branch. |

## Phase 0 task board

| Work item | Status | Evidence / remaining work |
|---|---|---|
| Confirm repository, current main and existing branches/PRs | DONE | GitHub repo metadata, recursive tree, PRs and branch listing inspected. Existing open PRs left untouched. |
| Create backup branch before code change | DONE | `backup/pre-upgrade` created with base `main`. Tag write API unavailable; tag requirement remains open. |
| Read active architecture, feature files, routes, tests and workflows | DONE — source audit | Read current entry, server, frontend/workspace modules, BI modules, account module, mode registry, reference dashboard, package and workflows. Inventory is recorded; this is source-level, not physical-device proof. |
| Write complete feature inventory | DONE — draft | `docs/FEATURE_INVENTORY.md` added. It lists 13 registered modes, user-facing features, routes, env-var names, API/feed dependencies, storage keys, tests, gaps and new roadmap delta. |
| Record assumptions and guardrails | DONE | `docs/ASSUMPTIONS.md` added. |
| Regression matrix/test suite | IN PROGRESS | Existing CI suites mapped in inventory. Feature-by-feature regression matrix and any necessary added tests still need completion and a green exact-head run. |
| Fix known failing regression on current main | FIX APPLIED — CI pending | Current main's browser test fails because legacy intro completion is not migrated to `nova_intro_completed_v2`. Minimal fix is on the isolated work branch in `nova-entry.js`; no other PR is changed. Re-run exact-head CI via a draft PR. |
| Check slow web search / GDELT / weather / CoinGecko / ESPN errors | NOT YET VERIFIED | Static code review and bounded live-provider diagnostics remain; record provider-level status, timeout/429/403 fallbacks and latency from evidence. No fabricated success figures. |
| Evaluation harness | PARTIAL | 60-case fixture validator exists; it validates fixture/harness structure, not live model factual accuracy. Golden dataset and grounded evaluation need definition. |
| Lighthouse / icons / feedback persistence | PARTIAL / OPEN | PWA icons and route smoke exist. No measured Lighthouse >=90 evidence found. Centralized DB feedback persistence is not yet verified/implemented. |
| Live production regression | BLOCKED / NOT VERIFIED | Render production metadata is available; reliable live HTTP responses were not obtained in this session. Current Render deploy is behind GitHub main. |
| Render staging branch and health path | OPEN / NO CHANGE | Staging remains on `fix/nova-home-learn-first-mobile-20261109`, Health Check Path blank, last deploy SHA `7e816af…`. No Render setting changes or staging deploy triggered. |
| Physical Android verification | NOT VERIFIED | Requires actual device/browser interaction; Playwright emulation is not a substitute. |

## Current CI failure and isolated correction

- Latest current-main workflow: [run 43199071222](https://github.com/s85960833-byte/NovaAI/actions/runs/43199071222), head `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`, conclusion **failure**.
- Failing step: `Verify responsive workspace interactions and PDF.js worker in Chromium`.
- Exact assertion: `legacy completion marker must be migrated to the current marker`; observed `null !== '1'`.
- Minimal correction: when a recognized legacy local/session/cookie marker is found, persist the current `nova_intro_completed_v2` marker. It preserves the current entry flow and does not clear chat/user state.
- Related separate draft PR #101 already contains the same fix and its exact-head CI runs [43694630954](https://github.com/s85960833-byte/NovaAI/actions/runs/43694630954) and [43694630928](https://github.com/s85960833-byte/NovaAI/actions/runs/43694630928) are green. PR #101 remains untouched; its health/version changes are not copied into this Phase-0 patch.
- The Phase-0 branch itself still needs exact-head CI; a green CI result for another PR/commit is not proof for this branch.

## Verified Render snapshot

### Production
- Service: `NovaAI`, ID `srv-dbidhpc9v7es73d6ia80`.
- URL: `https://novaai-4auo.onrender.com`.
- Configured branch `main`, Node runtime, build `npm install`, start `node nova-server.txt`, Free plan, Singapore, auto-deploy enabled.
- Last deploy: `dep-dbom7bbm8hqs73ec2gi0`, status `live`, commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.
- GitHub main is now `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; production is not serving that latest main SHA.
- Health Check Path is blank.

### Staging
- Service: `novaai-pr98-staging`, ID `srv-dbqm035g1s2s73eogao0`.
- URL: `https://novaai-pr98-staging.onrender.com`.
- Configured branch `fix/nova-home-learn-first-mobile-20261109`, auto-deploy enabled, Free plan.
- Last deploy: `dep-dbs0g58n74is738h58s0`, status `live`, SHA `7e816af473d29f9dd2e1d4cab775cb905f1a82fe`.
- Health Check Path is blank. The PR #101 branch/head is not deployed there.
- No settings were edited and no deploy was triggered.

## Phase gate

**Not passed.** Required before Phase 1:
1. Finish regression mapping and add feature-specific test coverage where missing.
2. Obtain a green exact-head CI run for the Phase-0 work branch.
3. Check provider failure/fallback behavior with safe evidence; distinguish configured providers from unconfigured/unavailable sources.
4. Decide and document tag creation through a supported Git path; current connector cannot create it.
5. Verify live/staging health only where the endpoint/branch can be checked without unsafe deployment changes. Keep physical Android as a separately listed owner-device gate.
6. Do not start Phase 1 until the regression gate passes.

## Safety invariants

- No direct commits or force-push to `main`.
- No production merge/deploy or live Supabase migration.
- No Render branch/health-path update without reviewing its resulting deploy.
- No existing feature removal/renaming or storage-key/schema change.
- No secrets or secret values in repository docs.
- No live payment activation, merchant setup or handling of customer money in this phase.
- No claim of 100% accuracy, 60-second PDF generation, zero broken Hindi glyphs, Lighthouse >=90 or live health without measured proof.
