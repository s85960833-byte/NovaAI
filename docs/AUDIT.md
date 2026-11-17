# NOVA 1.0 — Plain-Language Audit

**Audit date:** 2026-11-17  
**Audited source:** `s85960833-byte/NovaAI`, `main` baseline `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`  
**Production URL:** https://novaai-4auo.onrender.com  
**Scope:** Read-only inspection. This file describes the legacy product; it is not a claim that every feature has passed an end-to-end test.

## What NOVA 1.0 is

NOVA 1.0 is a mobile-first, single-page AI assistant. The browser app is primarily `index.html` plus modular JavaScript files. A Node.js 22 server runs Express 4 from `nova-server.txt`; the package start command is `node nova-server.txt`. The server keeps provider credentials on the server and exposes chat, search, transcription, image and live-data routes. The current app also has a PWA manifest/service worker, account UI, local chat storage, optional cloud sync, and specialist workspaces.

The repository contains more than a basic chatbot: it includes Learn, Build and Agents modes, image generation, document support, voice controls, a shopkeeper mode and a separate Business Intelligence feature set. NOVA Business Intelligence is outside the NOVA 2.0 core launch and must remain a separate product boundary.

## Main user-facing capabilities found

- Chat workspace, local conversation history, search and message actions.
- Hindi/English interface and reply-language controls; theme and accessibility settings.
- Local preferences/memory/custom instructions and local backup export/import.
- Provider configuration / BYOK controls (security review required; browser-held keys are exposed to the device environment).
- Image/photo upload, image understanding and asynchronous image-generation jobs.
- Browser speech recognition/synthesis and a live-voice path.
- PDF and text-document understanding.
- Government scheme search, shopkeeper assistant, seven Learn modes and an app/website builder mode.
- PWA manifest, service worker and entry animation.
- Supabase email-auth client paths, optional cloud workspace sync and account settings.

## How it is built today

| Layer | Current implementation |
|---|---|
| Frontend | `index.html` plus browser JavaScript modules |
| Backend | Express 4 in `nova-server.txt` |
| Runtime | Node.js 22 |
| Package entry | `node nova-server.txt` |
| Data | Browser local storage by default; optional Supabase-backed cloud workspace/auth |
| AI | Server-side provider proxy; optional search, transcription and image providers |
| Tests | Existing Node checks and Playwright mobile/cloud-sync tests |
| Deployment | Existing Render production service; production is outside this rebuild branch |

## Important limitations and known defects

1. The production Render SHA observed in the Phase 0 report differs from the audited GitHub `main` SHA. Do not assume live code equals repository head.
2. A browser test in Actions run `43199071222` failed around the intro-completion marker migration: the legacy marker is detected but the v2 marker is not persisted.
3. Cloud sync has a documented same-chat-ID overwrite/conflict risk across devices.
4. Full self-service account deletion covering Auth, database rows and stored objects was not proven.
5. Full account-level server export was not proven.
6. The old scheme finder is search-based, not a deterministic reviewed dataset.
7. Local/remote Supabase migration timestamps differ in three pairs. Never blindly replay or repair these against production.
8. Voice support depends on browser APIs and service availability; physical Android Hindi tests remain outstanding.
9. Some provider/search/live-data paths have documented timeout, rate-limit or access-denied observations.
10. A previous narrow Android layout issue was reported; it requires viewport and physical-device verification.

## NOVA 2.0 compatibility rules

- Preserve local keys: `nova`, `nova_t`, `nova_modes_v1`, `nova_mode_cache_v1`, and `nova-cloud-sync-enabled`.
- Keep cloud sync OFF unless the user explicitly enables it.
- Never copy real user data into staging.
- Do not destructively rename or discard legacy data.
- Use an explicit identity mapping and synthetic-data dry runs before any future production migration.
- Keep NOVA Business Intelligence separate.
- Preserve all 13 legacy modes until their replacement has passed parity tests.

## Legacy mode disposition

| Legacy mode | New destination |
|---|---|
| general, voice | Sakha |
| document | Sakha; Diwan Paper Reader is a separate structured workflow |
| schemes | Diwan deterministic scheme finder |
| shopkeeper | Legacy shelf |
| math, photo, ncert, board, ssc, upsc, english | Legacy shelf until Guru exists and passes tests |
| builder | Legacy shelf until Shilpi exists and passes tests |

## Evidence and verification boundaries

The Phase 0 audit is based on repository/source inspection and recorded service/database metadata. It is not a fresh live production smoke test, physical Android test, email-delivery test, full deletion/export test, cross-device conflict test or backup-restore drill. Those remain explicitly **NOT VERIFIED** until evidence is collected in isolated staging.

## Phase 0 decision

Gate 0 was approved by the owner on 2026-11-17. This approval authorises Phases 1–6 on `nova-2.0/rebuild`, using free resources and synthetic data only. It does not authorise production changes, real payment activation, paid services, production secrets, or Phase 7 release.
