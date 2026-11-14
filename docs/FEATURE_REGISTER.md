# NOVA AI — Feature Register

**Updated:** 14 November 2026 (Asia/Kolkata)  
**PR:** #98 — Open / Draft / unmerged  
**Branch:** `fix/nova-home-learn-first-mobile-20261109`  
**Evidence head:** `7e816af473d29f9dd2e1d4cab775cb905f1a82fe`  
**Purpose:** conservative release inventory. This file maps the machine-readable source inventory in `FEATURE_REGISTRY.json` to the delivery statuses required by the master build protocol.

## Status rules

- **PLANNED:** not implemented in the repository as a complete feature.
- **RESEARCHED:** source/rights/approach reviewed, but no complete end-to-end feature is claimed.
- **BUILT:** code or preview implementation and relevant automated contract tests exist; this does not mean LIVE.
- **VERIFIED:** acceptance criteria passed end-to-end on the deployed Staging/Production environment with evidence.
- **LIVE:** verified in the intended production environment with rights, privacy, reliability, cost and operations cleared.
- **BLOCKED-OWNER:** implementation or preview exists, but a required adult operator/vendor permission, server key, legal clearance or device-only check is outstanding.

No feature below is marked VERIFIED or LIVE. Main CI passing is not equivalent to an AI provider returning a real answer.

## Current inventory

| Feature | Delivery status | Source and test inventory | Evidence / blocker |
|---|---|---|---|
| AI Chat | BLOCKED-OWNER | `index.html`, `nova-app.js`, `nova-server.txt`; tests: `scripts/runtime-smoke.mjs`, `scripts/api-auth.test.cjs` | Chat route and failover contracts exist; Staging has no confirmed provider-backed response. Adult/vendor action: legally eligible operator must review and configure a suitable provider privately. |
| Live Search | BLOCKED-OWNER | `nova-server.txt`, `nova-search-router.js`; tests: `scripts/search-router.test.cjs`, `scripts/runtime-smoke.mjs` | Sequential routing exists and is unit-tested. Tavily/Brave are not configured; keyless GDELT metadata fallback exists but no authenticated live search is verified. |
| News and Daily Feeds | BLOCKED-OWNER | `nova-server.txt`, `nova-app.js`; tests: `scripts/runtime-smoke.mjs` | Feed surface is present but publisher redistribution rights are not cleared; keep disabled until publisher-specific permission and attribution are documented. |
| Weather and Air Quality | BLOCKED-OWNER | `nova-server.txt`; tests: `scripts/runtime-smoke.mjs` | Public free endpoints are disabled where commercial rights are not established; a permitted source and terms review are required. |
| Finance, Crypto and Currency References | BLOCKED-OWNER | `nova-server.txt`; tests: `scripts/market-data-policy.test.cjs` | Unlicensed market/crypto/currency endpoints fail closed; licensed, dataset-specific access is not approved. |
| Sports Schedules and Scoreboards | BLOCKED-OWNER | `nova-server.txt`; tests: `scripts/runtime-smoke.mjs` | Unofficial or development-only feeds are disabled; commercial rights and data display rules remain unresolved. |
| Research Metadata and Public Statistics | RESEARCHED | `nova-server.txt`; tests: `scripts/runtime-smoke.mjs` | OpenAlex/arXiv metadata and USGS source-credit handling have source-level safeguards. Dataset/work-level rights and live output still need verification. |
| Image Studio | BLOCKED-OWNER | `index.html`, `nova-app.js`, `nova-server.txt`; tests: `scripts/image-privacy.test.cjs`, `scripts/runtime-smoke.mjs`, `scripts/feature-fallbacks.test.cjs` | Image UI is capability-gated. Server provider flags are default-off; no live generation was verified and the in-memory job path is not a durable queue. |
| Voice Input / Speech-to-Text | BLOCKED-OWNER | `index.html`, `nova-app.js`, `nova-server.txt`; tests: `scripts/api-auth.test.cjs`, `scripts/runtime-smoke.mjs` | STT route and fallback messaging exist; no provider is configured and physical Android microphone/language tests remain outstanding. |
| Accounts and Optional Cloud Sync | BUILT | `nova-account.js`, `nova-api-auth.js`, `nova-sync-merge.js`; tests: `scripts/api-auth.test.cjs`, `scripts/cloud-sync-merge.test.cjs`, `scripts/company-cloud-browser.mjs` | Browser CI covers account/privacy/opt-in sync and server auth rejects invalid credentials; valid hosted sessions, email/redirect and account deletion remain unverified. |
| Installable PWA and Offline Shell | BUILT | `index.html`, `nova-server.txt`; tests: `scripts/runtime-smoke.mjs`, `scripts/browser-smoke.mjs` | PWA app-shell source exists and browser/mobile tests pass; offline AI is not supported and physical install/update testing remains outstanding. |
| NOVA Business Intelligence / Company Cloud Preview | BUILT | `nova-business-core.js`, `nova-business.js`; tests: `scripts/business-intelligence.test.cjs`, `scripts/company-cloud-browser.mjs`, `scripts/demo-data.test.cjs` | Synthetic-data calculations, RLS/Edge Function auth and browser workflows pass CI; preview only, not a production-ready customer data service. |
| Code Workspace and Isolated Sandbox | PLANNED | `index.html`, `nova-app.js`; tests: `scripts/browser-smoke.mjs` | No isolated code-execution sandbox or secure runtime is implemented. |
| Standalone Prompt Studio | PLANNED | `index.html`, `nova-app.js`; tests: `scripts/browser-smoke.mjs` | No separately verified Prompt Studio workflow exists; prompt-writing currently routes as bounded chat assistance. |
| NOVA Build App and Website Generator | PLANNED | `index.html`, `nova-app.js`; tests: `scripts/browser-smoke.mjs` | No complete plan/files/live-preview/chat-edit/export/publish pipeline is evidenced. |
| Multi-step Task Agents and Scheduled Alerts | PLANNED | `index.html`, `nova-app.js`; tests: `scripts/browser-smoke.mjs` | No durable queue, stop/resume runtime or scheduled task engine is evidenced. |
| PDF, Word, Excel and Slides Export Generator | PLANNED | `index.html`, `nova-app.js`; tests: `scripts/runtime-smoke.mjs` | No end-to-end Devanagari-safe PDF/DOCX/XLSX/Slides export suite is evidenced. |
| Free and Pro Plans, Credits and Checkout | PLANNED | `index.html`, `nova-server.txt`; tests: `scripts/runtime-smoke.mjs` | No durable consumer credits/entitlements, payment gateway, signed webhook/reconciliation, refund or invoice flow is implemented. |
| AI Provider Failover and Circuit Control | BUILT | `nova-server.txt`, `nova-llm-router.js`, `nova-provider-quality.js`, `provider-quality-evidence.json`, `nova-quality-route.js`, `nova-app.js`, `index.html`; tests: `scripts/llm-router.test.cjs`, `scripts/provider-quality.test.cjs` | Primary OpenAI-compatible, Groq and OpenRouter adapters are present; optional Cloudflare is default-off and restricted to selected routes. Mocked failure/circuit tests pass; four-company equal-tier production parity and live calls do not. |
| Central Request Orchestrator | BUILT | `nova-orchestrator.js`, `nova-server.txt`; tests: `scripts/orchestrator.test.cjs` | Intent classifier is integrated and tested; it is not a full execution engine for deep research, documents, Build or Agent. |

## Release-level blockers

1. Exact-head Main and Browser CI pass, but Main CI's live provider and free-image smoke steps were skipped.
2. Render Staging is Live on the evidence head, but its HTTP Health Check Path is blank. Configure `/health` in the Render Dashboard.
3. Staging runtime reports authentication REQUIRED; invalid/missing-token tests pass, but valid/expired Supabase sessions, confirmation/reset emails, redirect allow-list and two-account isolation remain unverified.
4. No suitable model/search provider has completed live authenticated Staging testing. Keys must be managed privately by a legally eligible adult who confirms provider terms for this student-facing product.
5. No durable consumer usage ledger, hard per-user/global rupee spend cap, predictive quota control, plans, payment checkout or reconciliation exists.
6. Full account deletion/retention, physical Android camera/gallery/microphone, backup/restore, load/soak, monitoring/SLO, incident/rollback and legal/privacy/IP reviews remain open.

## Owner-only actions

- Render Dashboard → Staging service → Settings → Health Checks → Edit → `/health` → Save Changes.
- A legally eligible adult must review provider terms and privately configure any permitted provider account/key. Do not paste credentials into ChatGPT or commit them to the repository.
- Physical camera/gallery/microphone checks require the actual Android handset.

## Machine-readable source of truth

`FEATURE_REGISTRY.json` is still the machine-readable implementation inventory and its contract is tested by `scripts/feature-registry.test.cjs`. That test is a static inventory check; runtime feature-flag wiring, pricing-page generation and end-to-end truth enforcement are currently `false`. Keep both files aligned whenever a feature status changes.
