# NOVA AI

NOVA is an India-oriented Hindi-English AI web workspace organized into three areas:

- **NOVA Learn** — learning and study workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — assistant and agent workflows.

Production preview: https://novaai-4auo.onrender.com

## Release status — 12 November 2026

<badge>Latest PR revision pending Staging verification; Production release held</badge>

- Production `main` remains at commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7`, served by Render deployment `dep-dbom7bbm8hqs73ec2gi0` (Live). PR #98 is still Draft and has not been merged.
- PR #98 contains the Learn-first bilingual mobile workspace updates and backend diagnostic improvements. Its current branch is `fix/nova-home-learn-first-mobile-20261109`.
- Free Render staging service `novaai-pr98-staging` is configured for that PR branch, but its latest recorded deployment is still commit `195739a04895de364a5af22aa61f930d5d782cbb`, older than the latest revision shown on [PR #98](https://github.com/s85960833-byte/NovaAI/pull/98). The older deployment's build/start and internal live self-test verified the health endpoint, frontend, manifest, PWA icon, service worker, news feed and live data retrieval; these results do **not** verify the latest PR revision.
- The previous PR candidate passed GitHub verification and browser workflows, including syntax/security, PostgreSQL tenant RLS, Deno checks, local routes/PWA, browser/account flows, Company Cloud mobile flows and five-viewport responsive/drawer checks. The current PR head includes SEO metadata and crawler endpoints; check its exact-head CI before counting it as passed. PR workflows skip production-only live smoke tests while the PR remains unmerged. Chromium viewport tests do not replace physical Android-device testing.
- AI chat is not enabled on staging until a server-side model provider is configured. Physical Android handset and real microphone capture are not yet verified. Direct external HTTP inspection from the review environment was unavailable; Render deployment and internal self-test logs are the available staging evidence.
- The app is not approved for Production release or customer onboarding until provider configuration, physical-device checks, and the remaining privacy/authentication controls are reviewed.

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

- [Phase 1 product and technical audit](PHASE1_AUDIT.md)
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


## Cloud-sync status and limitation

- The current client reads the remote snapshot before writing, merges message histories and deleted-chat tombstones, then uses an `updated_at` compare-and-swap update with bounded retries. Unit tests cover overlapping and divergent message histories and deletion tombstones.
- This reduces stale whole-snapshot overwrites; it is not a full CRDT or per-message/field-level conflict-resolution system. Memory and custom-instruction fields do not have independent version histories.
- Real concurrent two-device Supabase sync, recovery after network interruption, and user-level deletion/retention flows have not been verified end to end. Keep cloud sync optional, export local backups, and do not rely on it as the only copy of important data.


## Local and Render environment setup

- Use Node.js 22 and run `npm install`.
- For local development, copy `.env.example` to `.env` and run `npm run start:local`; this loads the optional local file without changing Render's required start command. The `.env` file is ignored by Git; never commit provider keys.
- Render continues to use `node nova-server.txt` and receives secrets only from its Environment settings.
- Server-side AI chat requires a configured provider key in Render Environment. For low-volume no-cost testing, OpenRouter's `openrouter/free` router selects a currently available free model; free usage is rate-limited and availability can change. See [OpenRouter free models](https://openrouter.ai/collections/free-models) and [free-model limits](https://openrouter.ai/pricing). Do not buy credits for this setup.
- If using Groq, set `GROQ_MODEL` explicitly to a currently supported model and check its current billing terms; the server deliberately has no implicit Groq model default. Do not assume all provider models are free.
- Provider secrets belong in Render Environment, never browser JavaScript or GitHub. Optional provider integrations are documented in `.env.example`. Paid image generation remains disabled unless separately approved; `ALLOW_PAID_IMAGE=false`.
- `GET /health` reports process liveness only. It intentionally does not depend on AI/search vendors, so Render can distinguish a running web service from optional provider availability.
- The operator-only live provider test is disabled by default. Keep `SELFTEST_ON_START=0` and `LIVE_SELFTEST_ENABLED=0` outside a supervised verification window.
