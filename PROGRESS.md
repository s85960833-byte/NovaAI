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
- [ ] Create/review PR and merge feature-upgrade into main only after final CI review.
- [ ] Wait for Render auto-deploy from main; confirm the deployed commit/build.
- [ ] Run production smoke on the live URL: chat, web search, live data, image job submit/poll/result, transcription validation, PWA assets and all mode assets.
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
- Main-branch production smoke run `41165241614` failed because the public Render manifest still returned the previous `lang: en` metadata instead of the newly committed `lang: hi`. This indicates the updated app has not yet been confirmed live; check Render deployment state before any completion claim.
- Not complete until Render serves the merged bilingual revision and the full live smoke passes.
