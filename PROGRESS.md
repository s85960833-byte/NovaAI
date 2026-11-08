## Authoritative production re-audit — 8 November 2026

This status block supersedes older release checkpoints below. Historical entries are retained as audit history only.

- Integrated NOVA UI + Business Intelligence candidate PR #74 and live-smoke-check correction PR #75 are **merged**. Current production `main` is `e743034977ce38aa24a8a892d4ba87f020b3f52a` (docs reconciliation PR #77).
- Supabase project `qrfwsewppafhxibdboam` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1`. All 15 migration versions are present, including rate-limit search_path hardening, owner/admin-only audit reads and branding backfill.
- Deployed `nova-bi-api` is **ACTIVE v14**, with JWT verification enabled. Direct SQL confirms `nova_bi_consume_rate_limit` has an empty search_path; EXECUTE is denied to `anon` and `authenticated`, and allowed to `service_role`. All 10 NOVA BI tables have RLS enabled; audit SELECT is restricted to active owners/admins.
- Supabase Security and Health Advisors report zero findings. Performance Advisor reports 13 INFO-level unused-index notices; retain them until representative workload evidence supports any index removal.
- **Render has not deployed current `main`.** Service `srv-dbidhpc9v7es73d6ia80` tracks `main` with auto-deploy enabled, but latest live deploy remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. Main CI run [#42463160618](https://github.com/s85960833-byte/NovaAI/actions/runs/42463160618) failed at the live gate after 36 checks: manifest, homepage, health and icon returned HTTP 200, while `/nova-app.js` returned HTTP 404. Live provider and free-image smoke steps were skipped.
- Render remains on the Free plan in Singapore with no configured health-check path. No plan, region, environment-variable or health-check change is authorized by this status update.
- Still unverified: real signup/confirmation/reset and invitation email delivery, Auth Site URL/redirect allow-list and custom SMTP, two-real-account tenant isolation on live Auth, physical Android touch/accessibility/performance, backup/restore drill, privacy/retention/account deletion and incident response, full membership/invitation revocation, CSP tightening, and GitHub branch protection (`main.protected=false`, no rulesets).
- General NOVA chat/settings/history remain browser-local; account-backed chat sync and paid billing/entitlement enforcement are not established. BI CSV raw rows remain browser-local; workflows are proposals, not external action execution; risk scores are heuristics; exports are capped at 100 latest records.
- **Release decision: NO-GO for paid customer onboarding, confidential company data, SLA/availability promises or production-readiness claims.** Automated browser tests are not a physical Android test. Do not describe the new UI as live until a new Render deploy and all live smoke checks pass.
---

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


- 2026-11-01: Created isolated UI integration branch from current main; implementation and verification are pending.


## NOVA Indian Future UI integration (2026-11-01)
- Working branch: `feature-nova-next-ui-20261101`, based on production `main` commit `bd7ce67bd4a03eeb26861d0167f2b69e51c2bbc9`; production `main` and Render have not been changed.
- Reconnected the existing mode registry, mode workspace, Nova Build Studio and S-Tier home experience through ordered homepage script tags. The S-Tier home provides Chat & Study, Voice Chat, Create and Explore, plus the reactive Living Core and Indian-inspired visual system.
- Updated the server-served service-worker cache key from `nova-shell-v14-settings-modal` to `nova-shell-v15-indian-future-ui`; the cache pre-caches all four UI scripts.
- Added static, local-runtime and live-smoke assertions for the script wiring and enabled CI on this feature branch.
- Status at initial integration: CI and browser/Android interaction verification were pending. Do not merge or deploy until all four entry points plus legacy chat/settings/voice/image flows are checked.



## NOVA UI integration follow-up (2026-11-01)
- Kept all new S-Tier home and Modes workspace interface labels in English, including festival greetings; the legacy app's existing reply-language controls and chat behavior remain intact.
- Connected the Voice Chat home card to the dedicated Voice Chat mode group rather than relying on the optional Live Voice button being enabled.
- Connected Create to the dedicated Create mode group containing App & Website Builder; S-Tier Studio remains available from its own sidebar launcher.
- Expanded CI assertions for all four workspace entry points, English labels, the dynamic home mount point, and the App & Website Builder / Voice mode registry entries.
- GitHub Actions push and pull-request runs passed on commit `abd466aca2d6d65a81cd279db34105290c9ddf76`; the verification job passed syntax, registry, local server, route and PWA asset checks. Live Render smoke steps were skipped for this PR. Android/browser interaction testing remains outstanding.
- Production Render service is still configured to deploy from `main`; this feature branch has not been deployed or merged.


## Follow-up review (2026-11-01)
- PR #47 remains open as Draft, unmerged, and based on production `main` commit `bd7ce67bd4a03eeb26861d0167f2b69e51c2bbc9`.
- Both push and pull-request GitHub Actions runs passed on `abd466aca2d6d65a81cd279db34105290c9ddf76`; the PR run's local verification job passed, while live Render smoke steps were skipped.
- Updated the answer-feedback action label to `Report incorrect answer` to keep the new interface English-only.
- Full Android/browser interaction checks for workspace routing, legacy chat, Settings, microphone permissions and image flow remain unverified. Keep this PR in Draft and do not merge or deploy until those checks are completed.

- Follow-up: the Voice Chat home card now opens the existing full Live Voice flow (speech recognition plus spoken replies) when available, with the dedicated Voice mode group as fallback. Added a CI assertion so future changes cannot silently bypass the existing live voice path.


## Deep audit continuation (2026-11-06)
- Production main at audit start: `385e846c4c84a6291130842fea821bee603079e8`; Render service `srv-dbidhpc9v7es73d6ia80` deploy `dep-dbmmndrbc2fs73addrrg` was LIVE on that exact commit.
- Additional audit branches / PRs created:
  - PR #60: wire the existing arXiv + Science RSS fallback into the actual live science retrieval path when OpenAlex fails. Existing free/public sources only.
  - PR #61: make image queue polling promptly abortable and prevent a 429 rate-limit response from being bypassed by a direct-provider fallback.
  - PR #62: add a 60-case bilingual AI quality evaluation fixture, zero-network structure validator, and CI dependency audit.
- These PRs must remain unmerged until their CI checks are confirmed green. The connected GitHub status endpoint did not yet expose completed workflow runs during this audit.
- The 60-case fixture is not a live model score. Running model calls may consume configured API credits and is intentionally not performed without explicit cost approval.
- Real microphone/speaker, camera/gallery, Add to Home Screen, touch/keyboard/screen-reader, slow-network and actual-device visual checks still require physical device/browser interaction; connector-only access cannot verify them.
- Centralized feedback storage is not implemented. Current app storage is browser-local and there is no confirmed NOVA production authentication/database design. Do not reuse the separate NOVA BI Supabase project or start paid infrastructure without explicit approval and a reviewed privacy/retention design.
- NOVA Business Intelligence remains isolated in Draft PR #46 and is not part of the current production release. Its separate real-account, SMTP, tenant-isolation, retention/restore and security review gates remain open.
- No tracked implementation requirement for a Lunar/Festival Calendar was found in the current repository search; do not add a new feature under the guise of closing an audit defect.


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


- 2026-11-01: Created isolated UI integration branch from current main; implementation and verification are pending.


## NOVA Indian Future UI integration (2026-11-01)
- Working branch: `feature-nova-next-ui-20261101`, based on production `main` commit `bd7ce67bd4a03eeb26861d0167f2b69e51c2bbc9`; production `main` and Render have not been changed.
- Reconnected the existing mode registry, mode workspace, Nova Build Studio and S-Tier home experience through ordered homepage script tags. The S-Tier home provides Chat & Study, Voice Chat, Create and Explore, plus the reactive Living Core and Indian-inspired visual system.
- Updated the server-served service-worker cache key from `nova-shell-v14-settings-modal` to `nova-shell-v15-indian-future-ui`; the cache pre-caches all four UI scripts.
- Added static, local-runtime and live-smoke assertions for the script wiring and enabled CI on this feature branch.
- Status at initial integration: CI and browser/Android interaction verification were pending. Do not merge or deploy until all four entry points plus legacy chat/settings/voice/image flows are checked.



## NOVA UI integration follow-up (2026-11-01)
- Kept all new S-Tier home and Modes workspace interface labels in English, including festival greetings; the legacy app's existing reply-language controls and chat behavior remain intact.
- Connected the Voice Chat home card to the dedicated Voice Chat mode group rather than relying on the optional Live Voice button being enabled.
- Connected Create to the dedicated Create mode group containing App & Website Builder; S-Tier Studio remains available from its own sidebar launcher.
- Expanded CI assertions for all four workspace entry points, English labels, the dynamic home mount point, and the App & Website Builder / Voice mode registry entries.
- GitHub Actions push and pull-request runs passed on commit `abd466aca2d6d65a81cd279db34105290c9ddf76`; the verification job passed syntax, registry, local server, route and PWA asset checks. Live Render smoke steps were skipped for this PR. Android/browser interaction testing remains outstanding.
- Production Render service is still configured to deploy from `main`; this feature branch has not been deployed or merged.


## Follow-up review (2026-11-01)
- PR #47 remains open as Draft, unmerged, and based on production `main` commit `bd7ce67bd4a03eeb26861d0167f2b69e51c2bbc9`.
- Both push and pull-request GitHub Actions runs passed on `abd466aca2d6d65a81cd279db34105290c9ddf76`; the PR run's local verification job passed, while live Render smoke steps were skipped.
- Updated the answer-feedback action label to `Report incorrect answer` to keep the new interface English-only.
- Full Android/browser interaction checks for workspace routing, legacy chat, Settings, microphone permissions and image flow remain unverified. Keep this PR in Draft and do not merge or deploy until those checks are completed.

- Follow-up: the Voice Chat home card now opens the existing full Live Voice flow (speech recognition plus spoken replies) when available, with the dedicated Voice mode group as fallback. Added a CI assertion so future changes cannot silently bypass the existing live voice path.


## Deep audit continuation (2026-11-06)
- Production main at audit start: `385e846c4c84a6291130842fea821bee603079e8`; Render service `srv-dbidhpc9v7es73d6ia80` deploy `dep-dbmmndrbc2fs73addrrg` was LIVE on that exact commit.
- Additional audit branches / PRs created:
  - PR #60: wire the existing arXiv + Science RSS fallback into the actual live science retrieval path when OpenAlex fails. Existing free/public sources only.
  - PR #61: make image queue polling promptly abortable and prevent a 429 rate-limit response from being bypassed by a direct-provider fallback.
  - PR #62: add a 60-case bilingual AI quality evaluation fixture, zero-network structure validator, and CI dependency audit.
- These PRs must remain unmerged until their CI checks are confirmed green. The connected GitHub status endpoint did not yet expose completed workflow runs during this audit.
- The 60-case fixture is not a live model score. Running model calls may consume configured API credits and is intentionally not performed without explicit cost approval.
- Real microphone/speaker, camera/gallery, Add to Home Screen, touch/keyboard/screen-reader, slow-network and actual-device visual checks still require physical device/browser interaction; connector-only access cannot verify them.
- Centralized feedback storage is not implemented. Current app storage is browser-local and there is no confirmed NOVA production authentication/database design. Do not reuse the separate NOVA BI Supabase project or start paid infrastructure without explicit approval and a reviewed privacy/retention design.
- NOVA Business Intelligence remains isolated in Draft PR #46 and is not part of the current production release. Its separate real-account, SMTP, tenant-isolation, retention/restore and security review gates remain open.
- No tracked implementation requirement for a Lunar/Festival Calendar was found in the current repository search; do not add a new feature under the guise of closing an audit defect.


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
- Twelve NOVA BI migrations are deployed: nine tenant tables plus one server-only rate-limit table (10 tables total), all RLS-protected. Supabase Security Advisor reports zero findings.
- Edge Function `nova-bi-api` is ACTIVE at version 13 with JWT verification enabled. It provides authenticated organization, membership/invitation, dataset/analysis, workflow approval, branding, audit and deletion routes.
- Live transaction-scoped PostgreSQL checks passed for tenant isolation, owner bootstrap, viewer write/delete denial, analyst approval/branding denial, admin approval separation and owner-role escalation denial, invite activation, audited deletion and rate-limit threshold/window reset. Test rows/users were rolled back; follow-up counts were zero.
- Latest fully verified code checkpoint before this documentation update: `bea974e15e50f9bda4b657d1bd2a7564fba28ef0`; GitHub Actions run [41327443120](https://github.com/s85960833-byte/NovaAI/actions/runs/41327443120) passed 37/37 BI tests, fresh PostgreSQL 17 migration/RLS and rate-limit integration, Deno type-check, deployed Edge Function 401/CORS checks, local server/PWA checks and Playwright mobile Company Cloud flow.
- Raw CSV rows remain browser-local. Cloud saves metadata, aggregate outputs, assumptions and calculation evidence only.
- Product limitations remain explicit: heuristic project risk, assumption-based scenarios, team-level productivity, approval-gated workflow proposals without external execution, and workspace branding without custom domains/full brand removal.
- Remaining release gates: real signup/email confirmation and two-account browser testing; SMTP/invitation delivery verification; retention, backup/restore and full account deletion; IP-level abuse monitoring; manual Android/accessibility/performance checks; production regression/live smoke tests.
- Keep PR #46 Draft. Do not merge or deploy without explicit approval.


## Unified NOVA release candidate checkpoint (2026-11-07)

This checkpoint supersedes older progress entries above wherever they describe NOVA UI and NOVA Business Intelligence as separate release candidates.

- Authoritative unified candidate: Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74), branch `feature/nova-integrated-release-clean-20261108`.
- Verified candidate snapshot at this documentation checkpoint: `07454287053c538472f25832fcc475b9c67ed520`; Production `main` remains at `48e12a68af656b471853ac2a4509da0e3df7ab24`. The candidate is 139 commits ahead and 0 behind that base.
- GitHub Actions [run #1041](https://github.com/s85960833-byte/NovaAI/actions/runs/42329917724) and paired push [run #1040](https://github.com/s85960833-byte/NovaAI/actions/runs/42329912529) passed on the exact candidate snapshot: 55/55 steps completed, 52 succeeded, 3 live-environment checks skipped by design, 0 failures. Dependencies are installed reproducibly with `npm ci` from the committed lockfile.
- Verified in CI: frontend/backend syntax, mode registry, PostgreSQL 17 migration and tenant-RLS integration, Deno Edge Function type-check and auth/CORS smoke, BI calculations/CSV validation, 60-case fixture validation (not live AI accuracy), production dependency audit, local route/PWA checks, Company Cloud browser flows, Chromium workspace interactions and five responsive viewport/drawer tests.
- Browser screenshots are CI-emulated Chromium evidence only; they do not replace physical Android testing.
- Live Render/provider/image-generation checks were skipped; the candidate was not deployed. Real signup/email, two-account tenant isolation, physical Android behavior, live HTTPS headers, backup/restore, retention/privacy and incident-response gates remain open.
- No PR merge, Production deployment, live Supabase migration, Edge Function replacement, Auth configuration change or paid-resource change was performed. Keep the candidate Draft until the owner authorizes the relevant release steps.


## Current release status correction — 8 November 2026

- The authoritative candidate is Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74). Its current head and main-branch comparison are shown directly in GitHub; avoid copying a fixed ahead-count into long-lived documentation because every documentation commit changes it.
- Latest application-code verification is exact-head CI [run #42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) on `7f7d6bc475359c19975dbb8702205af5ad86cb30`; it passed 44 BI unit tests, 12 Deno tests and 6 Playwright browser tests, plus PostgreSQL 17 migration/RLS integration and the other candidate checks. Four live-only checks remain skipped.
- Re-audit found the Edge Function body parser accepted valid JSON scalars/arrays/null until route code accessed object properties, causing avoidable server errors. Added `request-input.ts`, made malformed/non-object JSON return HTTP 400, added four Deno regression tests and corrected the row-count type guard after CI type-check caught it.
- PR/README/pitch/security/progress records were reconciled with the latest code and live-state findings. Production `main` remains unchanged; no merge, deploy, live migration, or Auth/SMTP change was made.
- Live CORS, audit-read policy and rate-limit search_path remain at the previously inspected production state; candidate migrations and exact-origin CORS are not deployed.
- Physical Android testing, real SMTP/Auth and two-account tests, backup/restore, privacy/retention/deletion, hosting/health-check and CSP tightening remain release blockers. GitHub reports `main.protected: false` with no repository rulesets; an authorized repository administrator must enable branch protection and required checks before release. Paid sales and production promises remain NO-GO.


## Documentation-head verification — 8 November 2026

- At this checkpoint, the unified candidate head was `a8385e98463f28fcf0e13547ee5bb5db2f1fe0ec`; exact-head documentation-only CI [#42443325980](https://github.com/s85960833-byte/NovaAI/actions/runs/42443325980) completed successfully. Later documentation commits have advanced the branch; use PR #73 for the live head.
- Latest application-code verification remains exact-head CI [#42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) on `7f7d6bc475359c19975dbb8702205af5ad86cb30`. Intervening changes include documentation corrections and a PostgreSQL RLS integration-test update.
- The documentation-only workflow does not replace the application-code run or the four live checks skipped on the unmerged feature branch.
- PR #73 remains open, Draft, unmerged and undeployed. Production `main` remains unchanged.


## Latest test-only candidate CI — 8 November 2026

- Commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head GitHub Actions [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943). This adds an active-admin audit-read assertion to the isolated PostgreSQL RLS integration test; runtime application code and live Supabase were not changed.
- Four live checks remain skipped on this unmerged candidate. PR #73 remains Draft, unmerged and undeployed.


## Latest live candidate checkpoint — 8 November 2026

- Candidate branch and exact current head are displayed live in clean [Draft PR #74](https://github.com/s85960833-byte/NovaAI/pull/74); consult its Checks tab for exact-head CI. Do not treat a prior SHA's green run as verification of a newer commit.
- PR #73 remains Open, Draft, Unmerged and Undeployed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`.
- GitHub reports `main.protected: false`; repository rulesets are empty. An authorized repository administrator must enable protection and required checks.
- Live Supabase still has wildcard CORS; candidate migrations remain unapplied. Real Auth/SMTP, two-account isolation, physical Android, hosting/health, backup/restore, privacy/deletion and CSP gates remain open. Release remains NO-GO.


## Supabase migration-history reconciliation blocker — 8 November 2026

The live Supabase migration history is not timestamp-aligned with the repository's first eleven NOVA BI migration filenames. Supabase CLI compares migration timestamps, not names or SQL contents. Live history currently records these logical migrations at later timestamps, while the branch has earlier local filenames:

| Live recorded version | Live migration name | Candidate file timestamp |
|---|---|---|
| 20261101153420 | nova_bi_tenant_schema | 20261101000000 |
| 20261101153427 | nova_bi_workflow_execution_hardening | 20261101000001 |
| 20261101153432 | nova_bi_rls_policy_corrections | 20261101000002 |
| 20261101153602 | nova_bi_authenticated_workflows | 20261101000003 |
| 20261101153622 | nova_bi_membership_rls_recursion_fix | 20261101000004 |
| 20261101154237 | nova_bi_trigger_guarded_mutations | 20261101000006 |
| 20261101154631 | nova_bi_white_label_branding | 20261101000007 |
| 20261101154913 | nova_bi_team_invitations | 20261101000008 |
| 20261101155313 | nova_bi_data_lifecycle | 20261101000009 |
| 20261101163655 | nova_bi_api_rate_limits | 20261101000010 |
| 20261101163845 | nova_bi_rate_limit_deny_policy | 20261101000011 |

The 20261106130204_nova_bi_membership_accept_status_grant.sql filename exactly matches its live history version. The two later candidate migrations 20261106195900 (rate-limit search_path hardening) and 20261108120000 (owner/admin-only audit reads) are not present in live migration history and are genuinely pending changes.

**Do not run supabase db push against the live project yet.** With timestamp-only matching, the eleven earlier local filenames can be reported as missing even though the live history contains same-named logical migrations under different timestamps. Replaying them may conflict with existing objects or alter live policy/function state. A green fresh-PostgreSQL CI run does not prove remote migration-history alignment.

Safe reconciliation is deliberately not performed by this audit because the connector exposes the live version/name history and current schema, but not the original SQL payloads associated with the eleven live migration records. An authorized database administrator must first compare each local SQL file against the actual deployed migration/source and current live schema, then run supabase migration list --remote and supabase db push --dry-run --remote. Only after equivalence is proven should the administrator choose a reviewed timestamp-alignment strategy (renaming local files to the exact live versions, or repairing history for the exact local versions). supabase migration repair --status applied changes only migration history; it does not execute or validate SQL, so it must never be used as a substitute for that comparison. After alignment, dry-run again and confirm only the two intended hardening migrations are pending before applying either one with explicit owner approval.

References: https://supabase.com/docs/reference/cli/supabase-migration-repair and https://supabase.com/docs/guides/deployment/database-migrations.

**Status:** release-blocking migration-history reconciliation is documented but not executed. No live SQL, migration history, Edge Function, Auth configuration or hosting setting was changed.


## Current candidate re-audit — 8 November 2026

- Draft PR #74 is the sole integrated candidate; production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`.
- Last completed application-code run [#42452638922](https://github.com/s85960833-byte/NovaAI/actions/runs/42452638922) passed on `91bd7ca6f5234013b0369cc86c8810817b14d0ce`, including the confirmed-email guard for existing account invitations. The later migration-immutability changes and current documentation updates require exact-head CI.
- Historical migrations were restored; branding backfill is now a separate forward-only migration. Three forward migrations remain pending. The source mapping and safety steps are in `SUPABASE_MIGRATION_RECONCILIATION.md`.
- No live migration, Edge Function deployment, Auth/SMTP change, Render deployment or branch protection setting was changed. Live wildcard CORS, broad audit-read policy and rate-limit search_path remain unresolved.
- Candidate Chromium screenshots cover five viewport sizes but do not replace physical Android testing. Real Auth/SMTP, two-account isolation, backup/restore, privacy/deletion, hosting/health, CSP and branch-protection gates remain open.
- **NO-GO** for paid sales, customer onboarding, confidential data or production/SLA claims until all gates are verified and approved.


## Migration filename reconciliation — 8 November 2026

The 11 historical candidate migration filenames have been aligned to the exact version timestamps and logical names recorded by the live Supabase migration ledger; the twelfth already matched. Historical branding and rate-limit SQL files have been restored, with the branding backfill and rate-limit hardening separated into forward migrations. Three forward migrations remain pending. This is a repository-only change: no live migration repair, SQL, Edge Function deployment, Auth/SMTP setting, Render deployment or branch-protection change was performed. An authorized DBA must confirm `supabase migration list --remote` and `supabase db push --dry-run --remote` show only the three forward migrations before obtaining owner approval. Release remains NO-GO until all operational gates pass.


## Exact-head candidate CI — 8 November 2026

- Candidate head `d7b72cd113126aa2580c942bae1d7c404ad2e32a` passed exact-head CI [#42456085762](https://github.com/s85960833-byte/NovaAI/actions/runs/42456085762): 34 successful steps, 0 failures, 4 live-only checks skipped.
- Historical migration filenames now match the live ledger versions. Three forward-only migrations remain pending; remote dry-run and explicit owner approval are still required before production SQL.
- No live production, Supabase, Render, Auth/SMTP, billing or branch-protection setting was changed. Release remains NO-GO.
