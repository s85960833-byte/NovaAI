# NOVA — Existing Feature Inventory

**Snapshot date:** 15 November 2026  
**Repository:** `s85960833-byte/NovaAI`  
**Audited ref:** `main` at `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`  
**Runtime source of truth:** `package.json` starts `node nova-server.txt` (Node.js 22). `nova-server.js` is a separate older server implementation and is not the configured Render start target.

> This is a source-level inventory, not a claim that every feature has been proven on a physical Android device or against every live provider. Runtime and provider availability are recorded separately below. Existing features are preserved; no feature has been removed or disabled by this audit.

## 1. Product surface and navigation

The active home/reference layer is implemented in `nova-reference.js` and presents three bilingual workspace cards:

| Workspace | Current implementation | Current limitations |
|---|---|---|
| **NOVA Learn** | Study-oriented prompt modes in `mode-registry.js` and `mode-workspace.js`; PDF/text/image context is sent with the user's request. | No dedicated CBSE paper-generation pipeline, source-linked answer key, teacher editor/versioning, timed test engine, scoring/progress database, or DOCX/PDF exports. |
| **NOVA Build** | App & Website Builder mode; separate browser-based NOVA Business Intelligence (BI) preview. | BI input is CSV only (5 MB / 20,000 rows); no PDF/Excel ingestion or DOCX/PDF business-report export. The AI builder is a conversational mode, not a complete code-execution/deployment platform. |
| **NOVA Agents** | Existing general chat, voice, document explainer, government-scheme and shopkeeper prompt modes; NOVA Suite/AI Council tooling. | No autonomous external-agent execution. The Council is a sequential multi-pass review over the configured model, not three independent providers. No dedicated waitlist is present. |

### Registered assistant modes (13 total)

| Group | Mode IDs | User-facing purpose |
|---|---|---|
| Learn (7) | `math`, `photo`, `ncert`, `board`, `ssc`, `upsc`, `english` | Step-by-step maths; solve from photo; NCERT-level explanations; board answers; SSC practice; UPSC-style analysis; English learning. |
| Build (1) | `builder` | App, website, SaaS, dashboard and business-tool planning/code guidance. |
| Agents (5) | `general`, `voice`, `document`, `schemes`, `shopkeeper` | Everyday chat; spoken conversation; explain documents/draft letters; find public schemes; shopkeeper/GST/customer-message assistance. |

`mode-registry.js` defines these modes and bilingual prompts. `mode-workspace.js` renders the grouped mode workspace and handles local conversation state, uploads, PDF text extraction, speech input and assistant requests.

**Navigation compatibility note:** `index.html` still contains legacy sidebar controls `nHome`, `nPhoto`, `nArch`, `nImg`, and `nLive`. The current reference-dashboard layer hides several legacy shortcut buttons while adding the three workspace links. Do not rename/remove these controls until the full interaction and storage regression suite demonstrates that it is safe.

The master upgrade prompt refers to four original main categories and six India-specific features. The current checked-in home source visibly defines three workspace cards and the registry above defines 13 modes. A one-to-one mapping for the historical "four categories / six India-specific features" wording is **not proven by the current active registry**; it must be reconciled with prior UI/product requirements before any navigation restructuring. No such feature is being removed in this phase.

## 2. Existing user-facing feature inventory

| Area | Current source | Existing behavior / evidence | Phase-0 regression coverage |
|---|---|---|---|
| Splash / entry | `index.html`, `nova-entry.js`, `assets/entry-video/*` | Full-screen NOVA intro; remembers completion in local/session storage and cookies; reduced-motion path. Existing visitor marker compatibility is a tested requirement. | Browser smoke; dedicated marker regression added in this branch. Physical cold-start timing still unverified. |
| Home / three workspaces | `nova-reference.js`, `index.html` | Bilingual home, three workspace cards, global saved-chat search, mobile edge-to-edge layout and sidebar overlay. | Browser smoke + five-viewport mobile Playwright suite. Physical Android still required. |
| Chat / answer engine | `nova-app.js`, `nova-server.txt` | Chat UI, message history, streaming-compatible provider response handling, user/assistant rendering, stop/retry/error states, conversation context and server-side provider proxy. | Local runtime smoke and browser smoke; no live provider accuracy guarantee. |
| Saved chats | `nova-app.js` | Browser-local `nova` data; create, search, select, rename, pin, delete; JSON backup/restore. | Browser smoke; storage schema must remain backward-compatible. |
| Memory / custom instructions | `nova-app.js` | Memory and custom instructions are included in the persisted chat state and assistant context. | Syntax/browser smoke; dedicated memory behavior coverage is incomplete. |
| Settings / BYO provider | `index.html`, `nova-app.js`, `nova-config.js` | Language, theme, model/base/key setup and other local preferences. Existing key entry behavior must not be casually changed. | Browser smoke coverage is partial. Never print or copy actual environment values into docs/logs. |
| Web search / live retrieval | `nova-server.txt`, `nova-app.js` | `POST /api/search` (Tavily when configured); `POST /api/live` performs live retrieval for current facts and uses provider/source fallbacks. | Runtime smoke checks route behavior; provider live self-test is disabled by default unless explicitly enabled. End-to-end accuracy and latency need fresh measurements. |
| News / feed | `nova-server.txt`, `nova-app.js` | `GET /api/feed`; RSS/news-source categories and client-side refresh cache (about five minutes). | Runtime smoke checks feed structure; individual RSS source availability is not guaranteed. |
| Voice / transcription | `nova-app.js`, `nova-server.txt` | Browser voice UI, speech recognition/synthesis where supported, and `POST /api/transcribe` fallback with bounded audio size and provider timeout. | Runtime checks invalid-input handling; real microphone/speaker permission and device tests remain open. |
| Image input / camera | `index.html`, `nova-app.js` | Image upload, camera capture, gallery selection, image-aware prompt path and photo-solve mode. | Browser smoke partial; physical camera/gallery test not done. |
| Image generation | `nova-app.js`, `nova-server.txt` | `POST /api/image`, async job submission/status route, configurable providers and free/fallback paths. Image jobs are process-memory state, not durable across restart. | Input-validation and free-image smoke are present; live provider result/latency must be checked per environment. |
| File / PDF support | `nova-app.js`, `mode-workspace.js` | Main chat accepts text/image/PDF-related files; workspace extracts selectable PDF text in the browser using PDF.js 6.5.438, preserves page references in extracted text, and supports text/Markdown/CSV/TSV/JSON/XML/HTML/log and images. Text is bounded (about 60,000 characters in main chat; workspace applies its own context cap). Scanned PDFs are reported as unreadable/selectable-text absent; image upload is the fallback. | PDF.js security mitigation test and browser smoke exist. Complex/scanned PDFs and language rendering need separate fixtures. |
| Study Mode / learning modes | `nova-app.js`, `mode-registry.js`, `mode-workspace.js` | Study prompts and the seven Learn group modes; explanations are generated conversationally. | Mode-registry checks and browser smoke; no source-grounded paper-builder acceptance suite exists yet. |
| NOVA Suite / Studio | `nova-suite.js` | Project Brain (local context), Reality Check, sequential AI Council, local snapshots, local notes vault/file import, Trust Shield settings, business blueprint helper, on-demand service health checks. | Syntax/browser smoke partial; local persistence and council outputs need feature-specific tests. |
| Business calculations | `nova-business-core.js`, `nova-business.js` | Browser-side CSV parsing/calculations for expenses, clients and team task metrics; data-quality warnings, rule-based project risk, assumption-based scenario calculations, workflow proposal and action-proof summaries. CSV raw rows stay in browser memory; no external workflow executes. | 45 unit tests in current main workflow; browser smoke and company-cloud browser workflow. Do not market heuristic risk as a prediction or scenario as realized savings. |
| Company Cloud / BI auth | `nova-business-cloud.js`, `nova-business-security.js`, Supabase Edge Function | Supabase Auth-based organization/membership/invitations, metadata/analysis/workflow records, branding and role-gated audit views; raw CSV rows are not uploaded by the BI save path. | Deno unit tests, PostgreSQL migration/RLS integration and browser checks in CI. Real signup/email delivery, two-real-account end-to-end isolation and recovery remain unverified. |
| Personal account / optional sync | `nova-account.js`, `supabase/migrations/*` | Supabase email/password account UI; confirmation/reset/resend; opt-in cloud chat sync; separate cloud-backup deletion and sign-out. Local chat remains default. | Browser smoke partial; real email delivery/two-account isolation incomplete. Complete self-service account deletion is not implemented. |
| PWA / icons / offline | `nova-server.txt`, `index.html` | Manifest, SVG emblem, generated 192/512 PNG icons, service worker shell caching and static-asset routes. | Runtime smoke checks manifest/icons/service worker. Offline completeness and real installability need device checks. |
| Privacy / terms | `PRIVACY_NOTICE_DRAFT.md`, `TERMS_OF_USE_DRAFT.md`, `README.md` | Draft documents and UI disclosure; cloud sync opt-in and data-scope notice. | Source/CI checks only. Drafts are not legal approval; retention schedule and complete account deletion are missing. |
| Bilingual UI | `index.html`, `nova-app.js`, `mode-registry.js`, workspace/business modules | English/Hindi dictionaries and language switching for major current surfaces. | Browser smoke verifies language switch and visible labels; full translation completeness not proven. |
| Accessibility / mobile | `index.html`, `nova-reference.js`, `nova-suite.js`, Playwright tests | Responsive CSS, keyboard/dialog affordances, focus-visible states and touch target rules in selected surfaces. | Five viewport/drawer Playwright suite; Lighthouse >=90 and physical Android/screen-reader verification not yet evidenced. |

## 3. Runtime architecture and deployment

| Layer | Current implementation |
|---|---|
| Frontend | Static HTML in `index.html`; modular browser JavaScript above; no frontend bundler. |
| Backend | Express 4 app in `nova-server.txt`; this is the configured entry point. `nova-server.js` is a second legacy implementation and must not be substituted without full route parity review. |
| Runtime | Node.js 22.x. Render command: `node nova-server.txt`. |
| Data/auth | Browser-local chat/settings by default. Supabase Auth + `nova_user_workspaces` optional user sync. Separate NOVA BI Supabase Edge Function and RLS-protected tables. |
| File processing | Browser-side PDF.js text extraction; browser-side CSV parse/calculation for current BI preview. No current durable server-side PDF job queue. |
| Deploy | Render free web service, Singapore, one instance, auto-deploy from configured branch. Free plan has no always-on/SLA guarantee. |

### Express routes (configured `nova-server.txt`)

| Method | Route | Current purpose |
|---|---|---|
| GET | `/` | Main HTML app. |
| GET | `/health` | Process readiness status/service/timestamp. Current main does not add `/version` and does not send explicit `Cache-Control: no-store`; separate draft PR #101 proposes those changes. |
| GET | `/api/config` | Provider/model capability configuration (no secret key value in response). |
| POST | `/api/transcribe` | Voice/audio transcription. |
| POST | `/api/chat/completions` | LLM chat proxy and model fallback. |
| POST | `/api/search` | Configured web-search provider (Tavily when configured). |
| POST | `/api/image` | Image generation job submission. |
| GET | `/api/image/status/:id` | Poll image job status. |
| POST | `/api/live` | Multi-provider live retrieval (weather, finance, sports, news and other current context). |
| GET | `/api/live/selftest` | Operator-oriented provider diagnostics; controlled by server configuration and disabled by default in the normal smoke path. |
| GET | `/api/feed` | Categorized news feed. |
| GET | `/manifest.webmanifest` | PWA manifest. |
| GET | `/icons/nova-emblem.svg`, `/icons/icon-192.png`, `/icons/icon-512.png` | Install icons. |
| GET | `/sw.js` | Service worker. |
| GET | `/nova-entry.js`, `/nova-config.js`, `/nova-app.js`, `/nova-sync-merge.js`, `/mode-registry.js`, `/mode-workspace.js`, `/nova-suite.js`, `/s-tier.js`, `/nova-reference.js`, `/nova-business-core.js`, `/nova-business.js`, `/nova-business-cloud.js`, `/nova-account.js` | Frontend module delivery. |
| GET | `/assets/nova-entry.mp4` | Reconstructed entry motion asset. |

### Environment-variable names referenced in `nova-server.txt`

Names only; values are deliberately excluded:

- AI providers: `LLM_KEY`, `LLM_MODEL`, `LLM_BASE`, `LLM_FALLBACK_MODELS`, `LLM_MAX_HISTORY`, `LLM_MAX_INPUT_TOKENS`, `LLM_TIMEOUT_MS`, `LLM_VISION_MODEL`, `LLM_VISION_BUDGET`
- Groq: `GROQ_API_KEY`, `GROQ_BASE`, `GROQ_MODEL`, `GROQ_VISION_MODEL`
- OpenRouter: `OPENROUTER_API_KEY`, `OPENROUTER_BASE`, `OPENROUTER_MODEL`, `OPENROUTER_VISION_MODEL`
- Search/context: `TAVILY_KEY`, `BRAVE_KEY`
- Image: `IMAGE_KEY`, `IMAGE_MODEL`, `IMAGE_BASE`, `IMAGE_OFF`, `ALLOW_PAID_IMAGE`, `POLLI_KEY`, `HORDE_API_KEY`, `HORDE_BASE`
- Speech/runtime/diagnostics: `STT_MODEL`, `STT_OFF`, `PORT`, `LIVE_CONCURRENCY`, `LIVE_SELFTEST_ENABLED`, `SELFTEST_ON_START`

This is the set statically referenced in the configured server file; Render's configured environment may contain additional names and was not read/exported by this inventory.

## 4. External APIs, feeds and hosted dependencies

These are source references, not a statement that each is currently configured, available or healthy.

| Capability | Referenced provider/host |
|---|---|
| LLM/chat/vision/transcription | OpenRouter (`openrouter.ai`), Groq (`api.groq.com`), OpenAI-compatible endpoint (`api.openai.com`), Google Gemini endpoint (`generativelanguage.googleapis.com` appears in source) |
| Web search/context | Tavily (`api.tavily.com`), Brave Search/Context (`api.search.brave.com`), DuckDuckGo HTML (`html.duckduckgo.com`), Google News RSS (`news.google.com`) |
| Image generation | Pollinations (`gen.pollinations.ai`, `image.pollinations.ai`), AI Horde (`aihorde.net`), configurable OpenAI-compatible image endpoint |
| Weather / environment | Open-Meteo geocoding, forecast and air-quality APIs; `wttr.in` fallback |
| Markets / currency | CoinGecko, Coinbase Exchange, Frankfurter, Yahoo Finance chart endpoints |
| Sports | ESPN site API, TheSportsDB |
| Research / knowledge / science | Wikipedia API, Wikimedia, OpenAlex, arXiv, World Bank API, NASA EONET, USGS earthquake feed |
| News RSS / editorial sources | BBC (English/Hindi), Al Jazeera, NPR, Deutsche Welle, UN News, The Hindu, NDTV, Indian Express, Times of India, PIB, Navbharat Times, Livemint, CNBC, TechCrunch, The Verge, Ars Technica, ScienceDaily, Nature, NASA, WHO, Apple, Google, Microsoft, NVIDIA, Hacker News |
| Browser dependencies | Supabase JS UMD CDN, PDF.js module/worker CDN, jsDelivr, cdnjs, Google Fonts |

## 5. Persistent data / storage observed in source

| Store/key | Current purpose |
|---|---|
| LocalStorage `nova` | Main chats, UI preferences, saved memory/custom instructions and related local assistant data. Treat schema as a compatibility contract. |
| LocalStorage `nova_intro_completed_v2`, `nova_intro_completed_v1` | Splash/intro completion compatibility markers. Cookie `nova_intro_seen_v2` and legacy `nova_intro_seen_v1` are also read. |
| LocalStorage `nova_modes_v1` | Separate NOVA workspace-mode conversation histories (e.g. general, voice and other registered modes). Treat the per-mode history shape and key as a compatibility contract. |
| LocalStorage `nova-cloud-sync-enabled` | Explicit opt-in preference for personal cloud sync. |
| LocalStorage `nova_suite_v1` | Local NOVA Suite project/notes/snapshot/permission state. |
| LocalStorage `nova_t` | Temporary storage-capability probe; the app sets and immediately removes it to determine whether durable local storage is available. |
| SessionStorage `nova-bi-org` | Selected company workspace in the BI UI. |
| Supabase table `nova_user_workspaces` | Optional user workspace snapshot for signed-in, opted-in sync. |
| Supabase NOVA BI schema | Organization, membership, invitation, dataset metadata, analysis, workflow proposal, branding, audit and related service-side rate-limit records. Exact schema is in the migration files. |

## 6. Existing automated verification inventory

### Main workflow: `.github/workflows/novaai-verification.yml`

The existing CI sequence covers:

1. `npm ci`; `node scripts/check.mjs` syntax/source checks.
2. Markdown/XSS link escaping test; mode registry test.
3. Cloud-sync merge test; bounded per-IP rate-window test; HTTPS-only provider URL test; PDF.js untrusted-document eval mitigation test.
4. PostgreSQL 17 application of NOVA BI migrations and tenant/RLS integration test.
5. Deno 2.9.6 dependency install, Edge Function type-check and invitation/CORS/request-input tests.
6. Deployed NOVA BI Edge Function auth/CORS smoke on `main` only.
7. BI CSV/calculation test suite.
8. 60-case AI evaluation fixture schema/shape validation (this validates the fixture/harness input; it is **not** a measured live-model accuracy benchmark).
9. Production dependency audit: `npm audit --omit=dev --audit-level=high`.
10. Start local Express with test-only credentials; runtime API/PWA smoke and graceful-shutdown smoke.
11. Devanagari font install; Playwright/Chromium browser smoke; Company Cloud browser flow; five-viewport mobile/drawer regression.
12. On `main` only: wait for live Render, smoke-test live website/providers, free-image smoke.

### Additional scripts / tests

- `scripts/browser-smoke.mjs`
- `scripts/company-cloud-browser.mjs`
- `scripts/runtime-smoke.mjs`
- `scripts/smoke.mjs`
- `scripts/smoke-free-image.mjs`
- `scripts/wait-live.mjs`
- `scripts/shutdown-smoke.mjs`
- `scripts/check.mjs`
- `scripts/modes-check.mjs`
- `scripts/validate-ai-evaluation.mjs`
- `scripts/business-intelligence.test.cjs`
- `scripts/cloud-sync-merge.test.cjs`
- `scripts/provider-url.test.cjs`
- `scripts/rate-limit.test.cjs`
- `scripts/pdf-security.test.cjs`
- `scripts/security-markdown.test.cjs`
- `tests/mobile-layout.spec.mjs`
- Deno tests under `supabase/functions/nova-bi-api/*_test.ts`
- PostgreSQL migration/RLS test: `scripts/supabase-rls-integration.sql` via `scripts/test-supabase-migrations.sh`

### Coverage gaps to close before passing Phase 0

- A single explicit regression matrix linking **every** listed user-facing feature to a test ID/result is not yet checked in.
- Camera/microphone/speaker/gallery and PWA install/offline require real Android/browser-permission verification.
- Saved memory, custom instructions, BYO key settings and full chat CRUD need deeper behavioral assertions.
- Image generation completion and restart recovery are not proven; image job state currently resides in server memory.
- Provider routes require per-provider live checks and measured latency/error rates; CI live checks do not exercise all providers every PR.
- RSS/news and live facts need freshness, source provenance and failure fallback checks.
- PDF text extraction needs golden files for page/section integrity, encrypted/large/scanned-file errors and language coverage.
- No dedicated CBSE paper generation, source traceability, independent verifier, teacher editing/version history, student assessment or Hindi DOCX/PDF export test exists.
- No dedicated new business PDF/XLSX import/export, admin KPI/analytics, Razorpay TEST flow or Agents waitlist test exists.
- Lighthouse score, accessibility audit and physical-device tests are not currently part of a proven release gate.

## 7. Phase-0 verified findings (source/CI/Render snapshot)

| Check | Result | Evidence |
|---|---|---|
| GitHub default branch | **Verified** | `main`, commit `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`. |
| Production Render service | **Verified configuration** | `NovaAI`, `srv-dbidhpc9v7es73d6ia80`, production URL; branch `main`, Node, `npm install`, `node nova-server.txt`, Free plan. |
| Current production deploy | **Verified metadata** | Deploy `dep-dbom7bbm8hqs73ec2gi0`, live commit `c3cee61906b88ff111b3a645db55c9c2503cd8f7` (behind current GitHub `main`). |
| Staging config | **Verified configuration** | `novaai-pr98-staging`, `srv-dbqm035g1s2s73eogao0`; still on `fix/nova-home-learn-first-mobile-20261109`; Health Check Path is blank. Latest live staging deploy SHA `7e816af473d29f9dd2e1d4cab775cb905f1a82fe`. |
| Current main CI | **Failed** | Workflow run `43199071222`, head `bdbeb208…`; Playwright/browser smoke failed at legacy intro marker migration assertion. |
| Isolated marker fix | **Verified in a separate draft PR** | PR #101 uses the marker migration fix; its exact-head workflow runs `43694630954` and `43694630928` both succeeded. This phase branch applies only the minimal `nova-entry.js` fix; PR #101 remains untouched. |
| Live HTTP checks from this session | **Not verified** | The available web/connector route did not return a reliable live response; no claim of production health is made here. |
| Physical Android / Lighthouse | **Not verified** | No physical-device result or measured Lighthouse report available in this audit. |

## 8. New roadmap capability delta

The following are **new** and are not to be confused with the existing conversational modes or BI preview:

- **Learn:** bounded PDF upload service; chapter/section confirmation; CBSE blueprint paper generation; MCQ/very-short/short/long/case-based question definitions; difficulty and marks/duration logic; page/section grounding; separate verifier; marking scheme and bilingual explanations; teacher CRUD/reorder/version history; print-ready PDF/DOCX with Devanagari test corpus; Study Mode practice/timer/scoring/weak-chapter progress.
- **Foundation:** validated structured LLM gateway; bounded repair; provider fallback/circuit breaker/cache/metrics; durable idempotent jobs/SSE progress; feature flags; first-party analytics event definitions and i18n dictionaries.
- **Business:** PDF/CSV/XLSX import pipeline; code-computed business metrics; grounded proposal/report exports; feature-flagged MVP.
- **Commercial/ops:** configurable Learn/Build limits; test-mode payment flow only after authorized adult owner setup; usage/cost metering; owner-scoped KPI dashboard and CSV; adult tutor interview tracker; DB-backed feedback; Agents waitlist.
- **Agents:** honest Coming Soon + waitlist only; no false autonomous behavior.

**Phase-0 invariant:** existing production features, data keys, routes, authentication, and home/splash behavior are protected. No cleanup or deletion is authorized by this inventory.
