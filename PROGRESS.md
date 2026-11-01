# NovaAI Upgrade Progress

## Goal
Upgrade the existing Nova AI app without breaking existing chats, settings, or features. Keep the app Hindi-first with a visible Hindi/English language selector. Every mode must have its own prompt and history. Use only free-tier services and do not add plans, payments, or paid dependencies.

## Baseline and architecture inventory
- Repository: `s85960833-byte/NovaAI`; production branch: `main`.
- Production URL: `https://novaai-4auo.onrender.com`.
- Render service ID recorded from the existing project: `srv-dbidhpc9v7es73d6ia80`; package start command: `node nova-server.txt`.
- Active app files:
  - `index.html`: mobile-first single-page assistant; localStorage chat/settings key `nova`; legacy probe key `nova_t`; chat history, language, theme, memory/preferences, export/import, photo/camera, image generation, voice, search/live data, accessibility and settings.
  - `nova-server.txt`: active Express backend; per-IP API rate limit; LLM proxy and provider fallback; speech transcription; web search aggregation; image generation jobs; PWA manifest/icons/service worker; live research, weather, earthquake, events, science, finance, sports/news and provider self-test routes.
  - `mode-registry.js`: config-driven mode list and per-mode system prompts.
  - `mode-workspace.js`: isolated per-mode chat histories, file/photo handling, voice controls, scheme lookup, GST helper, local cache, request limits and offline saved-history UI.
  - `scripts/check.mjs`, `scripts/modes-check.mjs`, `scripts/runtime-smoke.mjs`, `scripts/smoke.mjs`: syntax, registry, local route and production regression checks.
  - `.github/workflows/novaai-verification.yml`: CI runs on main and feature branches; production smoke runs on main.
- Legacy user storage contract is unchanged: `nova` and `nova_t`. New mode history/cache use additive keys `nova_modes_v1` and `nova_mode_cache_v1`.
- No database schema or existing user storage key has been renamed or removed.

## Backup and branch safety
- `backup-before-upgrade` branch preserves the original baseline commit `7223889812961e36bc5837feabffd9974172269a`.
- Previous in-progress work branch was preserved as `archive-feature-upgrade-pre-sync`.
- `feature-upgrade` was safely synced to the latest production `main` commit `950465845ee646542c1d15f9512163f559159712` before new edits; archived branch remains available.
- The connected GitHub actions expose branch creation but not Git tag creation. The requested Git tag `backup-before-upgrade` could not be created; the exact baseline backup branch is retained instead.
- Production code has not been changed by feature-branch edits. Merge only after CI is green.

## Changes completed on feature-upgrade
- Restored a visible Hindi + English app-language selector. New users default to Hindi; existing English preference is retained. The full app UI has the existing Hindi dictionary restored rather than forcing English.
- All 12 modes now have English and Hindi names, descriptions, and separate language-appropriate system prompts:
  - General Chat, Voice Chat, Document Explainer, Government Scheme Finder, Shopkeeper Assistant.
  - Math Mode, Solve from Photo, NCERT Mode, Board Exam Mode, SSC Exam Mode, UPSC Exam Mode, English Learning.
- General and Study groups, mode cards and descriptions are localized. Mode workspace refreshes when the app language changes.
- Voice mode defaults to the selected app language unless the user explicitly chooses a separate speech language; explicit voice preference is stored additively.
- Voice mode supports Hindi (India) and English (India/US/UK) recognition/speech language options.
- Document mode supports text/PDF/photo input; RTI/complaint/application drafts append the correct Hindi or English legal disclaimer.
- Scheme mode asks for age, state, work/status and annual income; filters search results to official `.gov.in` / `.nic.in` domains; shows official links and the Hindi/English verification notice.
- Shopkeeper mode includes GST arithmetic only when a user-provided rate is present; it never guesses the rate.
- Math and photo modes require step-by-step solutions and independent final-answer verification.
- Low Data / Lite Mode, bounded local response cache, rolling mode request limit, upload-size checks, PWA shell cache and offline saved-chat access remain enabled.
- Uploaded file/photo content is read in the browser and sent for the current request; no permanent server-side file storage was added.
- API keys remain server-side in environment variables. No paid dependency, payment, plan, or tier was added.
- Fixed image job polling: status requests no longer fail solely because a proxy/client IP rotates between image submission and polling. Job IDs are cryptographically random UUIDs.

## Baseline regression findings
- Production smoke run `41164358609` on the pre-upgrade main commit passed API config, PWA manifest/homepage, mode asset delivery, feed, live search, internet search and image input validation.
- That run failed on actual image-job polling with HTTP 404 `Image job not found`. Root cause was the image status endpoint binding a job to the caller IP; this is fixed on feature-upgrade and covered by local route tests.
- GDELT direct, Brave LLM Context (no BRAVE_KEY configured), and ESPN direct can fail upstream; configured fallbacks (GDELT fallback, general web search/Wikipedia, and TheSportsDB) passed in the same provider self-test. Do not report a direct provider as working when its fallback is the path that succeeded.

## Test checklist
- [x] Baseline repository and active Render entrypoint inventory recorded.
- [x] Baseline backup branch and archive of previous feature work retained.
- [x] Working branch synced to current main before edits.
- [x] Legacy `nova` / `nova_t` storage keys preserved; mode data is additive.
- [x] Bilingual Hindi/English selector and UI dictionary restored.
- [x] 12 modes have unique IDs, separate prompts, Hindi/English labels and separate histories.
- [x] Voice mode supports Hindi and English speech locales.
- [x] PDF/text/photo parsing, official scheme source filtering, legal disclaimer and GST-rate safeguards covered by assertions.
- [x] Low-data limits, request cap, local cache, offline mode and PWA shell covered by assertions.
- [x] Backend, frontend, registry, workspace, smoke scripts and runtime scripts pass syntax checks.
- [x] Bilingual mode registry and legacy-storage assertions pass.
- [x] Local Express route/PWA smoke tests pass on latest feature branch.
- [x] Latest feature-branch GitHub Actions run `41165167613` passed all available local checks.
- [x] S-Tier Studio changes are present on production `main` at `a77a72a265c375a2f21dc3ba6bef2f10f658d0c8`.
- [x] Render deployment `dep-dbiqfkflk1mc73ff4lb0` is live on that exact commit.
- [x] Main CI run `41183882833` passed syntax, registry, local runtime, PWA, live homepage, Studio bundle, API, internet search, live retrieval, image generation and chat smoke checks.
- [ ] Recheck old saved chats/settings on the actual device; confirm language toggle and separate histories.
- [ ] Verify real microphone/speaker, camera/gallery and PWA installation on a physical Android browser.

## Known limitations / honest verification notes
- Original source does not contain a real account login/authentication flow. It has device-local saved chats and settings. Do not claim account login is implemented unless an existing authenticated flow is found and tested.
- Optional Groq/OpenRouter fallback only works when valid free-tier credentials are configured in Render environment variables. Existing secret values are not readable through the GitHub connection and have not been invented or committed.
- The anonymous/free image provider may queue or rate-limit requests. The live production image test must complete successfully before claiming image generation is verified.
- Browser microphone permissions and real spoken audio, camera/gallery selection, and Add to Home Screen behavior require physical-device testing.
- Scanned PDFs without selectable text still require a clear page image; OCR is not implemented.
- Browser-local saved chats are lost if the user clears site data; this upgrade does not alter their storage format.

## Current status
- Feature branch: `feature-upgrade`.
- PR #4 was merged into `main` as commit `b4fb66bd77255cb62482080a553c5ad601b8f8ac`.
- Follow-up mode-card/speech-language polish is on `feature-upgrade` commit `ea665bf261390dc821672d7e3ed06c71c2af2871`; its local CI passed (`41165295304`).
- The earlier production smoke run `41165241614` failed while Render still served an older revision. This was resolved by deploying the current main commit and re-running the full production smoke successfully.


## S-Tier Studio implementation (feature-s-tier-studio)
- Added a mobile-responsive S-Tier Studio with ten navigable tools: Project Brain, Reality Check, AI Council, Digital Hands, Time Machine, Model Arena, Watchtower, Knowledge Vault, Trust Shield and Idea-to-Business.
- Project Brain, Knowledge Vault and Time Machine store data locally in browser storage. This is device-local, not cloud-synced or source-control versioning.
- Reality Check reviews user-supplied claims/evidence with the configured model; it is advisory and does not independently browse or prove claims.
- AI Council uses Researcher/Builder/Critic prompts sequentially through the configured model; not independent model providers.
- Model Arena compares prompt strategies using the same configured provider/model; it is not a multi-provider benchmark.
- Digital Hands prepares checklists and offers an explicit HTTPS website hand-off; it does not automate browser clicks, credentials, payments or form submissions.
- Watchtower runs on-demand `/health`, `/api/config`, and feed checks; it is not an always-on background monitor.
- Trust Shield controls AI requests, external links and local text imports within this studio only; it is not app-wide authentication or server security.
- Idea-to-Business generates a structured blueprint and can save it into Project Brain.
- The `nova-suite.js` asset is served by the backend, loaded by the homepage and included in the PWA shell cache. Existing local-storage keys remain unchanged.
- Cross-device sync, full browser automation, continuous monitoring, independent multi-provider council/benchmark and source-code Git rollback are not implemented and must not be claimed.
- Verified on 2026-10-31: GitHub Actions run `41183882833` passed; Render deploy `dep-dbiqfkflk1mc73ff4lb0` is live on commit `a77a72a265c375a2f21dc3ba6bef2f10f658d0c8`.
- Production checks passed: English/Hindi homepage and PWA assets, all ten Studio feature labels and bundle delivery, `/health`, `/api/config`, news feed, live retrieval, internet search, image generation result, transcription input validation, and AI chat.
- Provider checks passed with documented fallbacks where upstream providers rate-limited or timed out. OpenAlex direct returned HTTP 429, but its configured fallback passed; GDELT, Open-Meteo, Brave and ESPN direct paths also used working alternatives in this run.
- `npm install` reported zero vulnerabilities. Node emitted a `punycode` deprecation warning; it did not fail the build or tests.
- Remaining verification needs a real Android browser/device for microphone/speaker permissions, camera/gallery interaction, language switching against pre-existing device-local chats, and Add to Home Screen. Do not claim those physical-device interactions were tested from CI.


## AI Council evidence-quality upgrade (2026-10-31)
- Replaced the previous assumption-only Council flow with a five-stage evidence-led workflow: three parallel live-search queries, Researcher review, Builder plan, Critic challenge, and final evidence audit.
- The Council now labels search results as excerpts rather than claiming that original pages were opened or independently verified; only supplied source IDs can be cited, and missing evidence must be labelled NOT VERIFIED.
- Business answers are explicitly prevented from inventing customer demand, willingness to pay, competitor pricing, market size, API costs, conversion rates or profits. Costs and unit economics must be source-backed or labelled as estimates with formulas.
- Search results are deduplicated, restricted to HTTPS URLs before display, shown with publisher/date metadata, and rendered as safe external links. Failed search or failed model stages stop the audit rather than presenting a fabricated completed answer.
- The UI explicitly states that Researcher, Builder and Critic are sequential prompts on the same configured model, not independent providers. It also states that no AI can guarantee perfect correctness.
- Increased the Council request timeout to 90 seconds and bounded its output token budget. Added static regression checks, local runtime asset checks, and a production smoke assertion for the Council safeguards.
- Verification branch: `feature-ai-council-evidence`. Do not merge or deploy until the branch workflow is green. The next production workflow must verify the deployed Council asset and live search integration.
- Important limitation: the existing `/api/search` endpoint returns search-result excerpts, not full-page authenticated source review. The Council now discloses this limitation; high-impact decisions still require opening primary sources. Perfect correctness cannot be guaranteed by an LLM.


## Corrected four-section NOVA home (2026-10-31)
- Keep the current S-Tier / Nova Bloom royal motion-graphics front page as the public home; do not restore the legacy chat-first home.
- Replace the incorrect Study / Build / Chat / Voice card grouping with exactly four user-facing sections: Chat & Study, Voice Chat, Create, Explore.
- Chat & Study contains General Chat plus Math, Photo, NCERT, Board, SSC, UPSC and English learning modes.
- Voice Chat retains the existing live voice entry point.
- Create opens the existing Nova Build Studio (including Image Studio, App & Website Builder and the ten Studio tools); the Builder mode is also available in its scoped mode group.
- Explore contains Document Explainer, Government Scheme Finder and Shopkeeper Assistant modes.
- Existing API routes, legacy chat storage, settings and Studio functionality remain additive and unchanged.
- Bump the PWA shell cache version so Android installations fetch the corrected home and workspace registry instead of stale cached assets.

- Verification follow-up: corrected the S-Tier script's escaped newline syntax and aligned the runtime PWA cache assertion with `nova-shell-v10-four-sections`.


## NOVA Business Intelligence implementation (2026-11-01)
- Work is isolated on `feature/nova-business-intelligence`; production `main` and Render have not been changed by this initiative.
- Added `NOVA_BUSINESS_INTELLIGENCE_PLAN.md` with the target segment, scope, data/privacy rules, security gate and delivery checklist.
- Added `nova-business-core.js`: bounded CSV parsing (5 MB / 20,000 rows), expense/category/month summaries, optional budget-overrun and month-spend review signals, client contribution calculations, team-level task metrics, explainable project-risk heuristics, what-if scenario calculations and evidence-based proof objects.
- Added `nova-business.js`: separate mobile-responsive Business Intelligence workspace, browser-local CSV import/mapping, analysis views, risk/scenario/workflow planner and downloadable JSON analysis/proof reports.
- Business CSV data is currently processed in browser memory only; the new workspace does not upload raw rows or persist them to local storage.
- Added server asset routes and PWA shell caching for the new scripts; the existing chat storage key and current home UI remain unchanged.
- Added Node tests for CSV parsing/bounds, calculations, invalid values, risk, scenario, proof and local-only data handling.
- Fixed a stale existing UI-layout assertion in `scripts/check.mjs` that caused CI to fail even though the restored standard UI was present.
- Verified on branch commit `df672619240e43321ecdd3275c46562c67a7c1e4`: GitHub Actions run `41311201591` passed syntax, mode registry, Business Intelligence tests, local Express routes and PWA asset checks.
- Not deployed. Physical browser/Android UI testing is still pending.
- Not enterprise-ready yet: no account authentication, tenant isolation, durable company database, role-based access, shared audit log, integrations or real external workflow execution exists. Do not accept sensitive company uploads or claim multi-user/enterprise readiness until those controls are implemented and verified.
- Current workflow planner produces an approval-gated checklist only; it does not execute external actions. Project risk is heuristic, and savings are user-assumption-based scenarios, not predictions or guarantees.


## Business Intelligence dashboard and traceability follow-up (2026-11-01)
- Added dashboard data-quality summary: accepted source rows, calculation coverage, invalid field records and parser warnings.
- Added readable project-risk contributing factors.
- Expense, client and team analysis now link summary findings to original CSV source row numbers; malformed lines do not shift the references.
- Tightened strict ISO date validation, task completion denominator handling and numeric overflow behavior.
- Added tests for these behaviors and for dashboard status announcements.
- Latest verified branch commit at this checkpoint: `42024f274869c33235318edf3aa5297d97a18934`.
- GitHub Actions run `41312149246` passed syntax checks, mode-registry checks, Business Intelligence unit tests, local Express route checks and PWA asset smoke tests.
- Subsequent plan-document-only update recorded the work; no production deployment or merge occurred.
- Still blocked from enterprise use: no authentication, tenant isolation, durable business database, role permissions, audit log, real integrations or external workflow execution.


## Accessibility and security design checkpoint (2026-11-01)
- Added keyboard focus trapping, Escape-to-close, focus restoration, visible keyboard focus styles and active navigation semantics to the Business Intelligence dialog.
- Added `NOVA_BUSINESS_INTELLIGENCE_SECURITY.md` with threat model, tenant isolation/authentication requirements, role permissions, audit trail, AI data-consent rules and release-blocking security tests.
- Updated the implementation plan to state clearly that this security document is a design checklist, not a completed security implementation.
- GitHub Actions run `41312254421` passed syntax, existing mode checks, Business Intelligence tests, local API route tests and PWA asset smoke tests.
- No authentication/database provider has been selected or connected; no shared company data storage exists.
- Still not deployed or merged; browser/Android manual tests and all shared-data security controls remain outstanding.


## NOVA Business Intelligence — superseding implementation checkpoint (2026-11-01)
This section supersedes the earlier BI entries above where they state that authentication, tenant isolation or shared company storage do not exist.

- BI implementation remains isolated on `feature/nova-business-intelligence`, Draft PR #46. Production `main` and Render remain untouched.
- The user approved Supabase project `qrfwsewppafhxibdboam`; the separate Research-to-Code project remains untouched.
- Eleven NOVA BI migrations are deployed: nine tenant tables plus one server-only rate-limit table (10 tables total), all RLS-protected. Supabase Security Advisor reports zero findings.
- Edge Function `nova-bi-api` is ACTIVE at version 13 with JWT verification enabled. It provides authenticated organization, membership/invitation, dataset/analysis, workflow approval, branding, audit and deletion routes.
- Live transaction-scoped PostgreSQL checks passed for tenant isolation, owner bootstrap, viewer write/delete denial, analyst approval/branding denial, admin approval separation and owner-role escalation denial, invite activation, audited deletion and rate-limit threshold/window reset. Test rows/users were rolled back; follow-up counts were zero.
- Latest fully verified code checkpoint before this documentation update: `bea974e15e50f9bda4b657d1bd2a7564fba28ef0`; GitHub Actions run [41327443120](https://github.com/s85960833-byte/NovaAI/actions/runs/41327443120) passed 37/37 BI tests, fresh PostgreSQL 17 migration/RLS and rate-limit integration, Deno type-check, deployed Edge Function 401/CORS checks, local server/PWA checks and Playwright mobile Company Cloud flow.
- Raw CSV rows remain browser-local. Cloud saves metadata, aggregate outputs, assumptions and calculation evidence only.
- Product limitations remain explicit: heuristic project risk, assumption-based scenarios, team-level productivity, approval-gated workflow proposals without external execution, and workspace branding without custom domains/full brand removal.
- Remaining release gates: real signup/email confirmation and two-account browser testing; SMTP/invitation delivery verification; retention, backup/restore and full account deletion; IP-level abuse monitoring; manual Android/accessibility/performance checks; production regression/live smoke tests.
- Keep PR #46 Draft. Do not merge or deploy without explicit approval.
