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

The unified candidate is maintained in Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73). The latest verified candidate snapshot `4173eee7df01d64bc0637335f8d476ae7f5f7f5f` passed GitHub Actions run [#1100](https://github.com/s85960833-byte/NovaAI/actions/runs/42335572164), with 33 steps completed, 30 successful, 3 live-environment checks skipped by design and 0 failures. A reproducible `npm ci` lockfile is included. The workflow included:

- Backend/frontend syntax and isolated mode registry checks.
- PostgreSQL migration application and tenant RLS integration tests.
- Deno Edge Function dependency installation, type-check, auth and CORS smoke checks.
- BI calculations, CSV validation and 60-case evaluation fixture validation (not a live AI accuracy score).
- Production dependency vulnerability audit.
- Local routes, response headers and PWA asset checks, including offline caching.
- Company Cloud browser workflow tests.
- Chromium workspace interactions and five-viewport mobile/drawer regression checks at 360, 390, 412, 760 and 1280 CSS-pixel widths.
- Devanagari font setup and browser screenshot/report artifact upload.

The workflow **skipped** live Render/provider checks and live free-provider image generation by design. Those steps require an authorized preview/deployment. Physical Android testing was not performed. Passing CI does not prove the candidate is error-free or production-ready.

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

- Provider availability, free-tier quotas, latency and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login and cloud chat sync are not established on the current Production baseline.
- Do not use NOVA BI with sensitive or regulated company data before its release gates are complete.
- Automated checks are not a security certification or a guarantee of zero errors.

See [PITCH_READINESS.md](PITCH_READINESS.md) for the current pitch scope, verified facts and release gates. See [PITCH_SCRIPT.md](PITCH_SCRIPT.md) for the short pitch and demo flow.
