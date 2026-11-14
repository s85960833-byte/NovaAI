# NOVA AI

NOVA is an India-oriented Hindi-English AI web workspace organized into three areas:

- **NOVA Learn** — learning and study workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — assistant and agent workflows.

Production preview: https://novaai-4auo.onrender.com

## Release status — 13 November 2026

**PR #98 is Open / Draft / unmerged. Production remains unchanged and NO-GO.**

- Current PR head: `624c58ab05ed809182be3b075404dace7761cdc7`. Main CI [#43373351355](https://github.com/s85960833-byte/NovaAI/actions/runs/43373351355) and Browser CI [#43373351271](https://github.com/s85960833-byte/NovaAI/actions/runs/43373351271) both succeeded.
- Main CI external Staging tests passed `/health`, homepage and JS assets. Auth negative tests passed with HTTP 401 for missing, malformed and invalid sessions. This does not prove valid/expired tokens, email delivery, redirect settings or two-account isolation.
- Render Staging deploy `dep-dbra3et9fdbs73dosl7g` is Live; runtime logs confirm API Auth is REQUIRED. Health Check Path remains blank.
- Staging `GET /api/config` returns HTTP 503 because no AI provider key/model is configured. No paid provider calls were made; no provider key was added.
- Current Free Render service is a test/preview environment only, not production-grade. See [Render Free limits](https://render.com/docs/free).
- API/provider rights and limitations: [API and Provider Rights Audit](API_AUDIT_2026-11-13.md), [Feature / Engineering Guide](FEATURES.md), [Feature Registry](FEATURE_REGISTRY.json), [Phase 1 Audit](PHASE1_AUDIT.md).
- No paid API/service spend, Production merge/deploy, or Supabase schema mutation. Production remains on last known live SHA `c3cee61906b88ff111b3a645db55c9c2503cd8f7`.

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
- [API and Provider Rights Audit — 13 Nov 2026](API_AUDIT_2026-11-13.md)
- [NOVA Feature and Engineering Guide](FEATURES.md)
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
- Server-side AI chat requires a configured provider key in Render Environment. OpenRouter's free-model router may select an available free model, but availability and rate limits can change. See [OpenRouter free models](https://openrouter.ai/collections/free-models) and [free-model limits](https://openrouter.ai/pricing). **Age/contract gate:** OpenRouter's current Terms require the account user to be 18+; GroqCloud and Tavily customer-application guidance also have adult-operator requirements. A minor must not create/use these accounts or share another person's credentials. An eligible adult must review provider and model terms, including whether student/under-18 end users are allowed, before configuring a key. Do not buy credits for this setup.
- If using Groq, set `GROQ_MODEL` explicitly to a currently supported model and check its current billing terms; the server deliberately has no implicit Groq model default. Do not assume all provider models are free.
- Provider secrets belong in Render Environment, never browser JavaScript or GitHub. Optional provider integrations are documented in `.env.example`. Paid image generation remains disabled unless separately approved; `ALLOW_PAID_IMAGE=false`.
- AI retry policy is configurable through `LLM_MAX_ATTEMPTS` (1–5; default 3), `LLM_RETRY_BASE_DELAY_MS` (0–5,000 ms; default 250) and `LLM_RETRY_MAX_DELAY_MS` (capped at 10,000 ms; default 2,000). Only correctable responses are retried with exponential jitter; rate limits and provider failures normally switch to the next independent company instead of waiting on the same service. Never create multiple accounts or rotate keys at one provider to bypass quotas.
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

The latest PR branch head `c3ddc3e32423a219c2c456cd92c1cba42b87ed88` passed Main workflow [#43238989690](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989690) (45/45 steps) and Browser workflow [#43238989457](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989457) (16/16 steps), both on this exact SHA. PR #98 remains Draft/unmerged. Staging still runs old commit `195739a04895de364a5af22aa61f930d5d782cbb`; Production remains unchanged on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. Main skips live/Production release checks while the PR is unmerged. CI is not proof of deployment or physical-device behavior.


## Additional architecture and diligence documents

- [System architecture](ARCHITECTURE.md)
- [Current API surface and gaps](API_REFERENCE.md)
- [Running-cost/provider inventory](RUNNING_COSTS.md)
- [12-month evidence-gated roadmap](ROADMAP_12_MONTHS.md)
- [Weighted buyer-readiness scorecard](BUYER_READINESS_SCORECARD.md)
- [Technical Data Room index](data-room/README.md)
- [Buyer pitch deck outline](NOVA_PITCH_DECK.md)

These documents describe candidate source and available evidence; they do not prove deployment, ownership, legal compliance, provider rights or buyer demand. Release remains NO-GO while live Staging and external verification gates remain open.

- [Preliminary cost-to-replicate report](COST_TO_REPLICATE.md)
- [India market and differentiation research](MARKET_AND_DIFFERENTIATION_RESEARCH.md)


## NOVA BI synthetic demo data

- [Synthetic CSV demo guide](samples/README.md)
- [Expenses demo CSV](samples/demo-expenses.csv)
- [Client profitability demo CSV](samples/demo-clients.csv)
- [Team tasks demo CSV](samples/demo-team-tasks.csv)

All sample rows are fictional, labelled demo data and validated against the same analysis functions used by NOVA BI. They are not customer outcomes, testimonials or benchmarks.


## Database backup and restore

- [Supabase backup/restore runbook](BACKUP_AND_RESTORE.md) documents owner-controlled CLI export and isolated restore steps. No real backup or restore drill has been run; a SQL dump alone does not include Supabase Auth users or Storage objects.


## Buyer evaluation and internal review materials

- [Why evaluate NOVA?](WHY_EVALUATE_NOVA.md) — evidence-limited asset overview; not an offer or valuation.
- [Buyer and technical FAQ](BUYER_FAQ.md) — answers current capability and limitation questions.
- [Selected improvement register](IMPROVEMENT_REGISTER.md) — chosen workstreams, internal value/effort/risk scores and evidence status.


## Account deletion and data lifecycle

- [Account deletion/data-lifecycle review](ACCOUNT_DELETION_REVIEW.md) records the live foreign-key evidence: six BI/Auth references use RESTRICT, audit-event actor references SET NULL and workspace backup rows CASCADE.
- The current **Delete cloud backup** button removes only the cloud chat snapshot; it does not delete the Auth account or all tenant data.
- Full account deletion and retention are not implemented. Do not onboard real customer/confidential data or claim complete deletion.


## NOVA BI portable Action Proof

The current PR candidate adds a SHA-256 source-file digest and a portable JSON proof bundle containing the digest, column mapping, row counts, calculation version, software-check results and calculated analysis. The source CSV bytes are not embedded. The analysis may include user-provided labels/values and source-row references; inspect it before sharing. A SHA-256 digest is not a signature or a guarantee of browser integrity. The new unit and browser verification are pending on the latest candidate.


## Synthetic NOVA BI demo data

- [Demo data guide](samples/README.md)
- [Expenses CSV](samples/demo-expenses.csv)
- [Client profitability CSV](samples/demo-clients.csv)
- [Team tasks CSV](samples/demo-team-tasks.csv)

The examples are fictional and tested against NOVA BI calculation functions. They are not real customers, outcomes, testimonials, savings or traction.


## Latest candidate verification — 12 November 2026

Candidate `76e89066d04f00e991b7a49b59cb93c4839a6ab7` passes Main #43251147719 and Browser #43251147695 on the exact same SHA; duplicate exact-head runs also succeeded. Main skips four live/release checks. Staging still runs an older commit and Production was not redeployed. See [NOVA_STATUS.md](NOVA_STATUS.md).

The NOVA BI preview now auto-maps currency-suffixed headers such as `Amount (INR)`. The SHA-256 Action Proof browser test and synthetic demo calculation tests passed on that candidate.

## Code and research model-quality gate

For safety and answer quality, Nova's server and browser allow Code and Deep Research only when an exact provider/model ID has committed T1/T2 evaluation evidence: at least 100 cases on `golden-100-v1`, score >=90/100, and a linked report plus commit SHA. The current evidence registry is empty, so these two routes return a bilingual “quality not verified yet” message rather than silently using an unbenchmarked model. BYOK and embedded-preview modes cannot bypass this gate. General chat is not affected.

The evaluation runner and actual model benchmarks are still pending; an empty registry is intentional, not a claim that providers were tested.
