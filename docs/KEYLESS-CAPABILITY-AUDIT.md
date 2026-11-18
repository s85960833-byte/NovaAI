# NOVA Keyless / Offline Capability Audit
Date: 2026-11-18
Scope: source-backed feasibility review of the 220-item API/keyless risk list.
Status: audit only; no production code, Render settings, secrets, database, or user data changed.

## Executive decision

The 220 entries are not 220 confirmed defects. They mix source-confirmed blockers, external-service dependencies, device/browser constraints, design requirements, and future risks. Some entries overlap.

Three acceptance targets must remain separate:

1. **No paid AI API key:** achievable for many AI workflows using a local model, with reduced quality and device requirements. Free public services may still require internet.
2. **No paid API/service at all:** achievable for a useful offline-capable subset, but not for live internet, email delivery, cloud sync, remote deployment, or third-party account actions.
3. **Fully offline:** only local compute and locally stored data can work. Live search, current weather/prices/scores, email, cloud collaboration and remote Git/deploy actions cannot.

## Verified source evidence on main

- `nova-server.txt` line 48-50: `GET /api/config` returns HTTP 503 when `LLM_KEY`, `GROQ_API_KEY`, and `OPENROUTER_API_KEY` are all absent. This blocks normal frontend capability initialization.
- `nova-server.txt` line 54-82: `POST /api/transcribe` uses only configured LLM/Groq-compatible speech providers; no local ASR path exists in this route.
- `nova-server.txt` line 148 onward: `POST /api/chat/completions` constructs its provider list only from LLM/Groq/OpenRouter keys. There is no on-device inference in this route.
- `nova-server.txt` line 226-264: image generation first optionally uses a paid image provider, then Pollinations public endpoints. AI Horde is attempted only when `HORDE_API_KEY` exists. Pollinations is keyless but still an external internet service, not offline generation.
- `nova-app.js` line 165 onward: PDF.js is dynamically imported from jsDelivr. A first-time PDF read therefore requires CDN/network unless the library is bundled/self-hosted.
- `nova-app.js` line 195 and 663-675: browser SpeechRecognition / SpeechSynthesis are used. Availability and voice locality vary by browser and installed Android speech packs; this is not a guaranteed offline Hindi ASR/TTS stack.
- `nova-app.js` line 654: frontend config initialization only adopts a successful response containing a model. The current 503 therefore prevents normal server capability discovery.
- `package.json` on main contains Express and test dependencies, but no bundled local inference, OCR, ASR, TTS, or image-generation runtime.

## PR #104 verification (not production-integrated)

PR #104 is open, unmerged, and targets main. Head: `d1bbe933c85998f57d283994b62fbc08e8b5a630`.
Both associated CI runs completed successfully:
- NovaAI verification run 44316215547: success.
- Account/browser verification run 44316215635: success.

The PR adds isolated `/local-ai-lab` and `/keyless-lab` experiments. It does **not** connect the local model to the main chat. The local model experiment currently:
- loads `onnx-community/Qwen3-0.6B-ONNX` from a remote model/CDN on first use;
- requires WebGPU and has no CPU/WASM fallback;
- does not establish durable cache retention across browser eviction;
- has no verified physical Android handset/GPU result;
- uses a small model whose response quality is not equivalent to hosted frontier models.
The keyless search experiment calls public Wikipedia and Google News RSS only; it is not whole-web search and does not read every result page.

## Feasibility classification

Legend:
- **LOCAL** — can be implemented without an AI API, using local code/model; device limits apply.
- **FREE-NET** — can work without a paid key but still depends on public internet services and their limits.
- **ACCOUNT** — requires user-authorized credentials/account access; not an AI API key, but cannot be eliminated for remote actions.
- **ONLINE-ONLY** — inherently requires internet/current external data; impossible in fully offline mode.
- **DEVICE** — depends on handset/browser/GPU/RAM/storage/permissions and needs real-device tests.
- **NOT-A-BUG** — design choice, expected limitation, or a risk to manage rather than a confirmed defect.
- **UNVERIFIED** — needs targeted test or deeper source review before calling it a defect.

### Items 1-102 (previous audit)
These were previously described as a mixture of confirmed dependencies, incomplete features, tests still required, and future risks. They must not be counted as 102 confirmed bugs. Apply the same feasibility classes above; do not mark an item solved without a test.

### Items 103-112: main chat
- 103-104: **SOURCE-CONFIRMED BLOCKER**. Main config/chat path is hosted-key-only. Fixable by adding an explicit browser-local model provider and a graceful no-key config response.
- 105-106: **UNVERIFIED / CONFIGURATION**. BYOK is optional for local mode, but provider URL/model validation and UI messaging need tests.
- 107-108: **LOCAL + DEVICE**. Local/hosted failover and abort/stream semantics can be implemented; must test model load failures, cancellation and memory cleanup.
- 109-110: **DEVICE / MODEL LIMIT**. Context truncation and small context are inherent constraints; chunking, summarization and retrieval mitigate but do not eliminate them.
- 111: **LOCAL + DEVICE**. Local vision is possible with a separate compatible model; text-only Qwen is insufficient.
- 112: **LOCAL**. Download/inference progress UI is implementable; current lab has a progress indicator but main chat integration is absent.

### Items 113-122: voice
- 113-114, 117-120: **DEVICE / UNVERIFIED**. Browser speech APIs and installed voice packs vary; no universal offline guarantee.
- 115-116: **SOURCE-CONFIRMED HOSTED PATH**. Backend transcription requires configured provider credentials. Replace/add on-device ASR for keyless/offline use.
- 121: **LOCAL DESIGN LIMIT**. Recording chunking and duration/size limits are implementable; hardware and memory still constrain.
- 122: **DEVICE**. Local ASR/TTS models need storage/RAM and device tests.

### Items 123-132: image
- 123: **LOCAL**. Prompt rewriting can use the local text model; optional, not a generation prerequisite.
- 124: **FREE-NET**. Pollinations is a public external service, not offline generation and not a guaranteed SLA.
- 125: **SOURCE-CONFIRMED**. AI Horde fallback in current backend requires `HORDE_API_KEY`.
- 126: **UNVERIFIED**. Identify every provider and test failover before asserting a second provider.
- 127-128: **LOCAL / DEVICE**. Store image blobs in IndexedDB/OPFS with quotas and eviction handling; do not put large base64 images in unbounded chat state.
- 129-130: **LOCAL + DEVICE**. Vision understanding and image generation are separate capabilities and usually require separate model families.
- 131-132: **DEVICE**. Phone image generation is possible only with suitable model/runtime/hardware; high RAM/storage/heat/battery make it unsuitable as a universal default.

### Items 133-146: search and research
- 133-139: **FREE-NET / ONLINE-ONLY**. Public RSS/Wikipedia/search sources can avoid paid keys but are rate-limited, incomplete, and can fail.
- 140-142: **LOCAL + FREE-NET**. A safe page reader, PDF parser and table extraction can be implemented, but JavaScript-heavy, authenticated, paywalled or blocked sites cannot be guaranteed.
- 143-145: **NOT-A-BUG / LOCAL**. Language selection, cache freshness and deduplication are engineering tasks.
- 146: **NOT-A-BUG**. Provider terms/rate limits must be respected; there is no reliable way to bypass them.

### Items 147-156: live data
- 147-148, 149-156: **FREE-NET / ONLINE-ONLY**. Many sources are free/keyless but require internet and may delay, rate-limit, deny or change responses. Live data cannot work offline.
- Currency, finance and sports must show source timestamp and stale/unavailable status; do not label delayed/free data as real-time.

### Items 157-167: learning and documents
- 157, 162-163: **LOCAL**. Bundle or self-host pinned libraries and worker assets; avoid runtime CDN dependency for offline use.
- 158, 161, 166: **LOCAL + DEVICE**. OCR is implementable with local OCR models/language packs, but scanned PDFs need OCR and Hindi pack size/performance must be tested.
- 159-160, 164-167: **LOCAL / DEVICE**. Page-wise extraction, chunking, table parsing, indexing and bounded uploads are implementable with explicit size/context limits.

### Items 168-178: build and agents
- 168-171: **LOCAL + ONLINE-ONLY**. Local code generation and static analysis are possible; package installation, remote docs and hosted build/test runners require internet.
- 172-174: **ACCOUNT**. GitHub, Render and Supabase writes require user-authorized credentials and permissions. A local model cannot replace authorization.
- 175-178: **ACCOUNT / LOCAL / NOT-A-BUG**. Browser automation and agent orchestration can be implemented, but remote actions require session/auth, approvals, durable task state and audit logs.

### Items 179-190: account and company cloud
- 179-184, 187-190: **ACCOUNT / ONLINE-ONLY**. Hosted Supabase Auth/DB/Edge Functions and email delivery require an online service and project configuration. A free tier may avoid payment, not the external dependency.
- 185: **NOT-A-BUG / REQUIRED CONTROL**. Backup/restore is an engineering requirement, not an API requirement; implement and test it.
- 186, 188: **LOCAL + DEVICE**. Offline workspace and conflict-safe sync can be added; cloud collaboration still needs network.
- No credentials, project settings or user data were modified during this audit.

### Items 191-204: phone/browser
- 191-204: **DEVICE / LOCAL**. These are platform constraints or resilience requirements. Implement model download resume, explicit storage checks, Cache/IndexedDB/OPFS fallback, CPU/WASM fallback, visibility interruption handling and graceful capability warnings. Real handset testing is mandatory.

### Items 205-220: security and future risks
- 205-211: **NOT-A-BUG / SECURITY / FREE-NET**. Apply rate limits, provider timeouts, circuit breakers, policy compliance and graceful fallback. Public services cannot be made guaranteed.
- 212-216: **LOCAL / SECURITY**. Add source grounding, untrusted-content separation, file validation, SSRF allow/deny rules, integrity hashes, privacy controls and deletion tests.
- 217-219: **HOSTING / OPERATIONS**. Free hosting sleep/quotas and ephemeral process memory are service-plan limits; durable queues and monitoring require suitable infrastructure.
- 220: **ARCHITECTURE**. Add per-module health/capability status and independent fallbacks to prevent cascading failure.

## Corrected claims from the earlier 220-point list

1. A keyless public service is still an external service; it is not offline.
2. Supabase publishable keys are not paid AI keys. Supabase Auth/DB still require the hosted service and project configuration.
3. GitHub/Render/Supabase actions require authorized account credentials; that is not the same as an AI provider API key.
4. The current PR #104 CI success verifies the automated checks it ran, not physical Android WebGPU inference or production integration.
5. Not every numbered item is a bug. Some are expected limits, product decisions, or future hardening tasks.
6. Browser TTS may use local installed voices, but the app cannot assume that every Hindi voice is local or installed.
7. Local image generation on a mid-range Android phone is not an acceptable universal promise without memory/thermal testing.

## Required implementation order (non-production branch only)

1. Main chat: graceful no-key config + explicit local model adapter; WebGPU with CPU/WASM fallback; model download progress/resume/storage checks; cancellation and cleanup.
2. Keyless live search: retain source links, timestamps, cache, provider timeouts, bounded results and clear "public sources only" disclosure.
3. Documents: bundle PDF.js/worker; page-wise extraction; local OCR option for scanned PDFs; chunking and size caps.
4. Voice: on-device ASR/TTS candidate evaluation for Hindi/English; browser speech as optional fallback only.
5. Images: local image understanding candidate; keep remote keyless image generation clearly marked as online best-effort; do not promise phone-local generation until tested.
6. Live data: independent public source adapters, cache timestamps and stale-data warnings.
7. Accounts/agents: separate "no paid AI key" from external account authorization; retain explicit consent and least privilege.
8. Security/operations: SSRF protections, upload validation, prompt-injection boundaries, rate limits, backups, monitoring and durable job handling.

## Release gates

- Main branch and production deployment remain unchanged until separate review/approval.
- Automated CI success is necessary but not sufficient.
- Test no-key startup and chat on a clean browser profile.
- Test WebGPU and CPU/WASM fallback on Android Chrome and desktop Chromium.
- Test reload, offline-after-download, storage eviction, interrupted downloads, low memory and cancellation.
- Test Hindi and English ASR/TTS on the target handset.
- Test keyless search with upstream timeout/rate-limit/empty-result cases.
- Test PDF text and scanned PDF separately.
- Never mark a feature "offline" if it still downloads a model or calls a public endpoint.
- No paid services or API credits may be enabled as part of this work.
