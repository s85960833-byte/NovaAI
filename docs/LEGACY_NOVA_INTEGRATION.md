# NOVA — Single-URL Legacy App Integration

**Owner direction:** 18 November 2026  
**Target:** Upgrade the original NOVA product in place. The established NOVA URL remains the only public user-facing destination; no second NOVA hostname is to be introduced.

## Current branch architecture

On `nova-2.0/rebuild`, the original Node server (`nova-server.txt`) remains the public entrypoint:

- The React/Vite NOVA 2.0 shell is served at `/` from `apps/web/dist`.
- The original NOVA application remains available at same-origin `/classic`; its existing JavaScript, PWA assets, browser storage, cookies and legacy API handlers are retained.
- The new API runs as a localhost child process. Only `/api/health`, `/api/auth`, `/api/files`, `/api/sakha`, `/api/diwan` and `/api/wallet` are proxied to it. Existing endpoints such as chat completions, web search, image generation, transcription, live data and feeds remain on the original server.
- Learn, Build and Agents shortcuts open the corresponding existing legacy workspace inside the same-origin shell. They reuse the existing mode registry and per-mode history; they are not placeholder-only cards.
- The `/classic` route alone permits same-origin framing. Other routes keep their restrictive framing policy.
- The new shell's Account panel embeds `/classic?account=1`, which opens the original NOVA account dialog. It reuses the existing Supabase client and existing sign-in, sign-up, password-recovery, confirmation, sign-out and opt-in cloud-sync flows; sync remains off by default.
- The staging blueprint builds the web bundle and starts the original server through the `@nova/api` workspace start command.

This is a **compatibility bridge**, not a completed native React rewrite of every legacy feature. The legacy application remains available while native replacements are implemented and tested.

## Integration work completed in source

- [x] Existing root server retained as the public application entrypoint on the feature branch.
- [x] New shell served at `/`; original application preserved at same-origin `/classic`.
- [x] Learn, Build and Agents routed to the original in-app workspace groups.
- [x] New API process isolated on localhost and selectively proxied.
- [x] Same-origin framing exception scoped to `/classic`.
- [x] Existing NOVA Supabase account flow surfaced inside the new shell; no separate account store or second auth project introduced.
- [x] Sakha now attempts the original live `/api/chat/completions` provider first, sends recent conversation context, and falls back to the clearly labelled mock preview when the legacy provider is unavailable.
- [x] Proxy removes stale `Content-Encoding` when forwarding JSON that Express has already decompressed.
- [x] Playwright coverage added for live Sakha conversation context and explicit mock fallback. These latest added tests still require exact-HEAD CI execution.

## Feature parity still required

The following are not considered complete merely because the legacy workspace is embedded:

| Area | Current state | Required proof |
|---|---|---|
| Chat / Sakha | Live legacy-provider adapter added; mock fallback labelled | Exact-HEAD tests with live and provider-down paths |
| Saved chats / history | Original app remains available on same origin | Verify create, reopen, rename/delete, refresh and storage compatibility |
| Voice / Live Voice | Original feature remains available in Agents/legacy workspace | Browser permissions, STT/TTS, live-session and interruption tests |
| Web search / citations | Original handlers retained | Search results, source links, citation accuracy and failure-state tests |
| Files / documents | Original handlers retained; new file API is isolated | Upload, size/type limits, download, cleanup and synthetic privacy tests |
| Image generation | Original image API retained | Provider success, timeout, poll, error and image rendering tests |
| Login / sessions | Original login remains available; new Auth panel exists | Hosted Auth configuration, session refresh, logout and account recovery |
| Account export / deletion | Source and isolated SQL tests exist | Hosted export/download and full object-storage erasure remain unverified |
| Nova Learn / Build / Agents | Same-origin workspace shortcuts work in source | Test every existing mode and history path; native migration is separate |
| Diwan / wallet / new API | New shell modules and mock/synthetic API exist | Validate each flow, security controls, accessibility and non-mock integrations |
| Mobile / accessibility | Chromium viewport tests exist | Physical Android/Infinix, screen reader and touch/keyboard review |

## Required next actions before staging release

1. Run all CI jobs on the exact current PR head, including the newly added Sakha tests.
2. Resolve every formatting, type, lint, unit, Playwright, security, database, bundle and Lighthouse failure; do not treat a previous SHA's green run as current evidence.
3. Verify that staging's deployed SHA exactly equals the approved feature-branch SHA and that `/api/health`, the new shell and `/classic` all work on that deployment.
4. Exercise every legacy capability listed above against synthetic test fixtures; preserve all original browser storage keys and server API contracts.
5. Verify the existing account project's session refresh, confirmation/recovery email delivery and sign-out using an owner-controlled synthetic test account. Do not create test users in a shared account project or inspect real user rows. Verify export/deletion and object-storage erasure separately.
6. Test the target Android device physically. Chromium mobile emulation is not physical-device proof.
7. Rehearse staging backup/restore and rollback with exact deploy identifiers and measured timing.

## Release boundary

- PR #103 must remain Draft and unmerged until the owner authorizes release.
- Do not modify `main`, the production Render service, production Supabase, production secrets, payment configuration or real user data during this work.
- Production deployment to the established original URL is a separate Phase 7 action. It is not authorized until the owner types exactly `APPROVE RELEASE`.
