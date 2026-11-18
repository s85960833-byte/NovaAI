# NOVA — Legacy App Integration Requirement

**Owner direction recorded:** 2026-11-18  
**Target:** Upgrade the existing NOVA application and keep its established production URL. Do not create a separate user-facing NOVA 2.0 destination.

## Current verified gap

PR #103 currently builds a separate React/Vite application under `apps/web` and a separate API under `apps/api`. Its home screen still links out to the existing NOVA 1.0 URL as an unchanged legacy app. The repository-root `index.html` and `nova-server.txt` remain the original application entrypoint/backend. Therefore PR #103 is **not yet an integrated replacement** for the existing NOVA experience.

## Required end state

1. The existing NOVA URL remains the only public user-facing URL. Do not ask users to move to a second NOVA URL.
2. The new Darbar, Sakha, Diwan, wallet-safety preview, account/settings, PWA and performance work must live inside the existing NOVA product and navigation.
3. Preserve and regression-test the existing NOVA capabilities before replacing its entrypoint:
   - chat, saved chats/history and local settings/storage;
   - voice input/output and live voice paths;
   - web search and source/citation presentation;
   - file/document handling and image generation;
   - login/authentication and existing account/session behaviour;
   - Nova Learn, Nova Build and Nova Agents groupings.
4. Add the new areas without deleting or silently disabling existing features. Learning tools belong in Nova Learn, creation/build tools in Nova Build, and agent tools in Nova Agents. Darbar/Sakha/Diwan should be integrated as the agreed Indian Study & Work experience, not a disconnected demo.
5. Keep existing browser storage keys and user-local history compatible. Any migration must be additive, versioned, reversible and tested against synthetic fixtures; never clear user data as part of upgrade.
6. Keep API/provider secrets server-side. Preserve legacy API behaviour or provide tested adapters before switching the root server entrypoint.
7. The existing root Render service must continue to use its existing URL and service identity. Staging must prove the exact new commit, health, mobile layout and API compatibility before any production release.
8. The old NOVA page must not be left as an external link labelled “Open NOVA 1.0 (unchanged)” in the new product. The completed product must be one coherent application on the established URL.

## Integration work gates

- [ ] Inventory the current root app's routes, API endpoints, browser storage keys, PWA assets and provider integrations.
- [ ] Build a feature-by-feature parity map from the legacy app to the integrated React UI; no feature is marked complete based only on a placeholder card.
- [ ] Implement Learn, Build and Agents as working in-app destinations and migrate their existing functionality.
- [ ] Integrate Darbar/Sakha/Diwan and new safe preview modules into the same shell/navigation.
- [ ] Add compatibility tests for existing API routes, chat/history persistence, voice, web search, files, images, auth and mobile UI.
- [ ] Make the existing root server/start command serve the integrated app only after build output and compatibility tests are proven.
- [ ] Verify the unchanged established Render URL on staging-equivalent deployment and record exact deployed SHA.
- [ ] Keep PR #103 Draft, do not merge, and do not change production Render, production Supabase, `main`, production secrets or real user data without the separate release gate.

## Non-negotiable release boundary

This integration requirement does not authorise Phase 7. PR #103 remains Draft and unmerged. Production remains untouched until every required gate is reviewed and the owner types exactly `APPROVE RELEASE`.


## Implemented integration on `nova-2.0/rebuild`

The branch now uses the original NOVA Node server as the public entrypoint in its staging blueprint:

- The React/Vite app is served at `/` from `apps/web/dist`.
- The original NOVA UI remains available at same-origin `/classic`; its static JavaScript, icons, PWA assets and original API handlers remain on the original server.
- The new API runs as a localhost child process. Only `/api/health`, `/api/auth`, `/api/files`, `/api/sakha`, `/api/diwan` and `/api/wallet` are proxied to it. Existing NOVA endpoints such as chat completions, search, image generation, transcription, live data and feeds remain on the original server.
- The React home links to `/classic`, not to a second Render hostname.
- Playwright now boots the unified original server plus the isolated API and checks same-origin legacy UI/assets/API compatibility.

This is branch/staging integration, not production readiness. Exact-head CI, staging deployed SHA, physical Android, hosted Auth and hosted data lifecycle remain separate gates. Legacy feature parity is not complete until the remaining rows in `PARITY_MATRIX.md` are exercised.


### Group shortcuts

The new NOVA home now links Learn, Build and Agents to their corresponding existing legacy workspace groups using same-origin routes (`/classic?workspace=learn|build|agents`). The original mode-workspace module opens the requested group directly; this reuses the actual existing mode registry and saved per-mode history rather than displaying placeholder cards.
