# Exact-head release verification — 14 November 2026

**PR head:** `261cc04fdbc8b34cd0072c6e127c5bfaca6f2199` — Open / Draft / unmerged.  
**Main CI:** [#43572626246](https://github.com/s85960833-byte/NovaAI/actions/runs/43572626246) — success, 58/58 steps.  
**Browser CI:** [#43572626253](https://github.com/s85960833-byte/NovaAI/actions/runs/43572626253) — success, 17/17 steps.

## Universal Accuracy Instruction

- `npm run test:accuracy-instruction` is wired into Main CI and passed at step 10.
- Ten source-contract tests cover unconditional ACC injection, legacy acc:false migration, disabled/read-only controls, English/Hindi labels, independent extended-history preference, no telemetry addition, and standard/embedded/lightweight prompt branches.
- This proves source integration only; it does not establish factual accuracy of a live model answer.

## Staging smoke result

- **PASS:** `GET /health` HTTP 200 and ready payload.
- **PASS:** homepage and entry assets loaded.
- **PASS:** missing, malformed and invalid API credentials returned HTTP 401 before provider routing.
- **WARN / BLOCKED:** `GET /api/config` HTTP 503 because no AI chat provider is configured. No real AI response or search call was made.
- **SKIPPED:** live-provider and live free-image smoke steps.
- **DEPLOY GAP:** current PR head is not deployed to Staging. Latest confirmed Staging Live deploy remains SHA `7e816af473d29f9dd2e1d4cab775cb905f1a82fe`; current PR head is `261cc04fdbc8b34cd0072c6e127c5bfaca6f2199`.

## Browser verification result

All 17 Browser CI steps passed, including account UI/privacy/opt-in cloud sync, Company Cloud, mobile layout/drawer and graceful shutdown.

## Current service configuration

- Staging and Production Render services are on the Free plan and both report blank `healthCheckPath`.
- Production remains on `main`, Live SHA `c3cee61906b88ff111b3a645db55c9c2503cd8f7`, unchanged.
- Render documents Free services as preview/testing only, with 15-minute idle spin-down and roughly one-minute wake-up: https://render.com/docs/free.
- HTTP health checks require a configured path returning 2xx/3xx: https://render.com/docs/health-checks.

## Open release blockers

1. Render Staging must deploy the latest PR head; current head is not confirmed Live.
2. Set Staging Health Check Path to `/health`; Production health check is also blank.
3. An eligible adult operator must review provider/model terms and configure permitted provider credentials privately; then run real authenticated chat/search tests.
4. Valid/expired Supabase sessions, email/redirect flow, two-account isolation and full account deletion/retention remain unverified.
5. Durable customer quotas, hard monetary spend caps, plans/payments, backup/restore, load/soak, monitoring/SLO, incident/rollback and physical Android camera/microphone remain open.

**Release decision: NO-GO for Production.** Keep PR #98 Open / Draft / unmerged.
