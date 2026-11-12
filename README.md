# NOVA AI

NOVA is an India-oriented Hindi-English AI web workspace organized into three areas:

- **NOVA Learn** — learning and study workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — assistant and agent workflows.

Production preview: https://novaai-4auo.onrender.com

## Release status — 8 November 2026

<badge>Limited discovery only</badge>

- Current main commit: `94be54b3e94f2dbccb039425b51d936565ab9eed`.
- Current Render deployment: `dep-dbo5sdbm8hqs73fkvnrg`, status `live`, serving commit `94be54b3e94f2dbccb039425b51d936565ab9eed`.
- Render build succeeded, `node nova-server.txt` started and reported port 10000. The prior main verification run [#42476098568](https://github.com/s85960833-byte/NovaAI/actions/runs/42476098568) passed all CI steps, including source/security checks, PostgreSQL RLS integration, Deno and Edge Function checks, local runtime/PWA, dependency audit, Chromium browser tests, mobile layout checks and live smoke against the then-current production release.
- A new post-deployment verification run is still required to prove the latest deployment's live HTTP behaviour. Direct HTTP verification from the current review environment was unavailable.
- Physical Android testing, real Auth email delivery, redirect allow-list, two-real-account cloud-sync isolation, complete account deletion, backup/restore and full live AI accuracy/latency/cost evaluation are not yet verified.

## Data and privacy notes

- Chat history remains browser-local by default.
- Optional account cloud sync is OFF by default and requires explicit opt-in.
- If enabled, the current snapshot stores up to 40 recent chats (up to 150 messages per chat), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Users should avoid syncing sensitive information.
- Disabling sync stops future uploads but does not delete an existing cloud backup. The user must use the separate delete-cloud-backup control.
- Real signup/confirmation/reset email delivery, Auth redirects and two-account isolation have not been verified end to end.
- A complete self-service account deletion and a published retention schedule are not available yet.

## Commercial and operational limits

- No paying customers, revenue, traction, valuation or certification are represented.
- Paid checkout, server-side subscription entitlements, cancellation/refunds, tax invoices and customer support operations are not ready.
- Render uses a Free plan in Singapore with one instance and no always-on guarantee or SLA.
- NOVA BI / Company Cloud is an early preview only. Use synthetic data; do not submit confidential, personal, employee, student, regulated or customer data.
- AI outputs and third-party provider availability can be inaccurate, delayed, rate-limited or unavailable.
- Privacy and Terms documents are drafts, not approved legal policies.

## Discovery boundary

Only non-paid, adult-supervised buyer-interest conversations and synthetic-data previews are appropriate. Do not accept payments, deposits, customer data or confidential information. Any ownership, IP transfer, payment, contract or sale discussion must be handled by a responsible adult with qualified legal review.

## Key documents

- [Buyer interest brief](BUYER_INTEREST_BRIEF.md)
- [Pitch readiness checklist](PITCH_READINESS.md)
- [Privacy notice draft](PRIVACY_NOTICE_DRAFT.md)
- [Terms of use draft](TERMS_OF_USE_DRAFT.md)
- [Support and incident runbook](SUPPORT_AND_INCIDENT_RUNBOOK.md)

## Architecture

- Frontend: `index.html` and modular browser JavaScript.
- Backend: Express server in `nova-server.txt`.
- Runtime: Node.js 22.
- Start command: `node nova-server.txt`.
- Supabase provides authentication and the optional per-user workspace-sync table, protected by row-level security.
- Provider secrets must remain server-side; never commit keys or expose them in browser code.


## Cloud-sync limitation to disclose

A code review found that local chats with the same ID overwrite remote versions during sync, so newer messages from another device can be lost. Saved memory and custom instructions are imported only when the local values are empty. Cloud sync is therefore not conflict-safe yet; do not rely on it for important data or present it as production-ready. This must be fixed and regression-tested before customer onboarding.


## Local and Render environment setup

- Use Node.js 22 and run `npm install` followed by `npm start`.
- Copy `.env.example` to `.env` for local development. The `.env` file is ignored by Git; never commit provider keys.
- Server-side AI chat requires at least one of `LLM_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY`. Configure the secret in Render's Environment settings, not in browser JavaScript or GitHub.
- Optional provider integrations are documented in `.env.example`. Do not enable paid image generation unless a separate budget is explicitly approved; the example keeps `ALLOW_PAID_IMAGE=false`.
- `GET /health` reports process liveness only. It intentionally does not depend on AI/search vendors, so Render can distinguish a running web service from optional provider availability.
- The operator-only live provider test is disabled by default. Keep `SELFTEST_ON_START=0` and `LIVE_SELFTEST_ENABLED=0` outside a supervised verification window.
