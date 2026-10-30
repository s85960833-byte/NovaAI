# NovaAI Upgrade Progress

## Baseline (2026-10-31)
- Repository: `s85960833-byte/NovaAI`; baseline `main` commit: `7223889812961e36bc5837feabffd9974172269a`.
- Production: Render Free web service, Singapore; auto-deploy from `main`; start command `node nova-server.txt`; URL `https://novaai-4auo.onrender.com`.
- Existing source inventory:
  - `index.html`: single-page mobile-first UI; localStorage keys `nova` and `nova_t`; chat list/history, settings, language, theme, memory/preferences, export/import, image upload/camera, image generation, voice loop, speech recognition/synthesis, web/live search controls, accessibility/font controls.
  - `nova-server.txt`: Express server; per-IP API rate limiter; config endpoint; audio transcription; LLM chat proxy with model fallback, image/vision handling and prompt budget; web search aggregation/fallback; image generation; PWA manifest/icons/service-worker route; live research/weather/earthquake/events/science/finance/sports/news endpoints and provider self-test.
  - `package.json`: Express dependency and Render start script.
  - `scripts/check.mjs`: backend/frontend syntax and route/package consistency checks.
  - `scripts/smoke.mjs`: production config, PWA assets, feed, provider self-test, live search, image/transcription validation, and chat endpoint checks.
  - `.github/workflows/novaai-verification.yml`: CI syntax check and live smoke test on main.
  - `nova-server.js` and legacy HTML-named files are not the active Render entrypoint.
- Existing client storage keys and data shape are treated as immutable. New mode-specific state must be additive and migration-safe.
- Existing production deployment observed as live before upgrade; previous deploy `dep-dbig4emc6qcc73cb7k10`.

## Safety / backup
- Created branch `backup-before-upgrade` at the exact baseline commit.
- Created working branch `feature-upgrade` from the same baseline.
- GitHub connector exposes branch creation but no tag-creation operation; therefore the requested Git tag `backup-before-upgrade` could not be created through the available GitHub actions. The backup branch is the equivalent retained snapshot.
- No production code or Render service changed during baseline inspection.

## Plan
1. Add baseline inventory, compatibility constraints, and a test checklist (this file).
2. Implement an additive, config-driven mode registry and mode-isolated chat histories without changing `nova` / `nova_t` or existing stored chat records.
3. Add Hindi-first mode screens/prompts: general chat, voice, document explainer, scheme finder, shopkeeper, math/photo solution, NCERT, board, SSC, UPSC.
4. Add browser Speech API voice path and local/offline PWA support; preserve existing speech and chat flows.
5. Add document/photo parsing and safe draft generation; scheme lookup must prioritize official government domains and clearly state verification notice; GST calculations must be clearly labeled estimates and use user-provided tax rates.
6. Add free-tier safeguards: bounded rate limits, in-memory response cache, upload size/type limits, no permanent upload persistence, provider fallback.
7. Extend syntax/unit/smoke tests and CI to run on `feature-upgrade`; do not deploy feature branch to production.
8. Verify the feature branch on GitHub Actions. Only after all available tests pass, merge to `main`, wait for Render deploy, and repeat production smoke tests. Roll back to the known-good baseline if production health regresses.

## Test checklist
- [ ] Baseline production health/config and deployment state recorded.
- [ ] Baseline syntax and existing smoke tests executed and results recorded.
- [x] Additive mode registry and separate mode-history storage implemented; legacy keys `nova` and `nova_t` unchanged.
- [x] Browser Speech API, PDF.js-based text extraction, photo upload, scheme-source filtering, GST-safe prompt, local bounded cache and request cap added.
- [x] PWA service worker now caches the application shell; API calls remain network-only.
- [ ] Existing localStorage keys/data shape unchanged; old chats remain visible and editable.
- [ ] Existing login/saved chats, web search/live research, PDF/file upload, photo understanding, image generation, voice, memory, math, language/theme/accessibility tested.
- [ ] Each registered mode opens independently and retains its own history/system prompt (static checks pending).
- [ ] Mode settings page shows General and Study groups with Hindi descriptions.
- [ ] Math and photo-solution responses require steps and a final check.
- [ ] Browser speech recognition/synthesis fallback tested on supported browser; unsupported browsers get a clear fallback.
- [ ] Document explanation and RTI/complaint/application drafts include exact disclaimer: "ये कानूनी सलाह नहीं है।"
- [ ] Scheme finder asks only necessary eligibility inputs, cites official sources, and includes "पक्का करने के लिए आधिकारिक साइट देखें".
- [ ] Shopkeeper mode handles GST arithmetic/product details/WhatsApp copy without inventing statutory rates.
- [ ] PWA manifest, service worker, installability, offline shell and offline saved chats verified.
- [ ] API keys remain server-side; no paid service/provider added; uploads are memory-only and released after processing.
- [ ] CI and branch smoke tests pass.
- [ ] Render deploy succeeds; production endpoints and browser UI rechecked after deployment.
- [ ] If any old feature fails or production regresses, fix before proceeding or roll back.

## Status
- Completed: repository inventory, production configuration/deploy baseline, backup branch, feature branch, additive 12-mode registry/workspace, per-mode local histories, browser speech input/output, document/PDF/photo ingestion, official-domain-only scheme source filter, shopkeeper/math/study prompts, bounded local cache and mode request limit, PWA app-shell cache, feature-branch CI checks.
- In progress: CI execution, code review, production-safe regression verification.
- Known limitation: exact Git tag creation is not exposed by the connected GitHub operations; backup branch protects the baseline.
- Errors: none observed during repository/Render metadata reads. Full live browser interaction has not yet been exercised.
