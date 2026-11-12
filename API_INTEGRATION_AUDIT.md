# NOVA API & Third-Party Integration Audit

Audit date: 12 November 2026 (Asia/Kolkata)
Audited revision: PR #98 branch, current audit pass includes timezone, provider HTTP hardening, finance-relay removal and npm licence inventory; verify the exact current SHA on PR #98 before release
Scope: static source/configuration inventory plus public vendor-documentation review. This is **not** proof that credentials are valid, an integration is live, or commercial rights have been granted.

## Executive decision

**API audit: NOT PASSED — release blocked.** The code contains a broad set of live-data connectors and fallbacks, but several are undocumented/community endpoints, free-tier or non-commercial services, or lack verified transfer/resale rights. No vendor credentials or account dashboards were inspected. Do not add paid credentials, accept customers, or represent any API integration as commercially cleared until the owner/account holder completes the checks below and an appropriate adult/qualified reviewer confirms the relevant contracts.

## Server-side environment variables

The checked-in `.env.example` declares these variables (values are blank or safe defaults; no secret values were inspected):

- LLM: `LLM_KEY`, `LLM_MODEL`, `LLM_BASE`, `LLM_FALLBACK_MODELS`, `LLM_VISION_MODEL`
- Groq: `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE`, `GROQ_VISION_MODEL`
- OpenRouter: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE`, `OPENROUTER_VISION_MODEL`
- Search: `TAVILY_KEY`, `BRAVE_KEY`
- Speech: `STT_MODEL`, `STT_OFF`
- Image: `IMAGE_OFF`, `ALLOW_PAID_IMAGE`, `IMAGE_KEY`, `IMAGE_MODEL`, `IMAGE_BASE`, `POLLI_KEY`, `HORDE_API_KEY`, `HORDE_BASE`
- Diagnostics: `SELFTEST_ON_START`, `LIVE_SELFTEST_ENABLED`

Supabase project URL and browser client setup are present in the frontend/account modules. No Supabase service-role secret is declared in the public example. Credential validity, owner identity, project billing, project region, data-processing terms, Auth email settings and Edge Function deployment were not verified.

## Integration inventory

| Capability | Providers / code path | Fallback or current behavior | Audit result |
|---|---|---|---|
| Text AI | OpenRouter-compatible `LLM_BASE`; Groq; OpenRouter dedicated config | Tries configured providers/models in sequence; no provider means chat returns 503 | Credentials/model IDs unverified. OpenRouter free router is quota-limited; not a production capacity plan. |
| Vision AI | Configured vision model on primary, Groq or OpenRouter | No vision provider means unavailable | Model compatibility and image data retention terms unverified. |
| Speech-to-text | Primary OpenAI-compatible endpoint and Groq transcription endpoint | Tries configured provider(s) and Whisper model variants | Requires provider keys; current runtime result and audio retention terms unverified. |
| Web search | Brave Search API, Tavily | DuckDuckGo HTML and Wikipedia search race as fallback | Primary commercial terms and account quotas must be checked. DuckDuckGo HTML is not a contracted search API. |
| News / feeds | Google News RSS, GDELT, publisher RSS feeds (BBC, Al Jazeera, NPR, DW, UN, The Hindu, NDTV, Indian Express, Times of India, PIB, BBC Hindi, Navbharat Times, TechCrunch, The Verge, Ars Technica, MIT Technology Review, ScienceDaily, Nature, NASA, Phys.org, CNBC, Economic Times, Mint, ESPN, ESPNcricinfo, WHO, OpenAI, Google, NVIDIA, Microsoft, Apple, Hugging Face and others) | Per-category feed aggregation and cached results; GDELT failure can fall back to Google News RSS | Publisher feed availability is not a content-republication licence. Keep excerpts short, link to source, preserve attribution, and obtain rights review before commercial redistribution. |
| Weather / air quality | Open-Meteo geocoding, forecast and air-quality APIs | wttr.in weather fallback | Open-Meteo explicitly limits free API use to non-commercial use; commercial use requires a subscription/licence. wttr.in is a public service without verified commercial licence, quota or SLA. Current implementation is not cleared for monetized use. |
| Time | Server clock + validated IANA timezone formatting; optional geocoded place | Asia/Kolkata fallback for invalid/missing timezone | Chat now accepts the browser's IANA timezone and injects local date/time plus UTC timestamp. The `tz` metadata is removed before the upstream model request. Automated unit coverage exists; full live-provider and physical-device verification remain pending. |
| Finance / markets | Yahoo Finance chart endpoints (unofficial preview only), CoinGecko, Coinbase Exchange public market data, Frankfurter FX | CoinGecko/Coinbase and Frankfurter routes are present | Yahoo Finance endpoint is undocumented and Yahoo's published guidelines restrict some services from commercial/monetized use. Do not rely on Yahoo endpoints for a paid product. CoinGecko public rate varies (5–15 calls/min); Demo is 100 calls/min. Confirm exact plan, attribution, caching and redistribution rights. |
| Sports | ESPN public site API endpoints; TheSportsDB free v1 key `123` | TheSportsDB fallback for supported leagues | ESPN endpoint is not a documented licensed API and prior server tests returned 403. TheSportsDB free API is documented for development; its terms say app-store publishing requires paid membership and third-party artwork has separate rights. Not commercially cleared. |
| Research / reference | arXiv API, OpenAlex, Wikipedia/Wikimedia | arXiv + science RSS fallback for OpenAlex | Preserve source metadata/attribution; check dataset/API terms and rate limits before bulk use. |
| Natural events | USGS earthquake feed; NASA EONET | No guaranteed equivalent fallback identified | Public data feeds; validate freshness, attribution and uptime. |
| Image generation | Pollinations public endpoint, AI Horde keyed fallback; optional paid OpenAI-compatible image endpoint | Free/community providers first; paid image path requires `ALLOW_PAID_IMAGE=true` plus key/model | Pollinations terms, prompt retention and output rights remain unverified. AI Horde fallback now requires an operator-provisioned API key and sends `shared:false` to opt out of LAION dataset sharing; prompts are still sent to third-party workers and are not private from the provider. Paid path must remain disabled unless separately approved. |
| Accounts / optional cloud sync | Supabase Auth, Postgres `nova_user_workspaces`, NOVA BI Edge Function | Local-first workspace remains available; cloud sync is opt-in | RLS integration tests exist, but live Auth email, production Edge Function auth/CORS, data residency, retention and deletion are not verified. |
| Browser assets | jsDelivr Supabase JS CDN, Google Fonts, other CDN assets | Browser may rely on network/CDN availability | Pinning/integrity, availability, privacy and third-party asset licence inventory remain to be completed. |

## Current controls observed in code

- Provider keys are read from server environment variables; configured provider base URLs are validated as HTTPS in production and reject embedded credentials, query strings and fragments. The general `lhttp()` connector now rejects non-HTTPS/IP-literal/local-style/single-label hosts, limits redirects to the original hostname, and bounds streamed response bodies to 3 MiB.
- Express applies a process-local per-IP limit of 60 requests/minute to `/api/*` before JSON parsing; JSON body limit is 6 MB. This limit resets on process restart and does not provide durable per-user quotas or a monthly spend cap.
- Live retrieval has an additional process-local per-IP limit of 24 requests/minute and a concurrency cap.
- Image generation has a separate limit of 3 requests per IP per 10 minutes and a bounded in-memory queue. Image job state is process-local and not durable across restarts.
- Provider-backed AI chat and speech routes are unauthenticated at the Express layer. This is a release blocker before any billable provider key is enabled for public traffic.
- The general `lhttp()` path now has bounded streaming reads, and direct speech/image provider responses have explicit response-size caps. LLM streaming remains intentionally streamed to the client; apply output-token/time limits and client-abort propagation in the remaining API hardening pass.
- OpenRouter free-model use is subject to upstream daily/minute limits. A free-tier account has no OpenRouter spend-control features; paid model requests can incur per-token charges.
- Vendor rate limits and error fallbacks do not replace a hard product-side usage budget.

## Public vendor facts checked on 12 November 2026

- OpenRouter Free lists 25+ free models and a 50 requests/day plan limit; free model variants are capped at 20 requests/minute and 50/day (or 1,000/day after at least $10 of credits are purchased). Free tier does not list budget/spend controls. Source: https://openrouter.ai/pricing and https://openrouter.ai/collections/free-models/
- Brave Search lists $5 per 1,000 Search API requests and $5 monthly credits; it is prepaid and requires a card verification step to access credits. Source: https://brave.com/search/api/ and https://api-dashboard.search.brave.com/documentation/pricing
- Tavily lists 1,000 API credits/month on its free plan and $0.008 per credit pay-as-you-go. Source: https://www.tavily.com/pricing
- Open-Meteo's free API terms explicitly restrict use to non-commercial purposes and set fair-use limits (10,000/day, 5,000/hour, 600/minute); a website/app with subscriptions or advertising is classed as commercial. Its Standard, Professional and Enterprise plans advertise 1M, 5M and 50M+ calls/month, but the public pricing page does not show a numeric price. Its subscription licence is expressly non-transferable; a buyer should obtain a fresh licence/account. Data is CC BY 4.0 and requires attribution. Sources: https://open-meteo.com/en/terms, https://open-meteo.com/en/pricing and https://open-meteo.com/en/license
- CoinGecko public API is documented at 5–15 calls/minute depending on global usage; Demo plan advertises 100 calls/minute. Sources: https://support.coingecko.com/articles/5125303456-what-is-the-rate-limit-for-coingecko-api-public-plan and https://www.coingecko.com/en/api/pricing
- TheSportsDB free API documentation states 30 requests/minute for the shared v1 key. Its terms restrict free use to development projects and require paid membership for app-store publication; third-party artwork rights are separate. Sources: https://www.thesportsdb.com/API.php and https://api.thesportsdb.com/docs_terms_of_use.php
- Yahoo's published Developer Network Guidelines prohibit commercial/monetized use for services designated non-commercial. The exact Yahoo Finance endpoint used by NOVA is not a documented supported API, so its rights remain unverified. Source: https://legal.yahoo.com/us/en/yahoo/guidelines/ydn/index.html
- Groq documents organization-level model rate limits and a Developer paid tier with billing/spend limits; those spend controls are a paid-tier feature. Groq's current Services Agreement says Cloud Services/AI Model Services are not for consumer use and restricts resale/transfer of its services/API credentials. A buyer must obtain their own eligible provider account and key; NOVA cannot promise transfer of a Groq key. Sources: https://console.groq.com/docs/rate-limits, https://console.groq.com/docs/spend-limits, https://console.groq.com/docs/legal/services-agreement

## Release blockers and required actions

1. **Authentication / abuse control:** authenticate public chat, speech and other billable endpoints; enforce durable per-user quotas, per-provider budgets, concurrency limits and emergency kill switches. Test spoofed IP/proxy behavior and process restarts.
2. **Commercial rights:** replace or license Open-Meteo free-tier use before monetization; obtain approved commercial rights for sports, finance, news/feed excerpts and image providers. Do not use an undocumented endpoint as a critical paid data source.
3. **Provider account validation:** an eligible account holder must privately verify each configured key, model ID, quota, region, billing state, retention policy, commercial use and transfer limitations. Never send secrets in chat or commit them.
4. **Time/location correctness:** use explicit user timezone and permission-based location; avoid assuming every user is in IST. Include observation/retrieval timestamp and source in all live-data answers.
5. **Evidence:** run controlled staging tests for every configured provider and record status, latency, source freshness, rate-limit behavior, fallback behavior and cost. A successful CI fixture is not a live vendor test.
6. **Transferability:** document that API keys are not transferred to a buyer; the buyer must create their own vendor accounts and reconfigure keys. Confirm each vendor's current terms at handover.

## Not yet verified

- Any provider key's validity, ownership, balance, billing, exact per-model price or account quota.
- Commercial redistribution and sublicensing rights for all news publishers, sports logos/photos, market data, AI model outputs and image outputs.
- Data-processing agreements, retention/deletion settings, subprocessors, region and breach notification obligations for every vendor.
- Actual live provider latency and fallback success from the current Staging revision.
- Whether any user-provided location/timezone is requested with a sufficiently clear consent mechanism.
- Whether a buyer can legally assume any existing third-party contract. Do not represent provider credentials or subscriptions as transferable assets.


## Additional terms review — 12 November 2026

- Open-Meteo's terms classify apps with subscriptions or advertisements as commercial, even if the API calls are low volume. Free tier is therefore unsuitable for a monetized Nova product. The API subscription is a limited, non-exclusive and non-transferable licence; handover requires the buyer to obtain its own licence. The published page currently describes monthly call budgets but no numeric subscription price, so no cost estimate is claimed.
- TheSportsDB's terms explicitly say API resale requires specific permission. Paid membership for app-store publishing does not grant third-party artwork rights. Treat the current free v1 key as development-only and do not ship it as a commercial resale dependency.
- Groq's Services Agreement includes an 18+ eligibility condition and non-consumer restriction. Account credentials/services are not freely transferable; assignment in a sale of substantially all business is subject to notice and the assignee accepting the agreement. This must be reviewed by an eligible adult account holder and qualified counsel; no minor should create or accept a Groq account.
- Yahoo's guidelines vary by API. They restrict some non-commercial services from being used in subscription, ad-supported, SaaS or paid applications. Because Nova's Yahoo Finance chart endpoint is not a documented Yahoo API, there is no evidence that this particular endpoint has commercial permission. Replace it with a documented licensed provider or remove it from any commercial path.
- Open-Meteo source code is AGPL-3.0, while its weather data is CC BY 4.0. Nova currently calls the hosted API and does not include the Open-Meteo server source in its dependency tree. Do not copy/self-host or modify its server without a separate AGPL compatibility review. API data still needs attribution.
- The uncontracted `proxy.cors.dev` Yahoo relay was removed from the code. Direct Yahoo chart endpoints remain undocumented/unofficial and are not approved for a monetized or buyer-transfer release; remove or replace that path with a documented licensed market-data API before commercial launch.
- `lhttp()` now accepts HTTPS URLs only, rejects URL credentials, IP-literal/local/private-style hostnames and non-443 ports, restricts redirects to the original hostname (maximum 3), blocks redirects for non-GET requests, and reads response bodies as a bounded stream (3 MiB) before buffering. Unit tests were added; await current CI before counting them as passed. DNS resolution rebinding and non-`lhttp` outbound requests remain separate review items.
