# NOVA AI — Feature Guide and Engineering Inventory

**Updated:** 13 November 2026  
**Scope:** Source-derived feature inventory for PR #98. This document distinguishes implemented code from unverified live providers, missing policy and incomplete tests. It is not a claim that every feature is production-ready.

## Product structure

NOVA is a Hindi-English web workspace with three top-level areas:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation and builder workflows.
- **NOVA Agents** — assistant and agent workflows.

The main shell is an SPA/PWA served from `index.html`. The backend is Express on Node.js 22 in `nova-server.txt`.

## 1. AI Chat

**Purpose:** Answer user questions, explain topics, write, reason over context and support learning/work tasks.

**How it works:** The browser sends message history to `POST /api/chat/completions`. The server bounds history and token sizes, adds current time/truth instructions, then routes requests through configured OpenAI-compatible providers. Responses can be streamed.

**Primary files:** `index.html`, `nova-app.js`, `nova-server.txt`, `nova-provider-url.js`, `nova-http.js`.

**API:** `POST /api/chat/completions`; bootstrap `GET /api/config`.

**Tests:** Local runtime smoke; API Auth unit tests; provider URL/HTTP bounds tests; Main CI syntax/runtime/container tests.

**Limits and cost:** At least one AI provider and compatible model must be configured. Staging currently has no provider and `/api/config` returns 503. Provider price, quota, model availability and per-answer cost are not measured yet. The Express auth gate defaults OFF and process-local rate limits are not monthly quotas.

**In-app help (English):** “Ask Nova to explain, write, plan or solve a task. Answers depend on the configured AI provider and may need independent verification.”

**इन-ऐप सहायता (Hindi):** “Nova से किसी विषय की व्याख्या, लेखन, योजना या समस्या का हल पूछें। उत्तर उपलब्ध AI provider पर निर्भर है; महत्वपूर्ण जानकारी स्वयं भी जाँचें।”

## 2. Live Search and Grounded Answers

**Purpose:** Retrieve current information and provide source links and timestamps instead of relying only on model memory.

**How it works:** `POST /api/live` classifies the question as fresh-data or knowledge work, selects data connectors, normalizes/ranks results and creates a bounded evidence context with sources and retrieval time. General search uses configured Tavily/Brave providers sequentially, then Wikimedia search as a fallback.

**Primary files:** `nova-server.txt`, `nova-search-router.js`, `nova-http.js`.

**API:** `POST /api/live`, `POST /api/search`.

**Tests:** Sequential provider-router unit tests; provider HTTP safety tests; runtime smoke; live Staging health and route smoke. Live paid-provider bake-off is not complete.

**Limits and cost:** Live retrieval is capped at 24 requests/minute per IP/user in one process and uses a concurrency cap. Paid-provider costs are not metered. Tavily shared result caching is disabled unless written permission is recorded; Brave results are not put in the shared cache. If no search provider succeeds, the result may be limited to Wikipedia or report no usable sources.

**In-app help (English):** “Use Live Search for current facts. Open the cited sources and check the ‘as of’ time.”

**इन-ऐप सहायता (Hindi):** “ताज़ा जानकारी के लिए Live Search चुनें। दिए गए source खोलें और ‘as of’ समय ज़रूर देखें।”

## 3. News and Daily Feeds

**Purpose:** Show grouped world, India, Hindi, technology, science, business, sports and health headlines.

**How it works:** `GET /api/feed` gathers curated RSS/Atom feeds, normalizes dates and publishers, deduplicates similar headlines and caches feed results briefly.

**Primary files:** `nova-server.txt`, `nova-app.js`.

**API:** `GET /api/feed?cat=all&lang=en` and category-specific variants.

**Tests:** Runtime smoke checks feed availability; feed tests are part of the Main integration path.

**Limits and cost:** RSS content rights vary by publisher. A link or public RSS endpoint does not grant blanket commercial redistribution rights. Do not display long excerpts or treat feed access as a licence. Current provider-rights register lists these as not fully cleared.

**In-app help (English):** “Browse headlines by topic. Open the publisher link for the full report and confirm its publication date.”

**इन-ऐप सहायता (Hindi):** “विषय के अनुसार headlines देखें। पूरी खबर के लिए publisher का link खोलें और तारीख जाँचें।”

## 4. Weather and Air Quality

**Purpose:** Provide current weather, a short forecast and optional air-quality readings.

**How it works:** Place names are geocoded, followed by forecast and air-quality requests. The current source includes Open-Meteo and wttr.in fallback logic.

**Primary files:** `nova-server.txt`.

**API:** Internal weather connector through `POST /api/live`.

**Tests:** Provider self-test includes geocoding and forecast probes; no commercial-provider licence test is automated.

**Limits and cost:** Open-Meteo's free endpoint is explicitly non-commercial; commercial apps require the appropriate commercial plan. wttr.in commercial rights have not been confirmed. Do not describe this feature as cleared for commercial production until rights are verified.

**In-app help (English):** “Choose a city to view weather. Check the observation time; forecasts can change.”

**इन-ऐप सहायता (Hindi):** “शहर चुनकर मौसम देखें। Observation time जाँचें; forecast बदल सकता है।”

## 5. Finance, Crypto and Currency References

**Purpose:** Answer limited crypto price and currency conversion questions, while avoiding unsupported equity prices.

**How it works:** Crypto quotes use CoinGecko with a Coinbase Exchange fallback. Currency conversion uses Frankfurter/ECB daily reference rates. Listed equities and commodity quotes fail closed unless a documented, commercially licensed source is configured.

**Primary files:** `nova-server.txt`, `scripts/market-data-policy.test.cjs`.

**API:** Internal finance connectors through `POST /api/live`.

**Tests:** Market-data policy tests ensure Yahoo's unofficial endpoint is absent and unlicensed listed-market prices fail closed.

**Limits and cost:** CoinGecko keyless/free access is not licensed for commercial use; commercial display requires a paid plan and attribution, while raw redistribution needs custom rights. Coinbase market-data commercial rights and Frankfurter downstream terms remain unverified. FX reference rates are daily, not real-time trading prices. No investment advice or guaranteed price accuracy.

**In-app help (English):** “Prices and exchange rates may be delayed or unavailable. Check the timestamp, source and market before making decisions.”

**इन-ऐप सहायता (Hindi):** “कीमतें और exchange rates देर से अपडेट हो सकते हैं या उपलब्ध न हों। निर्णय से पहले समय, source और market जाँचें।”

## 6. Sports Schedules and Scoreboards

**Purpose:** Provide a limited schedule/results view for supported leagues.

**How it works:** ESPN's public scoreboard endpoint is attempted; TheSportsDB is the fallback. The fallback explicitly labels schedule/results as not live scores.

**Primary files:** `nova-server.txt`.

**API:** Internal scoreboard connector through `POST /api/live`.

**Tests:** Provider self-test checks ESPN and TheSportsDB fallback behavior.

**Limits and cost:** ESPN integration is an unofficial endpoint with no commercial API licence established. TheSportsDB's free terms are limited to development projects and restrict app-store publication; paid service use requires attribution and artwork rights review. Not cleared for commercial production or reliable live scoring.

**In-app help (English):** “Schedules and results can be incomplete. This view is not a live-score guarantee.”

**इन-ऐप सहायता (Hindi):** “Schedule और results अधूरे हो सकते हैं। यह live-score की guarantee नहीं है।”

## 7. Research and Public Statistics

**Purpose:** Find research-paper metadata and selected public statistics/natural-event data.

**How it works:** OpenAlex and arXiv return paper records; World Bank returns selected indicators; USGS returns recent earthquake data; NASA EONET returns natural-event records; Wikimedia provides reference/current-events material.

**Primary files:** `nova-server.txt`.

**API:** Internal connectors through `POST /api/live`.

**Tests:** Provider self-test checks OpenAlex/arXiv, World Bank and USGS functions. Live licence verification and an evaluation benchmark are incomplete.

**Limits and cost:** arXiv metadata is CC0, but individual papers have separate licences and commercial projects should review arXiv API guidance. OpenAlex work-level licences vary and are not currently carried through the UI. World Bank API reuse is dataset-specific; some Bank-produced catalog datasets are CC BY 4.0, but not all API materials. USGS-authored data is public domain with attribution. NASA EONET terms need specific confirmation.

**In-app help (English):** “Use research and statistics as a starting point. Open the original source and verify its date and licence.”

**इन-ऐप सहायता (Hindi):** “Research और statistics को शुरुआती जानकारी मानें। Original source खोलें और तारीख व licence जाँचें।”

## 8. Image Studio

**Purpose:** Submit a prompt and receive an image asynchronously.

**How it works:** `POST /api/image` creates a process-local job and returns a job ID; `GET /api/image/status/:id` polls completion. The optional OpenAI image path is controlled by `ALLOW_PAID_IMAGE` and is false by default. Community providers are present in source.

**Primary files:** `nova-server.txt`, `nova-app.js`, `scripts/image-privacy.test.cjs`.

**API:** `POST /api/image`, `GET /api/image/status/:id`.

**Tests:** Image input validation; async job polling/local runtime smoke; dataset-sharing privacy test.

**Limits and cost:** Jobs are stored in process memory, not a durable queue. Three jobs per 10 minutes per user/IP and 80 in-memory jobs maximum. Pollinations commercial rights for the legacy endpoint are not verified; AI Horde output is model/licence-specific. Do not treat public/free image endpoints as commercial permission. Paid image generation remains disabled by default.

**In-app help (English):** “Describe the image you want. Availability depends on the configured image provider; do not submit private or sensitive content.”

**इन-ऐप सहायता (Hindi):** “जिस image की ज़रूरत है उसका वर्णन लिखें। उपलब्धता image provider पर निर्भर है; निजी या संवेदनशील सामग्री न भेजें।”

## 9. Voice Input / Speech-to-Text

**Purpose:** Convert supported audio input to text.

**How it works:** Browser capture is sent as raw audio to `POST /api/transcribe`. The server tries the configured primary LLM speech endpoint and then Groq if configured.

**Primary files:** `nova-server.txt`, `nova-app.js`, `.env.example`.

**API:** `POST /api/transcribe`.

**Tests:** Invalid/empty audio returns HTTP 400; provider configuration and bounded input tests.

**Limits and cost:** 8 MB request body maximum; provider-dependent language/model support; actual microphone capture on Android is not yet verified. Speech output (TTS) availability depends on the browser's speech synthesis support and device voices. Provider voice terms/data retention are not fully audited.

**In-app help (English):** “Allow microphone access and speak clearly. Check the transcript before sending.”

**इन-ऐप सहायता (Hindi):** “Microphone permission दें और स्पष्ट बोलें। भेजने से पहले transcript जाँचें।”

## 10. Account, Login and Optional Cloud Sync

**Purpose:** Allow users to create an account and optionally back up workspace data across devices.

**How it works:** Supabase Auth handles email/password sign-up, sign-in, password reset and confirmation. Cloud sync is OFF by default and requires explicit opt-in. Access tokens are attached to same-origin API requests; server verification is feature-gated.

**Primary files:** `nova-account.js`, `nova-business-cloud.js`, `nova-api-auth.js`, Supabase migrations and RLS tests.

**API:** Supabase Auth; `public.nova_user_workspaces` table for optional workspace backup.

**Tests:** Browser account flow, RLS integration, cloud-sync merge/conflict tests, API Auth middleware tests.

**Limits and cost:** Live email delivery, redirects, valid/invalid/expired Express tokens and two-account hosted isolation are not verified. Cloud backup stores up to 40 recent chats, up to 150 messages/chat, extracted document text, memory and custom instructions when enabled; image attachments are excluded. “Delete cloud backup” does not delete the Auth user or every data copy. Full account deletion/retention is incomplete.

**In-app help (English):** “Sign in to enable an account. Cloud sync stays OFF until you turn it on. Delete cloud backup removes only the saved workspace copy.”

**इन-ऐप सहायता (Hindi):** “Account इस्तेमाल करने के लिए sign in करें। Cloud sync तब तक बंद रहता है जब तक आप चालू न करें। Delete cloud backup केवल saved workspace copy हटाता है।”

## 11. Installable PWA and Offline Shell

**Purpose:** Install NOVA on supported devices and cache the app shell for quicker repeat visits/offline loading.

**How it works:** Express serves a manifest, icons and service worker. The service worker caches same-origin static GET assets and does not cache API routes or the entry video.

**Primary files:** `nova-server.txt`, `index.html`, `sw.js` route, manifest and icon routes.

**Tests:** Local runtime smoke, Docker health smoke, Browser/Playwright viewport and PWA checks.

**Limits and cost:** Offline cache is an app-shell fallback, not offline AI or guaranteed offline data. Real Android install, update lifecycle, storage pressure and low-data testing remain incomplete.

**In-app help (English):** “Install NOVA from your browser menu. Offline access is limited to cached app files.”

**इन-ऐप सहायता (Hindi):** “Browser menu से NOVA install करें। Offline access केवल पहले से cached app files तक सीमित है।”

## 12. NOVA Business Intelligence / Company Cloud Preview

**Purpose:** Provide a synthetic-data preview of business analytics workflows such as cost analysis, CSV validation, project and workflow insights, audit evidence and white-label metadata.

**How it works:** Browser modules process validated datasets and call the authenticated Supabase Edge Function for tenant-scoped operations. RLS and server-side checks protect tenant data.

**Primary files:** `nova-business-core.js`, `nova-business.js`, `nova-business-cloud.js`, `supabase/functions/nova-bi-api`, migrations and tests.

**API:** Supabase Edge Function `nova-bi-api`; public database tables protected by RLS.

**Tests:** PostgreSQL migration/RLS integration, Deno type-check and function tests, deterministic synthetic demo data, CSV validation, calculation and portable Action Proof tests.

**Limits and cost:** Preview only. Use synthetic demo data; do not submit confidential, employee, student, regulated or customer data. Risk scores are heuristic, proof bundles are not signed digital attestations, and live customer/tenant isolation tests remain incomplete. Durable consumer quotas and BI deletion/retention are separate work items.

**In-app help (English):** “Use synthetic demo data to explore the preview. Do not upload confidential or personal company data.”

**इन-ऐप सहायता (Hindi):** “Preview देखने के लिए synthetic demo data इस्तेमाल करें। Confidential या personal company data upload न करें।”

## Cross-feature production requirements

- Provider commercial use, caching, attribution, data processing, retention and transfer rights must be cleared before production use.
- Durable per-user quotas, monthly usage accounting, plan entitlements, provider spend caps, alerts and cache-only mode are not implemented.
- Staging currently has no AI provider key/model configured; `/api/config` returned HTTP 503 in the external smoke test.
- API Auth remains disabled in Staging. All paid or customer-facing actions remain NO-GO.
- Physical Android, microphone, backup/restore, monitoring/SLO, load/soak, rollback and legal review remain incomplete.
