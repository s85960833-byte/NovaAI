# Nova AI — English Upgrade Progress

## Goal
Convert the complete Nova AI interface and all assistant modes to English, keep existing user data compatible, improve the install-to-home-screen experience, and verify the live app before reporting completion.

## Safety and compatibility
- Baseline snapshot branch: `backup-before-upgrade`.
- Work branch: `feature-english`.
- Target branch: `main`; production remains untouched until feature CI passes.
- Legacy chat/settings storage keys `nova` and `nova_t` are preserved. Existing chat records are not rewritten.
- New mode histories remain in additive key `nova_modes_v1`.
- Existing saved non-English voice locale values are migrated to `en-IN` only when the Voice Chat mode is opened; chat histories are not changed.
- No paid service or new external paid dependency is added. API credentials remain in Render environment variables.

## Changes implemented
- Entire main interface, settings, privacy copy, history/archive tools, image studio, live voice labels, error messages, and help text converted to English.
- Language selection is locked to English; assistant system prompts explicitly require English responses.
- All 12 mode names, descriptions, group headings, prompts, upload controls, scheme fields, GST instructions, and error states are English-only.
- Voice Chat offers English (India), English (US), and English (UK); existing stored regional voice preferences are safely normalized to English.
- Document drafts end with: `This is not legal advice.`
- Government scheme answers end with: `Please verify details on the official website.`
- PWA manifest now declares English, standalone display, and app metadata. Service-worker cache version changed so older cached Hindi assets are replaced.
- Added an always-visible **Install App** action: uses the native install prompt where supported and gives browser-specific Add to Home Screen guidance otherwise.
- Server developer identity and search language normalization now require English.
- Speech transcription now tries the primary provider and the optional free Groq provider, without exposing API keys.
- Pollinations' current image endpoint was returning HTTP 401/402. Added a free volunteer-community image fallback with NSFW generation disabled, output censoring enabled, and prompt safety checks. Its anonymous token is configured only in Render environment variables. Production smoke tests attempt a real generated image.

## Test checklist
- [x] Baseline backup branch exists and production was not changed during feature-branch work.
- [x] English-only mode registry: 12 unique modes and English group names/prompts.
- [x] English-only main interface; no Devanagari text remains in shipped HTML, registry, workspace, or backend.
- [x] Existing `nova` / `nova_t` storage contract preserved.
- [x] Separate per-mode histories and offline saved-chat access retained.
- [x] Voice locale selection and migration to English implemented.
- [x] PDF/text/photo upload code, size checks, and non-persistent upload handling retained.
- [x] Government scheme search uses official `.gov.in` / `.nic.in` source filtering.
- [x] GST arithmetic uses only a user-supplied tax rate; no rate is guessed.
- [x] Math and photo-solution prompts require step-by-step reasoning and a final check.
- [x] PWA install button, English manifest, service worker, and icons covered by local runtime smoke tests.
- [x] Free image fallback endpoints, anonymous Render-only token wiring, and safe-generation flags covered by registry/backend assertions.
- [x] Backend, frontend, registry, workspace, production smoke script, and runtime smoke script syntax checks passed on latest feature-branch CI run `41136536387`.
- [x] Local Express route smoke tests passed for homepage, mode assets, config, manifest, service worker, icons, and API validation.
- [x] Latest feature-branch CI run `41136536387` passed all syntax, 12-mode, and local runtime checks.
- [ ] Merge to main after review.
- [ ] Render deployment and production live smoke tests, including a real image-generation request.
- [ ] Confirm installed PWA behavior, real microphone/speaker interaction, and photo/PDF selection on a physical phone.

## Known constraints to verify before claiming complete
- The existing repository has local-device saved chats, but no real account login/authentication flow was found in the original code. Do not label local storage as account login.
- Groq/OpenRouter cross-provider fallback requires free API credentials to be configured in Render. The available Render connection does not expose existing secret values, and no credentials have been invented or committed. The anonymous image provider token will be set in Render env only.
- Browser microphone permissions, actual spoken audio, camera/gallery selection, and Add to Home Screen prompts need a supported physical device. Automated checks can verify code and live routes but cannot grant device permissions.
- Scanned PDFs without selectable text still require a clear page image; the current PDF text extractor does not perform OCR.
- The app uses browser-local storage; clearing browser site data removes locally saved chats. Back up important chats before clearing data.

## Current status
- Feature branch CI and local runtime smoke have passed on earlier revisions; final assertions are being re-run.
- Production has not yet been updated with this English revision. The real image-generation smoke test is intentionally gated to production after the Render-only image token is configured.
- Do not merge or deploy until the latest feature-branch CI is green.
