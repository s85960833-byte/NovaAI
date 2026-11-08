## Authoritative production re-audit — 8 November 2026

This status block supersedes older release checkpoints below. Historical entries are retained as audit history only.

- Integrated NOVA UI + Business Intelligence candidate PR #74 and the live-smoke-check correction PR #75 are **merged**. Production `main` is `25de14c7b9c5e44b7a716eaa9ea22ffe63f40c1a`.
- Supabase project `qrfwsewppafhxibdboam` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1`. All 15 migration versions are present, including the three forward migrations: rate-limit search_path hardening, owner/admin-only audit reads and branding backfill.
- Deployed `nova-bi-api` is **ACTIVE v14**, with JWT verification enabled. Direct SQL confirms `nova_bi_consume_rate_limit` has an empty search_path; EXECUTE is denied to `anon` and `authenticated`, and allowed to `service_role`. All 10 NOVA BI tables have RLS enabled; audit SELECT is restricted to active owners/admins.
- Supabase Security and Health Advisors report zero findings. Performance Advisor reports 13 INFO-level unused-index notices; do not drop indexes without workload evidence.
- **Render has not deployed the merged main commit.** Service `srv-dbidhpc9v7es73d6ia80` is configured for branch `main` with auto-deploy enabled, but its newest deployment remains the old production baseline `48e12a68af656b471853ac2a4509da0e3df7ab24`. The main CI run [#42457722518](https://github.com/s85960833-byte/NovaAI/actions/runs/42457722518) failed only at its live-deployment wait: the current site returned HTTP 404 for `/nova-app.js`. Do not claim the merged frontend is live until a new Render deploy is confirmed and the live smoke passes.
- Render remains on the Free plan in Singapore with no configured health-check path. No plan, region, environment-variable or health-check change is authorized by this status update.
- Still unverified: real signup/confirmation/reset and invitation email delivery, Auth Site URL/redirect allow-list and custom SMTP, two-real-account tenant isolation on live Auth, physical Android touch/accessibility/performance, backup/restore drill, privacy/retention/account deletion and incident response, full membership/invitation revocation, CSP tightening, and GitHub branch protection (`main.protected=false`, no rulesets).
- The app's general chat/settings/history remain browser-local; general NOVA account-backed chat sync and paid billing/entitlement enforcement are not established. BI CSV raw rows remain browser-local; workflow items are proposals, not external action execution; risk scores are heuristics; exports are capped at 100 latest records.
- **Release decision: NO-GO for paid customer onboarding, confidential company data, SLA/availability promises or production-readiness claims.** Automated browser tests are not a physical Android test. Do not describe the new UI as live until Render deploy and production smoke pass.

---

# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. The current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

**Only limited concept/discovery conversations are permitted. Paid sales, customer onboarding and live-product claims remain on hold until production readiness is explicitly cleared in `PITCH_READINESS.md`.**

The unified NOVA candidate (three-workspace UI + Business Intelligence) is on `feature/nova-integrated-release-clean-20261108` in Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74). It is not the Production release.

Production URL: https://novaai-4auo.onrender.com

Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. Clean Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74) is the authoritative candidate and remains unmerged/undeployed. Its Checks tab is the only source for current exact-head CI; earlier green runs do not verify later commits. Live Supabase still has wildcard CORS, broad audit-log SELECT policy and the older rate-limit function search_path; candidate fixes are not live. See `PITCH_READINESS.md` for release gates.

## Architecture

- Frontend: `index.html` plus modular browser JavaScript.
- Backend: Express server in `nova-server.txt`.
- Runtime: Node.js 22.
- Start command: `node nova-server.txt`.
- Existing general chat/settings data uses browser-local storage. Do not describe it as cloud-synced.
- Provider keys belong in server-side environment variables, never in browser code or commits.

## Verification — integrated candidate

The unified candidate is maintained in Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74). The latest exact-head candidate CI is [#42456085762](https://github.com/s85960833-byte/NovaAI/actions/runs/42456085762) on `d7b72cd113126aa2580c942bae1d7c404ad2e32a`: 34 successful steps, 0 failures and 4 live-only checks skipped. The current PR head and Checks tab remain authoritative. It passed syntax, Markdown link injection regression tests, mode registry, rate-limit and provider-URL tests, PDF.js 6.5.438 security checks plus Chromium module/worker and actual PDF-upload tests, PostgreSQL migration/RLS integration, Deno Edge Function type-check and tests, BI calculations/CSV validation, evaluation-fixture validation, production dependency audit, local routes/PWA runtime smoke, graceful shutdown, Company Cloud browser workflows, Chromium workspace interactions, CSP violation checks and five-viewport mobile/drawer regression tests. Four live-only checks remain skipped on the unmerged feature branch.

The candidate Edge Function now rejects non-object JSON request bodies (including `null`, arrays and scalar values) with HTTP 400; dedicated Deno tests cover object, empty, malformed and non-object bodies. The candidate now uses exact-origin NOVA BI CORS with tests for exact-origin, lookalike-origin, opaque-origin and insecure-URL rejection. Its two inline frontend script blocks have been moved into `nova-config.js` and `nova-app.js`; the backend serves them and the PWA offline shell caches them. Static and runtime tests cover those changes and the secret-safe `persistable()` storage contract.

The workflow skipped the deployed Edge Function CORS smoke and live Render/provider/free-provider image-generation steps on this feature branch; these remain live-release gates. Physical Android testing, real signup/password-reset email delivery and two-real-account tenant isolation were not performed. The PostgreSQL 17 integration test now covers cross-tenant read denial for datasets, analyses, workflow proposals, approvals, executions, branding and audit events, plus attempted outsider insert/update/delete operations; this remains isolated-database evidence rather than a real-account live test. The 60-case evaluation fixture validates fixture structure only; it is not a live AI accuracy score. CSP is improved but not strict: `script-src` no longer permits `'unsafe-inline'`; automated Markdown attribute-injection and Chromium CSP checks passed. Inline styles and broad HTTPS `connect-src` still require hardening. The three live Render/provider/image checks were skipped because there is no isolated candidate preview. Passing CI does not prove the candidate is error-free or production-ready.

**Live security discrepancy:** a fresh read-only inspection found the currently deployed `nova-bi-api` v13 still sends wildcard CORS (`Access-Control-Allow-Origin: *`). The candidate implements exact-origin checks, and its deployed-function smoke test now verifies both the approved NOVA origin and rejection of an untrusted origin. The live Edge Function has not been replaced; do not claim the deployed endpoint is hardened yet.

## Release gates still open

- Approved preview/release path and deployment of the exact candidate.
- Real signup, email confirmation/SMTP and Supabase Auth redirect allow-list verification.
- Two-real-account tenant-isolation checks.
- Physical Android verification of touch, keyboard, visual fit, saved chats/settings, low-network behavior and permissions.
- Live non-paid chat, search, voice and image-provider smoke tests on the approved candidate preview.
- Public HTTPS response-header/HSTS verification and post-deploy regression.
- Backup/restore, retention, privacy and incident-response review.
- Explicit approval before applying any live Supabase migration, changing Auth settings, merging or deploying.

No merge, Production deployment, live Supabase migration, Edge Function replacement, Auth configuration change or paid resource change is authorized by this candidate.

## NOVA Business Intelligence

NOVA BI is included in clean unified Draft PR #74 but is not launched or deployed. Do not use it with sensitive company data until real-account, privacy, retention and backup/restore gates are completed.

The inspected Supabase project has 12 migrations, 10 RLS-enabled BI tables and an ACTIVE JWT-protected Edge Function v13. The latest Security and Health Advisors reported zero findings; Performance Advisor reported 13 unused-index INFO notices. Auth user, organization and membership counts were zero at the last inspection. These checks are not an enterprise certification or a public-launch approval.

## Honest product limitations

- The provider fan-out diagnostic endpoint `/api/live/selftest` is disabled by default to prevent public callers from triggering many upstream requests; enable `LIVE_SELFTEST_ENABLED=1` only for an operator-authorized check, then turn it off.
- Provider availability, free-tier quotas, latency and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login and cloud chat sync are not established on the current Production baseline.
- Do not use NOVA BI with sensitive or regulated company data before its release gates are complete.
- Automated checks are not a security certification or a guarantee of zero errors.

Use [NOVA_PITCH_KIT.md](NOVA_PITCH_KIT.md) as the copy-ready founder pitch pack. [PITCH_READINESS.md](PITCH_READINESS.md) is the technical evidence and release-gate record; [PITCH_SCRIPT.md](PITCH_SCRIPT.md) is the short demo script.

## Current authoritative release checkpoint — 8 November 2026

- Unified candidate PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74) is open, Draft, unmerged and undeployed. The current branch head and comparison are shown live in the PR; no fixed ahead-count is recorded here.
- Latest application-code verification snapshot: `7f7d6bc475359c19975dbb8702205af5ad86cb30`; [CI run #42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) passed with 44 BI unit tests, 12 Deno tests and 6 Playwright browser tests passed; live-only checks remain skipped. Later changes include documentation corrections and the PostgreSQL RLS integration-test update. The latest test-only candidate commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943); four live-only checks remain skipped.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; Render is configured to deploy `main`. No production merge, deploy, migration or Auth/SMTP change was made.
- Live Supabase findings remain as described above: candidate owner/admin-only audit-read and rate-limit search-path migrations are not applied; deployed CORS remains wildcard and live audit reads still include active members.
- Browser-based viewport tests are Chromium simulations, not a physical Android test. Real signup/password-reset email delivery, two-account tenant isolation, backup/restore, privacy/retention/deletion, hosting/health checks, region review, CSP hardening and branch-protection verification remain release gates.
- **Decision: NO-GO for paid sales, onboarding or production promises.** Only clearly disclosed non-sensitive concept feedback is appropriate until release gates are completed and explicitly approved.

This checkpoint supersedes older candidate-head and release-status notes above; historical checkpoints are retained as audit history.


## Current re-audit pointer — 8 November 2026

Clean [PR #74](https://github.com/s85960833-byte/NovaAI/pull/74) is the live source of truth for the consolidated candidate head, PR state and exact-head Checks/Actions. It remains Open, Draft, Unmerged and Undeployed. The current exact-head CI [#42456085762](https://github.com/s85960833-byte/NovaAI/actions/runs/42456085762) passed with 34 successful steps, 0 failures and 4 live-only checks skipped. The live PR Checks tab remains authoritative for future commits. GitHub reports `main.protected: false` and no repository rulesets. Production `main` remains unchanged. Live CORS/migrations, real Auth/SMTP, two-account isolation, physical Android, backups/restore, privacy/deletion, hosting and CSP remain release gates. NO-GO for production, paid sales or customer-data onboarding.


## Migration alignment update — 8 November 2026

The candidate's 12 historical NOVA BI migration filenames now match the exact versions/names in the connected Supabase ledger. Three forward migrations remain pending; an authorized DBA must verify `supabase migration list --remote` and `supabase db push --dry-run --remote` show only those three before any approved production push. No production migration or deployment has been performed. Live wildcard CORS, broad audit-log SELECT and the older rate-limit search_path remain release blockers.


## Exact-head verification — 8 November 2026

Candidate head `d7b72cd113126aa2580c942bae1d7c404ad2e32a` passed [CI #42456085762](https://github.com/s85960833-byte/NovaAI/actions/runs/42456085762) with 34 successful steps, 0 failures and 4 live-only checks skipped. The 12 historical migration filenames now align with the remote ledger; three forward migrations remain pending a remote dry-run and owner approval. Live CORS, audit-read policy and rate-limit search_path remain unchanged. The candidate is not deployed.
