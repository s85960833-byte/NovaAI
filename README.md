# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. The current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

**External sales and customer pitching are on hold until production readiness is explicitly cleared in `PITCH_READINESS.md`.**

The unified NOVA candidate (three-workspace UI + Business Intelligence) is on `feature/nova-integrated-release-20261106` in Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73). It is not the Production release.

Production URL: https://novaai-4auo.onrender.com

The inspected Production branch head is `48e12a68af656b471853ac2a4509da0e3df7ab24`. The unified candidate has not been merged or deployed. For the exact current PR branch head and latest CI result, see [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73). Do not present the candidate as the live Production build.

## Architecture

- Frontend: `index.html` plus modular browser JavaScript.
- Backend: Express server in `nova-server.txt`.
- Runtime: Node.js 22.
- Start command: `node nova-server.txt`.
- Existing general chat/settings data uses browser-local storage. Do not describe it as cloud-synced.
- Provider keys belong in server-side environment variables, never in browser code or commits.

## Verification — integrated candidate

The unified candidate is maintained in Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73). The latest completed full code/browser verification snapshot is candidate SHA `57c104a6e43d992e06d347c9fe3a45c59a934a18`, GitHub Actions runs [#42374212009](https://github.com/s85960833-byte/NovaAI/actions/runs/42374212009) and [#42374218563](https://github.com/s85960833-byte/NovaAI/actions/runs/42374218563). It passed syntax, Markdown link injection regression tests, mode registry, rate-limit unit tests, PostgreSQL migration/RLS integration, Deno Edge Function type-check and tests, BI calculations/CSV validation, evaluation-fixture validation, production dependency audit, local routes/PWA runtime smoke, graceful shutdown, Company Cloud browser workflows, Chromium workspace interactions, CSP violation checks and five-viewport mobile/drawer regression tests.

The candidate now uses exact-origin NOVA BI CORS with tests for exact-origin, lookalike-origin, opaque-origin and insecure-URL rejection. Its two inline frontend script blocks have been moved into `nova-config.js` and `nova-app.js`; the backend serves them and the PWA offline shell caches them. Static and runtime tests cover those changes and the secret-safe `persistable()` storage contract.

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

NOVA BI is included in unified Draft PR #73 but is not launched or deployed. Do not use it with sensitive company data until real-account, privacy, retention and backup/restore gates are completed.

The inspected Supabase project has 12 migrations, 10 RLS-enabled BI tables and an ACTIVE JWT-protected Edge Function v13. The latest Security and Health Advisors reported zero findings; Performance Advisor reported 13 unused-index INFO notices. Auth user, organization and membership counts were zero at the last inspection. These checks are not an enterprise certification or a public-launch approval.

## Honest product limitations

- The provider fan-out diagnostic endpoint `/api/live/selftest` is disabled by default to prevent public callers from triggering many upstream requests; enable `LIVE_SELFTEST_ENABLED=1` only for an operator-authorized check, then turn it off.
- Provider availability, free-tier quotas, latency and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login and cloud chat sync are not established on the current Production baseline.
- Do not use NOVA BI with sensitive or regulated company data before its release gates are complete.
- Automated checks are not a security certification or a guarantee of zero errors.

Use [NOVA_PITCH_KIT.md](NOVA_PITCH_KIT.md) as the copy-ready founder pitch pack. [PITCH_READINESS.md](PITCH_READINESS.md) is the technical evidence and release-gate record; [PITCH_SCRIPT.md](PITCH_SCRIPT.md) is the short demo script.
