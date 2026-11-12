# NOVA Status — Acquisition Readiness

Last updated: 12 November 2026 (Asia/Kolkata)
Repository: https://github.com/s85960833-byte/NovaAI
Production URL: https://novaai-4auo.onrender.com
Production branch: main
Current candidate: PR #98 — fix/nova-home-learn-first-mobile-20261109
Candidate code head audited: 5176c0e57cff1cc3e6c7bf418bad2b1e6b7ac97c
Latest API-audit documentation commit: a5d621da59635a087b446bc12f49398a19d261c8

## Done (evidence-backed)
- PR #98 remains open, Draft, and unmerged. GitHub currently reports it mergeable; production main remains unchanged by this candidate.
- Main verification run 43194899049 and rerun 43195092459 passed on functional candidate 059d6fa. Browser verification runs 43194899149 and 43195092562 passed on that same candidate.
- Both workflows passed on documentation/status candidate 5176c0e (main 43195438932; browser 43195439000). A later rerun on 5176c0e: browser 43195643483 passed; main 43195643405 was still in progress at the last check.
- New API integration inventory and vendor-terms review added as API_INTEGRATION_AUDIT.md in commit a5d621d. Latest commit's Main run 43195820427 is pending and Browser run 43195820563 is in progress; do not count these as passed.
- Five Chromium viewport screenshots were previously inspected: 360x800, 390x844, 412x915, 760x1024 and 1280x800. This is browser emulation, not physical Android certification.
- .env.example exists; .gitignore excludes local env/secrets and common credential files. The active runtime is Node.js 22 with start command node nova-server.txt.
- Privacy Notice and Terms drafts exist and explicitly disclose incomplete controls; they are not final legal documents.
- PostgreSQL tenant-RLS tests, Deno type checks, browser/account flows, Company Cloud mobile tests, provider configuration, rate-window tests, provider URL validation tests and the 60-case AI evaluation fixture passed in recorded candidate CI runs.

## Phase 1 audit findings (static inspection; not a complete runtime audit)
- Active backend declares 28 Express routes across config, chat, search, image, voice transcription, live data, feeds and static/PWA assets.
- Main frontend is index.html plus modular browser scripts. The HTML has a viewport meta tag and English document language, but no description meta tag, canonical URL or H1 was detected.
- Static scan found 49 buttons and 13 inputs; all 13 inputs had a nearby/explicit label attribute. Only 21 buttons had an aria-label/title attribute; text-labelled buttons may still be accessible, so a rendered accessibility audit remains required.
- No privacy/terms link or consent UI was detected in the main HTML. This is not proof no scripted controls exist; verify rendered app and actual storage/cookie use before implementing consent UI.
- Backend security controls include baseline headers/CSP, a per-IP in-memory API throttle, a 6 MB JSON body limit, /health, and HTTPS/credential/query/fragment validation for configured provider base URLs. CSP still allows inline styles and broad HTTPS connections.
- General /api routes, including AI chat and speech transcription, are not authenticated in the Express server. The current global limit is 60 requests/minute per IP and is in-memory; it resets on process restart and is not a durable per-account quota. Live retrieval has a separate 24/minute per-IP limit; image generation has 3 per 10 minutes. Do not configure a paid provider key or expose a billable provider until authentication/abuse controls and hard spend limits are designed and tested.
- API integration audit is now documented in API_INTEGRATION_AUDIT.md. It identifies commercial-use/terms risks for Open-Meteo free tier, Yahoo Finance's undocumented endpoint, ESPN's undocumented endpoint, TheSportsDB free API and publisher RSS reuse. Vendor key validity, exact account quotas and transfer rights remain unverified; overall API audit is NOT PASSED.
- Account cloud sync is OFF by default and requires explicit opt-in. The confirmation explains that up to 40 chats (up to 150 messages each), extracted document text, saved memory and custom instructions may be synced; image attachments are excluded. The table is protected by per-user RLS. Turning sync off stops future sync but does not delete the cloud copy; the separate delete-backup control removes that row.
- Self-service account deletion and a published retention schedule are not implemented. The draft Privacy Notice correctly treats this as a launch blocker.
- Company Cloud Edge Function enforces authenticated user context, configured-site CORS, bounded JSON request bodies, per-user API/invitation rate limits and membership checks. Live deployed Edge Function auth/CORS and email delivery remain unverified.
- Package-lock metadata scan showed a small dependency graph with declared MIT/ISC/BSD-3-Clause/Apache-2.0 licenses. This remains a preliminary metadata scan, not a full source/provenance/legal license audit.
- No root Dockerfile, full product architecture guide, dependency license report, backup/restore guide, alternative-host guide, Transfer Pack or Data Room index has yet been completed.

## In progress
- Phase 1 total audit: repository inventory, security, routes, UI states, accessibility, performance, SEO, data flows, integrations, live deployment and operational controls.
- Full dependency/source/asset provenance and license audit.
- Ownership, IP assignment and transferability evidence audit.
- Product positioning and defensible differentiation research.

## Next
1. Finish current candidate CI rerun and record its exact result.
2. Bring the PR description and README evidence references into alignment with current candidate SHA and CI runs.
3. Continue reviewing every Express route, browser module, SQL migration, Edge Function, CI workflow and external integration.
4. Complete dependency/license and third-party asset provenance checks.
5. Verify latest-head Staging deploy SHA and smoke tests; do not infer live state from branch CI.
6. Build portable setup, Docker, deployment/backup/restore and transfer documentation only after validating actual runtime requirements.
7. Research competitors and user pain points before claiming uniqueness or pricing.

## Blocked / owner-dependent
- Staging still serves old commit 195739a04895de364a5af22aa61f930d5d782cbb, not candidate head a5d621da59635a087b446bc12f49398a19d261c8. Render Health Check Path is blank; owner must set /health in the existing Staging Dashboard and deploy latest commit there.
- Live AI Chat testing requires a permitted server-side provider key and explicit model in existing Staging Environment. Never share secrets in chat or commit them. Use only provider terms/age-eligible access and no paid credits.
- Physical Android full-width layout, touch, drawer and real microphone capture require the actual handset.
- Real Auth confirmation/reset email, two-device sync, account deletion/retention, live image generation and third-party provider checks remain incomplete.
- Account ownership, legal operator details, support contact, retention schedule, age/consent policy and IP assignments require owner evidence/decisions and qualified review.
- No real customer/revenue/traction evidence has been supplied; do not claim traction or a ₹10–20 crore valuation.

## Decisions / release gates
- Existing repository and production URL only; no new repo, fork or replacement deployment.
- Production main and live URL are protected. No merge/deploy until rollback, latest-head staging, live smoke, physical-device and release checks pass.
- No paid services/APIs or credits without explicit approval.
- No fabricated users, testimonials, revenue, analytics or exclusivity claims.
- NOVA BI remains a preview; use synthetic data only.
- Candidate CI success does not equal production readiness.
- Acquisition value ₹10–20 crore is a target, not a present valuation or guarantee.

## Current readiness snapshot
- Candidate main CI: PASS on runs 43194899049 and 43195092459 for 059d6fa; PASS on 5176c0e run 43195438932; rerun 43195643405 was still in progress at last check; latest audit-doc run 43195820427 pending.
- Candidate browser CI: PASS on 43194899149 and 43195092562 for 059d6fa; PASS on 5176c0e runs 43195439000 and 43195643483; latest audit-doc run 43195820563 in progress.
- Staging latest-head verification: BLOCKED.
- Physical Android: NOT VERIFIED.
- Provider-backed live AI: NOT VERIFIED.
- Account deletion/retention and final legal policies: INCOMPLETE.
- Ownership/IP transferability and traction evidence: INCOMPLETE.
- Overall acquisition readiness score: NOT YET SCORED; baseline evidence collection is underway.


## API terms follow-up — 12 November 2026

- Updated API_INTEGRATION_AUDIT.md with official terms checks: Open-Meteo free tier is non-commercial; its paid API subscription licence is non-transferable; TheSportsDB prohibits API resale without specific permission; Groq requires users to be 18+ and has restrictions on transfer/assignment; Yahoo Finance endpoint rights remain undocumented.
- Open-Meteo public prices were not numerically published on the page reviewed; only call-volume tiers are listed. No unsupported price estimate was inserted.
- Current API audit remains NOT PASSED. No keys, paid services, or accounts were created or modified.
- Latest known CI for branch head before this documentation update: main run 43195860425 and browser run 43195860522 were still in progress. The new documentation commit must receive fresh CI before being counted as passed.
- PR remains Draft and unmerged; Staging remains on 195739a; Health Check Path remains blank. Production unchanged.

## Current continuation point

Done: initial source inventory; code-level route/provider/security review; initial API inventory; vendor terms follow-up; API_INTEGRATION_AUDIT.md.
In progress: full frontend/accessibility/mobile audit; provider commercial suitability; account deletion/retention design; staging verification; physical Android verification.
Next: verify CI on latest head, complete page and component inventory, review every dependency/license and external asset, document exact blockers, then prepare only safe changes with tests.
Blocked: owner-side Render health path and staging deploy; real device/microphone test; private provider account validity and legal eligibility/consent checks.
Decisions: no Production merge/deploy; no paid API spend; no new repository or deployment URL; do not enable billable public APIs before durable quotas and vendor rights are established.


## Outbound network review — 12 November 2026

- Reviewed all server `lhttp()` call sites in `nova-server.txt`. This pass found fixed provider URLs and query-encoded user search/place terms; no direct arbitrary user-supplied URL fetch parameter was identified in these call sites.
- Defense-in-depth gap: `lhttp()` follows redirects without restricting destination host/protocol, and buffers response text before checking the 3 MB limit. Treat SSRF/response-memory protection as incomplete until redirects are constrained and response reads are bounded while streaming.
- Finance fallback uses `proxy.cors.dev` to relay a Yahoo Finance chart endpoint after upstream errors. This adds an uncontracted intermediary and does not establish commercial rights; documented as a commercial release blocker in API_INTEGRATION_AUDIT.md.
- Weather fallback `wttr.in` has no verified commercial licence, quota or SLA in this audit. It is not approved for monetized use.
- No production code changed in this review step; audit documents only.
- API audit remains NOT PASSED. No paid accounts, keys or services were activated.


## Per-user timezone improvement — 12 November 2026

- Added `nova-timezone.js` with IANA timezone validation and safe IST fallback.
- `nova-app.js` now sends the browser's configured IANA timezone with AI chat requests (not GPS/location).
- `nova-server.txt` injects the validated local date/time, timezone name and UTC timestamp into the system context.
- Added `scripts/timezone.test.cjs`, `npm run test:timezone`, and a CI step in the main verification workflow.
- Exact timezone unit test source was independently executed with Node 22 in a clean temporary directory: 4 tests passed, 0 failed. GitHub CI for latest branch head `5d2978b` was still running at last check; this local test does not replace the full workflow.
- Live Search already receives browser timezone; this closes the mismatch between Live Search and ordinary chat. The app continues to use the user's saved city preference for weather; no precise GPS location is sent.
- No Production or Staging deploy has occurred. Latest Staging revision remains `195739a`; Production remains unchanged.


## Continued audit — 12 November 2026

- Latest successful browser workflow for candidate head `6a33298`: run 43196389896 passed. Main workflow for that head was cancelled by a subsequent push before completion; do not count its main suite as passed.
- Added `DEPENDENCY_LICENSE_AUDIT.md`: all 72 locked npm package records and their lockfile-declared licences are listed. Counts: MIT 66, Apache-2.0 3, ISC 2, BSD-3-Clause 1; no missing licence metadata and no GPL/AGPL identifiers in the npm lockfile. This is only npm lock metadata, not full code/asset/Deno legal clearance.
- Added `nova-http.js` and hardened `lhttp()`: outbound provider requests now require HTTPS public hostnames, disallow URL credentials, IP-literal/localhost/private-style hostnames and non-443 ports, restrict redirects to the original host, limit redirects to 3, block redirected non-GET requests, and stream response bodies with a 3 MiB cap before buffering. This addresses the previously documented redirect and late-size-check weaknesses for this helper's call sites; DNS resolution rebinding and non-`lhttp` fetches remain separate review items.
- Added `scripts/provider-http.test.cjs` and CI command to test unsafe URLs, cross-host redirects and response size limits. These tests are not yet counted as passed until the latest GitHub workflow completes.
- Fixed chat timezone metadata: NOVA consumes `body.tz` to build local date/time context and deletes it before forwarding the model request, avoiding a non-standard provider payload field.
- Staging remains on old SHA `195739a`; no Staging or Production deploy was made. PR remains Draft and unmerged.


## Latest code/security work — 12 November 2026

- `API_INTEGRATION_AUDIT.md` corrected: chat now uses a validated browser timezone with IST fallback; timezone metadata is removed before forwarding the provider payload. Yahoo Finance relay removed; direct Yahoo endpoint remains unofficial and blocked from commercial clearance.
- Outbound helper `lhttp()` now rejects non-HTTPS, credentials, IP-literal, local-style, single-label and non-443 provider URLs; restricts redirects to the original hostname (max 3); blocks redirected non-GET requests; cancels redirect response bodies; and reads response bodies with a 3 MiB streaming cap.
- Added `nova-http.js` and `scripts/provider-http.test.cjs`; CI main workflow runs `npm run test:provider-http`. The current full workflow must pass before these changes are considered verified.
- Current dependency inventory document lists 72 npm lockfile package records and declared licences. Deno dependency provenance, third-party assets, and contributor IP remain open.
- Current PR is still Draft and unmerged. Staging deployment remains old SHA `195739a`; Production main remains untouched.
- Remaining direct `fetch()` integrations (speech, LLM streaming, image providers, Horde polling) are being audited separately; the generic `lhttp()` protections do not automatically cover them.


## Image-provider privacy review — 12 November 2026

- Found AI Horde request payload had `shared:true`, which opts into sharing generated content with LAION for dataset improvement. Changed to `shared:false`.
- AI Horde fallback already requires `HORDE_API_KEY`; anonymous/no-key requests are rejected before submission. The request still sends the prompt to third-party workers, so it is not private from the provider.
- Added `scripts/image-privacy.test.cjs`, `npm run test:image-privacy`, and a CI regression step.
- Updated API audit and privacy draft to disclose the third-party worker processing and remaining Pollinations rights/retention uncertainty. Privacy notice remains a draft and must not be published as final.


## Direct provider response limits — 12 November 2026

- Added `readBoundedBuffer()` to `nova-http.js`.
- Speech transcription provider response text is capped at 1 MiB.
- Optional paid image provider JSON is capped at 16 MiB; Pollinations binary images are capped at 8 MiB.
- AI Horde submit/check responses are capped at 256 KiB and status response at 12 MiB.
- Added binary response cap tests to `scripts/provider-http.test.cjs`.
- LLM chat response remains streamed intentionally; its output-token/time and client-abort behavior need a separate review. Direct provider response caps and tests must pass latest CI before being counted as verified.


## Environment configuration completeness — 12 November 2026

- Scanned all `E.NAME` references in the active `nova-server.txt` and compared them with `.env.example`.
- Added previously undocumented runtime controls: `PORT`, `LIVE_CONCURRENCY`, `LLM_MAX_HISTORY`, `LLM_MAX_INPUT_TOKENS`, `LLM_MAX_OUTPUT_TOKENS`, `LLM_TIMEOUT_MS`, `LLM_VISION_BUDGET`; documented `NOVA_BI_SITE_URL` separately for Supabase Edge Function secrets.
- Added `scripts/env-example.test.cjs`, `npm run test:env-example`, and a CI check to prevent missing server environment variables from being omitted in future.
- Updated API integration inventory. Latest CI must pass before counting the new check as verified.


## Latest verified CI and audit update — 12 November 2026

- Candidate head `7f6adcd7819aa41eff61a12cb2a01f364b742f9b`: Main verification run #43198052144 **success**; Browser verification run #43198052142 **success**.
- Main CI confirms: backend/frontend syntax, provider defaults, Markdown escaping, mode registry, sync merge/conflict, rate limit, timezone tests, env example completeness, provider URL tests, provider HTTP redirect/size tests, AI Horde privacy test, PDF.js mitigation, PostgreSQL tenant RLS, Deno Edge Function typecheck, invitation lookup, BI calculations/CSV validation, 60-case AI fixture, dependency audit, local routes/PWA, graceful shutdown, Playwright Chromium and five-viewport mobile/drawer tests all passed.
- Deliberately skipped in CI because the PR is not deployed/merged: deployed Edge Function live auth/CORS smoke, live website/provider smoke, free image provider live smoke. These are not counted as passes.
- Browser workflow also passed account UI/privacy/opt-in sync, Company Cloud auth listener, mobile layout/drawer and graceful shutdown.
- The 60-case AI fixture passes its structure/validation check; it is not the requested 300-question live-model accuracy benchmark.
- Added external runtime inventory for Supabase JS, PDF.js, math.js, Nerdamer, KaTeX, Fraunces and Nunito. Exact CDN hashes/SRI, exact Nerdamer 1.1.13 licence archive and entry-video provenance remain open.
- Chat now caps output tokens, aborts upstream on client disconnect, respects downstream backpressure and bounds non-OK provider error bodies.
- Current branch head may advance when documentation updates land; re-run latest-head CI before Staging.
- Staging remains on old SHA `195739a`; no Production changes. Physical Android/microphone verification still blocked on an owner-supplied handset check.
