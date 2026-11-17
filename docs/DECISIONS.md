# NOVA 2.0 Decisions

| Date | Decision | Reason / alternatives | Owner approval |
|---|---|---|---|
| 2026-11-17 | Gate 0 passed; all 12 recommended defaults approved. | Owner's explicit approval in chat. | Yes |
| 2026-11-17 | Use a TypeScript modular monolith: Vite/React PWA, Node 22 API, PostgreSQL/Supabase, Drizzle, Zod, Vitest and Playwright. | Lower operational complexity than microservices; matches ADR-001. | Yes |
| 2026-11-17 | Launch scope is Darbar + Sakha + Diwan; other ministers are staged. | Keeps first release focused and preserves legacy access. | Yes |
| 2026-11-17 | Keep NOVA Business Intelligence separate. | Avoids mixing tenant data and release boundaries. | Yes |
| 2026-11-17 | Use free-only isolated staging and synthetic data. | Production remains read-only; no paid resource activation. | Yes |
| 2026-11-17 | Wallet/payment development uses a mock provider and test fixtures only. | No real payment account, real payment, KYC, settlement or money movement. | Yes |
| 2026-11-17 | Scheme data and final UI/icon/Hindi copy remain pending owner review. | Build safe structure and validation; no unreviewed content presented as official. | Pending owner review |
| 2026-11-17 | Do not modify repository settings, `main`, production Render or production Supabase. | Explicit instruction from owner. | Yes |
| 2026-11-17 | Phase 7 is prohibited until exact text `APPROVE RELEASE`. | Release safety rule. | Yes |

| 2026-11-17 | Use the new free Render Postgres database for hosted staging wallet integration; use local Supabase CLI in CI for RLS/Auth schema tests. | Supabase connector requires an explicit organisation selection before creating a hosted project; no organisation was guessed. Render test DB is separate and synthetic-only. | Autonomous safe default |
| 2026-11-17 | Keep hosted Supabase Auth disabled until a separate staging project is selected and configured. | No production project reuse; local Supabase stack remains the CI fallback. | Autonomous safe default |
| 2026-11-17 | Add server-side OpenAI, Gemini and Anthropic adapters, but keep staging provider mock-only and kill switch ON. | Keys remain optional server secrets; no provider calls or real documents during build. | Autonomous safe default |
| 2026-11-17 | Real-model evaluation is skipped unless a staging key and an explicitly free provider quota are available. | The no-paid-services rule overrides any evaluation convenience. Synthetic fixtures only. | Autonomous safe default |
| 2026-11-17 | Keep the official scheme dataset empty and expose deterministic filter inputs only. | Prevents invented benefits or eligibility while official records are pending review. | PENDING OWNER REVIEW |
| 2026-11-17 | Use a dedicated `nova2_staging` schema and synthetic-only identities for the hosted mock wallet. | Append-only ledger, database-enforced non-negative balance, webhook idempotency; no money movement. | Autonomous safe default |
| 2026-11-17 | Add a disconnected Razorpay test-webhook contract helper only. | Signature parsing and event mapping are fixture-tested; no Razorpay account, checkout or network integration. | Autonomous safe default |
| 2026-11-17 | Add account-export Edge Function source and retain account-deletion source, but do not deploy either to a hosted Supabase project. | Hosted Auth project is not yet configured; source code alone is not proof of deletion/export. | NOT VERIFIED |
| 2026-11-17 | Report native refresh-rate estimate and frame p50/p95/drop estimates; do not claim physical 120 FPS. | Browser instrumentation is a lab proxy; target Infinix and true 120 Hz hardware require physical testing. | NOT VERIFIED |
| 2026-11-17 | Keep marketing materials pre-release and prohibit unverified performance, legal, fraud-detection or official-partner claims. | Trust and safety require explicit caveats and owner review. | PENDING OWNER REVIEW |

| 2026-11-17 | Run the idempotent staging DB migration in the service start command, not Render pre-deploy. | Render Free does not support pre-deploy commands; the app must not require a paid plan. Migration uses CREATE/IF NOT EXISTS and is restricted to `nova2_staging`. | Autonomous safe default |

| 2026-11-17 | Make NOVA 2.0 CI least-privilege and deterministic: `contents: read`, locked `npm ci`, no CI-side lockfile mutation, no `npm audit fix`, and no bot push/format commit. | Avoids privileged PR workflow writes and prevents dependency drift; formatting is verified by `format:check`. | Autonomous engineering decision |

| 2026-11-17 | Fix isolated backup/restore with matching PostgreSQL 17 client inside disposable Docker and capture row counts. | Prior CI failed because runner pg_dump 16.15 could not dump Supabase Postgres 17.12. No hosted or production database is involved. | Autonomous engineering decision |
| 2026-11-17 | Add public /perf page reporting requestAnimationFrame cadence estimate, frame p50/p95, dropped frames and simple budget result. | Browsers do not expose a standard physical panel refresh API; the result is an observed browser estimate and explicitly not proof of 90/120 Hz hardware. | Autonomous engineering decision |
| 2026-11-17 | Remove the topbar backdrop blur and restrict intro/card motion to transform/opacity while profiling. | Reduce paint/compositing overhead on lower-end Android; retain physical-device measurements as owner review. | Autonomous engineering decision |
| 2026-11-17 | Run only 24 low-impact GET requests (health/static homepage) in staging after CI and database jobs. | No writes, synthetic account creation, uploads, payment or real user data; p95 target 3 seconds. | Autonomous engineering decision |
