# NOVA Indian Study & Work Assistant — Progress Checkpoint

**Last updated:** 15 November 2026  
**Current phase:** Phase 0 — Audit, safety net and known issues  
**Status:** IN PROGRESS — regression CI passed; production-readiness gate still blocked  
**Production:** unchanged; no merge or deploy performed.

## Exact repository state

| Item | Verified value |
|---|---|
| Repository | `s85960833-byte/NovaAI` |
| Default branch | `main` |
| Audited main SHA | `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50` |
| Work branch | `feature/nova-indian-study-work-phase0-20261115` |
| Most recent validated source/test commit | `06d1a7ebe4dbf3ce8bcc85f361c6cfd57c06133e` (legacy chat CRUD + reload regression) |
| Prior focused source fix commit | `2ca4d1c51c2e39222b37a2874227e6f619120594` (legacy splash marker migration) |
| Backup branch | `backup/pre-upgrade` — created from `main` before work-branch code changes |
| Backup tag | NOT CREATED — GitHub connection has no tag-create operation exposed in this session; recorded in `docs/ASSUMPTIONS.md` |
| New work PR | Draft PR [#102](https://github.com/s85960833-byte/NovaAI/pull/102), base `main`; not merged. |

## Phase 0 task board

| Work item | Status | Evidence / remaining work |
|---|---|---|
| Confirm repository, current main and existing branches/PRs | DONE | GitHub repo metadata, recursive tree, PRs and branch listing inspected. Existing open PRs left untouched. |
| Create backup branch before code change | DONE | `backup/pre-upgrade` created with base `main`. Tag write API unavailable; tag requirement remains open. |
| Read active architecture, feature files, routes, tests and workflows | DONE — source audit | Read current entry, server, frontend/workspace modules, BI modules, account module, mode registry, reference dashboard, package and workflows. Inventory is recorded; this is source-level, not physical-device proof. |
| Write complete feature inventory | DONE — draft | `docs/FEATURE_INVENTORY.md` added. It lists 13 registered modes, user-facing features, routes, env-var names, API/feed dependencies, storage keys, tests, gaps and new roadmap delta. |
| Record assumptions and guardrails | DONE | `docs/ASSUMPTIONS.md` added. |
| Regression matrix/test suite | PASS — exact-head CI | `docs/REGRESSION_MATRIX.md` maps existing product surfaces to tests. Added isolated browser coverage for saved chat retrieval, streamed standard chat, memory/custom instruction persistence/use, rename, pin, delete and reload. Exact-head PR CI runs #3951 and #1452 are green. Live Render/provider steps were skipped on PR events. |
| Fix known failing regression on current main | PASS on isolated branch | Main baseline failed the legacy intro-marker migration assertion. Minimal compatibility migration is in `nova-entry.js`; the current Phase-0 branch exact-head CI is green. No other PR was modified. |
| Check slow web search / GDELT / weather / CoinGecko / ESPN errors | PARTIAL — source audit only | Source confirms bounded timeouts/caches/fallbacks for general search, GDELT→Google News, Open-Meteo→wttr.in, CoinGecko→Coinbase and ESPN→TheSportsDB. Current provider availability, 429/403 rates and latency remain NOT VERIFIED; no live provider calls were run from this session. |
| Evaluation harness | PARTIAL | 60-case fixture schema/uniqueness/shape validation passed. This is not live LLM quality scoring or a grounded 15-chapter golden set. |
| Lighthouse / icons / feedback persistence | PARTIAL / OPEN | 192/512 PNG icons, SVG emblem, manifest and service-worker routes pass local runtime smoke. No measured Lighthouse >=90 evidence. Source search found no first-party DB feedback storage; this remains an implementation gap for the later product/business layer. |
| Live production regression | BLOCKED / NOT VERIFIED | PR CI tests the isolated current-main source in ephemeral CI, not the currently deployed production artifact. Live HTTP checks could not be obtained; Render production is behind GitHub `main`. |
| Render staging branch and health path | OPEN / NO CHANGE | Staging remains on `fix/nova-home-learn-first-mobile-20261109`, Health Check Path blank, last deploy SHA `7e816af…`. No Render setting changes or staging deploy triggered. |
| Physical Android verification | NOT VERIFIED | Requires actual device/browser interaction; Playwright emulation is not a substitute. |

## Current Phase-0 CI result

- Validated Phase-0 head at CI completion: `06d1a7ebe4dbf3ce8bcc85f361c6cfd57c06133e` (PR #102; branch `feature/nova-indian-study-work-phase0-20261115`).
- Main verification workflow [#3951](https://github.com/s85960833-byte/NovaAI/actions/runs/43716609879): **success**. This includes syntax/security checks, cloud-sync merge, provider URL validation, rate limiting, PDF security, disposable PostgreSQL migration/RLS tests, Deno Edge Function type-check and tests, BI calculations/CSV validation, 60-case fixture structure validation, production dependency audit, local runtime/PWA routes, graceful shutdown, Chromium browser smoke, Company Cloud mobile workflow and five-viewport mobile/drawer suite.
- Account/browser verification [#1452](https://github.com/s85960833-byte/NovaAI/actions/runs/43716609875): **success**. This includes account/opt-in sync UI, saved pre-upgrade chat retrieval, mocked streaming standard chat round-trip, saved memory/custom instruction persistence and injection, chat rename/pin/delete, reload persistence, Company Cloud navigation and mobile/drawer checks.
- The browser regression test uses test-only local storage and mocked provider responses; it does not alter an owner's browser data or prove live provider reliability.
- PR-event steps for live Render, external live-provider and free image provider probes were **skipped by workflow conditions**. These are not counted as passes.
- The current CI head passed. A docs-only follow-up commit was added after this validated head to complete repository-side environment-variable inventory; the next exact-head CI run must revalidate the resulting final PR head.

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
1. Create the required backup tag. The available GitHub connector exposes branch/commit writes but no tag-create operation; the existing backup branch is not a substitute.
2. Revalidate the final PR head after the docs-only inventory follow-up commit.
3. Perform live provider diagnostics only through a bounded, authorized configuration that cannot incur paid usage; current live provider status remains unverified.
4. Obtain safe live production/staging HTTP and deployment verification. Staging currently tracks an older branch and a setting change can trigger a deploy, so it was deliberately left untouched.
5. Complete a physical Android check; CI mobile emulation is not device proof.
6. Keep Phase 1 blocked until the required Phase-0 gate is explicitly satisfied.

## Safety invariants

- No direct commits or force-push to `main`.
- No production merge/deploy or live Supabase migration.
- No Render branch/health-path update without reviewing its resulting deploy.
- No existing feature removal/renaming or storage-key/schema change.
- No secrets or secret values in repository docs.
- No live payment activation, merchant setup or handling of customer money in this phase.
- No claim of 100% accuracy, 60-second PDF generation, zero broken Hindi glyphs, Lighthouse >=90 or live health without measured proof.
