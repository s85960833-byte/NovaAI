# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. The current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

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

The unified candidate is maintained in Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73). The last full application-code verification snapshot is `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d`, which passed runs [#1200](https://github.com/s85960833-byte/NovaAI/actions/runs/42345216545) and [#1201](https://github.com/s85960833-byte/NovaAI/actions/runs/42345221304). The current candidate head is `51222883356029114e3d26b07f422e83bb1bbeb3`; the commits after the code-verification snapshot are documentation-only, and exact-head runs [#1213](https://github.com/s85960833-byte/NovaAI/actions/runs/42346013628) and [#1214](https://github.com/s85960833-byte/NovaAI/actions/runs/42346016036) both passed. Its verification job passed syntax, mode registry, rate-limit unit tests, PostgreSQL migration/RLS integration, Deno Edge Function type-check and invitation tests, auth/CORS smoke, BI calculations/CSV validation, 60-case fixture validation (fixture structure only, not a live AI accuracy score), dependency audit, local routes/PWA runtime smoke, Company Cloud browser workflows, Chromium workspace interactions, five-viewport mobile/drawer regression tests and artifact upload. Live Render/provider/image steps were skipped by design because no preview deployment was authorized. Runtime smoke tests verify throttling before JSON parsing, JSON 400/413 handling, and that the provider fan-out diagnostic endpoint is disabled by default. A reproducible `npm ci` lockfile is included. The workflow included:

- Backend/frontend syntax and isolated mode registry checks.
- PostgreSQL migration application and tenant RLS integration tests.
- Deno Edge Function dependency installation, type-check, auth and CORS smoke checks.
- BI calculations, CSV validation and 60-case evaluation fixture validation (not a live AI accuracy score).
- Production dependency vulnerability audit.
- Local routes, response headers and PWA asset checks, including offline caching.
- Company Cloud browser workflow tests.
- Chromium workspace interactions and five-viewport mobile/drawer regression checks at 360, 390, 412, 760 and 1280 CSS-pixel widths.
- Devanagari font setup and browser screenshot/report artifact upload.

The workflow **skipped** live Render/provider checks and live free-provider image generation by design. Those steps require an authorized preview/deployment. Physical Android testing was not performed. Run #1194 is the latest full code-verification run before documentation-only updates; the later documentation-only head `5eb0d0cd92f7678636e57ca28ea2692100abff9a` also passed #1197 and #1198. Live Render/provider and free-provider image-generation steps were skipped because preview deployment was not authorized. Passing CI does not prove the candidate is error-free or production-ready.

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
