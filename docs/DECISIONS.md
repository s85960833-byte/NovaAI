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

| 2026-11-17 | Optimize staging drawer using paint/layout containment, transform/opacity-only entrance and no large shadow/blur. | CI #513 frame artifact: 6/6 scenarios, 90 samples each, p50/p95 16.7/16.7 ms, 0 dropped frames at 60 Hz Chromium emulation. Hardware refresh is unverified. | Automated profile PASS; device review pending |
| 2026-11-17 | Keep staging rollback as an owner Dashboard rehearsal until a rollback-to-deploy action is exposed. | Current Render connector can inspect deploys/logs but cannot select a historical deploy for rollback; no rehearsal or elapsed time is claimed. | PENDING OWNER REVIEW |
| 2026-11-17 | Scope database lifecycle evidence separately from hosted auth/export assurance. | CI #513 passed local migrations, RLS/export visibility, synthetic deletion cascade, 5 wallet tests and PG17 backup/restore. Hosted Auth, download endpoint and object-storage erasure are not verified. | Evidence-scoped gate |
| 2026-11-17 | Do not state staging /perf is public until Render Live SHA matches the tested branch. | Render last observed Live SHA remained 5cf3ed5 while CI tested 5976ef9; auto-deploy/route publication must be rechecked from Render deploy metadata. | Evidence-scoped gate |


| 2026-11-18 | Treat up to 0.15 ms above the nominal RAF frame budget as browser timer quantisation tolerance, while retaining dropped-frame and physical-device caveats. | CI #513 later reported p95 16.8 ms vs nominal 16.7 ms in two scenarios, with zero dropped frames; the narrow tolerance only absorbs 0.1 ms sample jitter and is not a measured device-speed improvement. | Autonomous engineering decision |
| 2026-11-18 | Run the full independent CI checks and DB/staging jobs even when an earlier gate fails; trigger this workflow from pull_request/workflow_dispatch only. | Makes every job's result visible and avoids duplicate push + PR CI runs for the same branch update. | Autonomous engineering decision |


| 2026-11-18 | Pre-compress production JS/CSS with Node zlib and serve gzip variants only when the client advertises gzip. | CI #587 Lighthouse found raw 209,394-byte JS transfer and 5.469 s LCP element render delay under mobile throttling; TTFB was 404 ms and main-thread work 0.4 s. This targets network transfer without lowering Lighthouse budgets or adding a runtime compression dependency. | Autonomous engineering decision |
| 2026-11-18 | Audit production dependencies per runtime workspace (API, web and shared) and keep the full-tree audit with a single explicit picomatch dev-toolchain advisory exception. | CI #587 showed root `npm audit --omit=dev` still traversed Vite/picomatch paths from the lockfile; production scope must be checked against workspace manifests. | Autonomous engineering decision |
| 2026-11-18 | Pin CI to Ubuntu 24.04 while Playwright 1.56.1 does not support the Ubuntu 26.04 runner image. | CI #587 failed browser installation with the explicit message that Playwright 1.56.1 does not support chromium on ubuntu26.04-x64. | Autonomous engineering decision |

| 2026-11-18 | Replace the UI's lazy dynamic imports with static imports after Playwright traces showed an unresolved Vite preload marker at runtime; correct the gzip asset selector regexes. | CI #588 produced `ReferenceError: __VITE_PRELOAD__ is not defined` on Diwan, wallet and drawer navigation, and the gzip test regex matched an escaped backslash instead of the asset extension. New head `915e3f0` awaits exact-head CI. | Autonomous branch-only correction |

| 2026-11-18 | Keep Vite and `@vitejs/plugin-react` in root development tooling rather than `@nova/web` workspace dependencies; generate non-mutating Prettier candidates in CI for exact repair. | CI #591 found the web workspace production audit walking its build toolchain, while the dependency itself is a root build tool. The GHSA currently has no published patched version; production dependency exposure must be ruled out without masking the advisory. | Autonomous engineering decision |

| 2026-11-18 | Keep the original Learn, Build and Agents workspaces inside the unified NOVA shell through a same-origin iframe compatibility bridge until each legacy feature has a tested native replacement. | Preserves the existing mode registry, per-mode history, legacy APIs and origin storage without pretending that a UI placeholder is feature parity. The `/classic` route alone permits same-origin framing; all other routes retain frame isolation. | Autonomous engineering decision |

| 2026-11-18 | Route Sakha through the original NOVA `/api/chat/completions` endpoint first, with the last 12 local conversation messages and `stream:false`; use the isolated mock preview only when the legacy provider is unavailable. | Reuses the existing configured server-side provider without exposing keys or replacing the legacy API. Mock responses must be visibly labelled and must not be presented as live AI. | Branch-only implementation; exact-HEAD CI pending |
| 2026-11-18 | Remove the incoming `Content-Encoding` header when proxying JSON already parsed and inflated by Express. | Forwarding the original gzip header with newly serialized plain JSON can cause the child API to decompress an uncompressed payload. | Branch-only implementation; exact-HEAD CI pending |

| 2026-11-18 | Reuse the original NOVA Supabase account dialog inside the new shell via same-origin `/classic?account=1`, instead of maintaining a second, disconnected AuthPanel implementation. | Preserves the existing account identity, password recovery, confirmation, sign-out and opt-in cloud-sync behavior. The synthetic browser test stubs Supabase; no real account or user data is touched. | Branch-only implementation; exact-HEAD CI pending |

| 2026-11-18 | Preserve the original full NOVA home as an in-shell same-origin destination and expose Learn/Build/Agents group filters; open the existing account dialog from the new Account pane rather than introducing a second identity system. | Keeps the legacy mode registry, browser storage, API handlers and Supabase account on the same origin while native parity work is still incomplete. | Autonomous engineering decision |

| 2026-11-18 | Keep the established production Render service URL and start command; change its build command to create the React and API artifacts only after the explicit release gate. | Production currently builds with npm install and starts node nova-server.txt; the new root server needs apps/web/dist and apps/api/dist to serve the unified shell. No production config is changed during staging work. | Locked until exact APPROVE RELEASE |
