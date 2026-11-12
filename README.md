# NOVA AI

NOVA is an India-oriented Hindi-English AI web workspace organized into three areas:

- **NOVA Learn** — learning and study workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — assistant and agent workflows.

Production preview: https://novaai-4auo.onrender.com

## Release status — 12 November 2026

<badge>Latest PR revision pending Staging verification; Production release held</badge>

- Repository `main` currently points to `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; Production Render still serves commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7` via deployment `dep-dbom7bbm8hqs73ec2gi0` (Live). PR #98 is still Draft and has not been merged.
- PR #98 contains the Learn-first bilingual mobile workspace updates and backend diagnostic improvements. Its current branch is `fix/nova-home-learn-first-mobile-20261109`.
- Free Render staging service `novaai-pr98-staging` is configured for that PR branch, but its latest recorded deployment is still commit `195739a04895de364a5af22aa61f930d5d782cbb`, older than the latest revision shown on [PR #98](https://github.com/s85960833-byte/NovaAI/pull/98). The older deployment's build/start and internal live self-test verified the health endpoint, frontend, manifest, PWA icon, service worker, news feed and live data retrieval; these results do **not** verify the latest PR revision.
- The previous PR candidate passed GitHub verification and browser workflows, including syntax/security, PostgreSQL tenant RLS, Deno checks, local routes/PWA, browser/account flows, Company Cloud mobile flows and five-viewport responsive/drawer checks. The current PR head includes SEO metadata and crawler endpoints; check its exact-head CI before counting it as passed. PR workflows skip production-only live smoke tests while the PR remains unmerged. Chromium viewport tests do not replace physical Android-device testing.
- AI chat is not enabled on staging until a server-side model provider is configured. Physical Android handset and real microphone capture are not yet verified. Direct external HTTP inspection from the review environment was unavailable; Render deployment and internal self-test logs are the available staging evidence.
- The app is not approved for Production release or customer onboarding until provider configuration, physical-device checks, and the remaining privacy/authentication controls are reviewed.

## Search and sharing metadata

- The current PR branch includes a page description, canonical URL, Open Graph/Twitter summary metadata, a root-only sitemap and a robots policy that disallows `/api/`. These endpoints are covered by local runtime smoke tests, but they are not yet live on Production. Search-engine indexing and social-card rendering have not been verified.

## Data and privacy notes

- Chat history remains browser-local by default.
- Optional account cloud sync is OFF by default and requires explicit opt-in.
- If enabled, the current snapshot stores up to 40 recent chats (up to 150 messages per chat), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Users should avoid syncing sensitive information.
- Disabling sync stops future uploads but does not delete an existing cloud backup. The user must use the separate delete-cloud-backup control.
- Real signup/confirmation/reset email delivery, Auth redirects and two-account isolation have not been verified end to end.
- The candidate adds optional Supabase JWT verification for server API routes and browser access-token forwarding. It is feature-gated by `NOVA_API_AUTH_REQUIRED`; the safe default remains `0` until Staging and the sign-in-required experience are verified. Do not treat APIs as authenticated until the flag is enabled and live token tests pass.
- A complete self-service account deletion and a published retention schedule are not available yet.

## Commercial and operational limits

- No paying customers, revenue, traction, valuation or certification are represented.
- Durable per-user/monthly API quotas, hard provider spend caps, paid checkout, server-side subscription entitlements, cancellation/refunds, tax invoices and customer support operations are not ready.
- Render uses a Free plan in Singapore with one instance and no always-on guarantee or SLA.
- NOVA BI / Company Cloud is an early preview only. Use synthetic data; do not submit confidential, personal, employee, student, regulated or customer data.
- AI outputs and third-party provider availability can be inaccurate, delayed, rate-limited or unavailable.
- Privacy and Terms documents are drafts, not approved legal policies.

## Discovery boundary

Only non-paid, adult-supervised buyer-interest conversations and synthetic-data previews are appropriate. Do not accept payments, deposits, customer data or confidential information. Any ownership, IP transfer, payment, contract or sale discussion must be handled by a responsible adult with qualified legal review.

## Key documents
- [Market and differentiation evidence review](MARKET_AND_DIFFERENTIATION_RESEARCH.md)
- [Buyer transfer pack checklist](TRANSFER_PACK.md)
- [Preliminary valuation memo](VALUATION_MEMO.md)

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

- The current client reads the remote snapshot before writing, merges message histories and deleted-chat tombstones, then uses an `updated_at` compare-and-swap update with bounded retries. Unit tests cover overlapping and divergent message histories, deletion tombstones, memory/custom-instruction timestamp conflicts, empty-value deletions and explicit document deletion.
- This reduces stale whole-snapshot overwrites; it is not a full CRDT or per-message/field-level conflict-resolution system. Chat/message conflicts are merged by the current deterministic rules, while memory and custom-instruction fields use client-side timestamps rather than a server-authoritative conflict clock.
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


## Container deployment (alternative to Render)

The repository includes a production-oriented Docker image and a local Compose definition. This is an alternative packaging path for any host that accepts OCI/Docker containers; provider-specific networking, secrets, domain, backups and pricing still need to be configured and verified with that host.

### Local setup

1. Install Node.js 22 and npm.
2. Copy `.env.example` to `.env` and add only provider keys you are authorized to use. Keep `.env` private.
3. Run `npm ci`.
4. Run `npm run start:local`.
5. Open `http://localhost:3000` and confirm `http://localhost:3000/health` returns an OK response.

### Docker setup

1. Install Docker Engine and the Docker Compose plugin.
2. Copy `.env.example` to `.env` and set the required server-side configuration.
3. Run `docker compose up --build -d`.
4. Verify `http://localhost:3000/health` and inspect logs with `docker compose logs -f nova`.
5. Stop with `docker compose down`.

The image installs production dependencies only, runs as the unprivileged `node` user, excludes local secrets from the build context and includes a health check. Do not publish the image with embedded secrets. For an external container host, set the same environment variables in that host's secret manager, configure its assigned `PORT`, expose/map that container port, and configure persistent backups for any external database. The image health check follows `PORT`. No second-host deployment has been performed or claimed.

### Render native Node deployment

Use the existing Render web service, connect the existing repository and intended branch, set the build command to `npm ci`, the start command to `node nova-server.txt`, health check path to `/health`, and add secrets in the Render Environment page. The current Production service and its URL must not be changed during staging validation. For a new service or any billing/ownership action, obtain owner approval first.


## Exact-head CI checkpoint — 12 November 2026

The current PR branch head `671f6dcec0842106ba1b0a5a946bd69c01001abb` passed Main workflow [#43207317636](https://github.com/s85960833-byte/NovaAI/actions/runs/43207317636) and Browser workflow [#43207318043](https://github.com/s85960833-byte/NovaAI/actions/runs/43207318043), both on the exact same commit. PR #98 remains Draft and unmerged. The current head is not yet deployed to Staging; Production remains unchanged. CI success is not a live deployment or physical-device certification.
