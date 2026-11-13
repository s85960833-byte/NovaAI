# NOVA AI — Phase 1 Product and Technical Audit

**Audit started:** 12 November 2026 (Asia/Kolkata)  
**Repository:** `s85960833-byte/NovaAI`  
**Branch:** `fix/nova-home-learn-first-mobile-20261109`  
**Scope:** Source-level product, route, security, UX, documentation and Render configuration review. This is an in-progress audit, not a certification or a claim that all pages/features are defect-free.

## New audit checkpoint — 13 November 2026

### Updated deployment and verification evidence
- Render Staging is Live on code-bearing app SHA `2e4eb204ff99790b55aef426fa0c38fc9a313d30` (deploy `dep-dbr6dul6e07s73ama50g`).
- GitHub-hosted Staging smoke verified `GET /health` HTTP 200 with `ok=true`, `ready=true`, `status=ok`; homepage HTML and `/nova-entry.js`, `/nova-config.js` assets succeeded.
- Staging `GET /api/config` returned HTTP 503 because no AI provider is configured. No AI chat, image, search-provider or paid-provider call was made by that smoke.
- Runtime logs report `NOVA_API_AUTH_REQUIRED` is disabled. Render Staging Health Check Path remains blank.
- Latest PR head when this checkpoint was authored: `a875ab19ae9df5c7a0598aa9845bc280343caf45`. Browser CI #43371767444 passed; Main CI #43371767554 remains in progress. Its sequential search-provider test completed successfully.
- PR #98 is Open/Draft/unmerged; Production branch and deployment remain unchanged.

### New confirmed Phase 1 findings
- The API route and provider terms review is captured in `API_AUDIT_2026-11-13.md`. It documents each source-integrated API, credentials, route, authentication gate, rate limit, fallback, cache policy and unresolved vendor rights.
- A source-derived feature guide with bilingual in-app help is captured in `FEATURES.md`.
- Search router code previously used parallel `Promise.any` calls across configured Tavily and Brave providers. It has been replaced with sequential first-usable routing and a unit-tested helper. This prevents the router from starting multiple paid search provider requests concurrently for one question.
- DuckDuckGo HTML result-page scraping has been removed from the general web search fallback; Wikimedia API is used as the reference fallback instead.
- Tavily cross-user/shared output caching is now explicitly gated by `TAVILY_SHARED_CACHE_ALLOWED=1`, default `0`; do not set it to 1 without written vendor permission.
- Provider terms review found Open-Meteo free tier non-commercial, CoinGecko keyless/free plan without commercial rights, TheSportsDB free API restricted to development and app-store publishing, and 18+ / non-transferable contractual terms for Tavily and Groq. These are not eligible for public production use under current operator circumstances without responsible-adult/vendor/legal review.
- Brave results are not persisted in shared cache by the updated router. GDELT/Google News RSS/publisher RSS, wttr.in, Coinbase/Frankfurter, ESPN, Hacker News, EONET, Pollinations legacy endpoint and several other public endpoints still lack fully verified commercial/reuse/transfer terms.
- Exa is listed in the master prompt but is not integrated in the current source.
- No durable consumer quota table/function, monthly usage accounting, plan entitlements or global provider spend cap exists. The separate `nova_bi_rate_limits` object must not be repurposed for consumer API quotas.

### Phase 1 status
- **Done:** Source route inventory; environment variable/key inventory; first-party Auth middleware/code review; existing rate-limit and request-size controls; current Staging external health/static smoke; sequential search router fix; API rights and feature documentation.
- **In progress:** Exact-head Main CI; remaining dynamic UI/error/loading/accessibility review; provider-by-provider rights verification and replacement decisions; route-level live Auth/provider tests.
- **Blocked by owner/vendor:** Staging health-check setting; approved AI provider account/key privately configured on Staging; hosted Auth email/redirect configuration; physical Android and microphone tests; provider contracts and any 18+ vendor relationship.
- **Release decision:** NO-GO. No Production change, paid service or paid API call.

---

## Exact-head audit update — 13 November 2026

- PR #98 latest head: `d0fc94f4b5bf562dde75008b721faaaf9ff05984`; Open/Draft/unmerged; mergeable=true.
- Main CI [#43372176067](https://github.com/s85960833-byte/NovaAI/actions/runs/43372176067): success, **49 successful, 3 skipped, 0 failed**. The new sequential search-router test passed. The three skipped steps are merged-Production wait, Production/provider smoke and live free-image smoke.
- Browser CI [#43372175932](https://github.com/s85960833-byte/NovaAI/actions/runs/43372175932): **17/17 successful**.
- Staging smoke on earlier code-bearing revision passed `/health`, homepage and `nova-entry.js`/`nova-config.js`; `/api/config` returned 503 because AI chat provider configuration is absent. Current search-router candidate is not yet confirmed deployed to Staging.
- Search router changed from parallel `Promise.any` to sequential first-usable provider routing, stops on first success, removes DuckDuckGo HTML scraping fallback and makes Tavily shared-output caching require explicit permission (`TAVILY_SHARED_CACHE_ALLOWED=1`, default 0).
- Provider rights, limits, caching, age and transfer constraints are in `API_AUDIT_2026-11-13.md`; bilingual user and engineering explanations are in `FEATURES.md`.
- Phase 1 remains **IN PROGRESS** because live provider/Auth checks, physical Android/microphone checks, complete UI accessibility review and legal/provider ownership clearance remain incomplete. Production remains NO-GO.

---

## Evidence reviewed

- Repository tree: 107 tracked files before cleanup; 2 obsolete HTML artifacts were removed from this branch because one was empty and the other was an unreferenced, explicitly labelled untested starter server from the previous architecture.
- Production and Staging Render service configuration, deployment history, events, metrics and available logs.
- `index.html`, `nova-app.js`, `nova-account.js`, `nova-business-cloud.js`, `nova-server.txt`, `nova-http.js`, `nova-provider-url.js`, `nova-rate-limit.js`, Supabase Edge Function and migrations.
- Main and Browser CI, Playwright viewport tests, runtime smoke tests, security tests, tenant-RLS integration tests and dependency audit.
- README, API integration audit, dependency inventory, India privacy review, Privacy Notice draft, Terms draft and incident runbook.

## Confirmed positive controls

- Main app preserves the existing `nova` local-storage key and filters provider secrets from persisted client state.
- Optional account cloud sync is OFF by default and requires explicit opt-in. It has per-user RLS integration tests. A recent patch fixes newest-chat selection, message overlap merging, explicit empty-field deletion timestamps and document deletion semantics.
- The NOVA BI Edge Function uses authenticated Supabase user context, per-user server-enforced rate limiting, bounded JSON request bodies and exact-origin CORS checks.
- Express applies security headers including nosniff, frame denial, Referrer Policy, Permissions Policy and HSTS; CSP blocks inline executable scripts and frames.
- Provider HTTP helper enforces HTTPS, blocks credentials and unsafe redirect targets, restricts redirects to the original host and bounds response bodies. Provider configuration is operator-controlled, not user-supplied.
- The public provider self-test route returns 404 unless `LIVE_SELFTEST_ENABLED=1`.
- Static markup scan found 49 buttons and no unnamed static button. This test does not prove every dynamic control or screen-reader workflow is accessible.
- Previous candidate `3720d278c151194f9213c55a352d528ec5f05f1c` passed Main CI #43201234510 and Browser CI #43201234633. The current SEO patch must pass fresh CI before it is accepted as verified.
- Two obsolete files were removed: an empty HTML artifact and an unreferenced, untested starter server accidentally stored with an HTML-like filename.

## Frontend and route inventory

- Main page: one SPA-style page in `index.html`, with modular browser scripts. It contains 49 static buttons, 0 static HTML forms and account/settings/chat controls created partly at runtime.
- Main workspace areas: NOVA Learn, NOVA Build and NOVA Agents. Playwright checks 360, 390, 412, 760 and 1280 CSS-pixel viewports and drawer/settings interactions.
- Express API routes include public config, chat, transcription, search, image job submission/status, live retrieval, provider self-test (disabled by default), news feed and health.
- Static routes explicitly serve the PWA manifest/icons, service worker, app modules, mode registry/workspace, Company Cloud modules and feature bundles. The server does not mount a generic public directory.
- External runtime origins found in the page: Google Fonts and jsDelivr (Supabase JS UMD client). The current HTML does not set Subresource Integrity hashes on the external runtime script.
- Before this audit patch, the page had a title but no description, canonical, Open Graph or Twitter summary metadata, and no explicit robots/sitemap route. This branch adds the metadata plus a root-only sitemap and robots policy that disallows crawling `/api/`; runtime smoke assertions were added. Search indexing and social previews still require a post-deploy check.

## Release-blocking findings

1. **Public provider endpoints are not account-authenticated.** Express chat, transcription, search, image and live routes can be called without a NOVA account. Existing limits are process-local per-IP limits; they are not durable per-user quotas, monthly spend caps or abuse-resistant billing controls. Do not enable billable public keys or customer onboarding until authentication/abuse controls and hard quotas are implemented and tested.
2. **No self-service account deletion.** The current Account control deletes only the cloud workspace row; it does not delete the Supabase Auth account or every associated record/log/provider copy.
3. **No published retention schedule or complete data-rights workflow.** Privacy notice and Terms remain drafts. Operator legal identity, support contact, subprocessors, retention, deletion and grievance procedures are not finalized.
4. **Commercial API rights are not cleared.** The API audit identifies non-commercial, undocumented, community or resale-restricted providers. Credentials, terms, account ownership and transfer rights have not been independently verified.
5. **Staging is stale.** Render staging is configured for this PR branch with Auto Deploy, but the last recorded live SHA is `195739a04895de364a5af22aa61f930d5d782cbb`, not the current PR head. Staging Health Check Path is blank.
6. **Production evidence is limited.** Production still serves `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. The review environment could not fetch the live URL directly. Render logs show successful startup on the last recorded deploy, but available request logs/HTTP metrics were empty; this is not uptime or user-traffic evidence.
7. **Physical-device checks remain outstanding.** Chromium emulation cannot verify real Android full-width rendering, touch behavior, microphone permission/capture or device-specific performance.
8. **No commercial readiness.** No checkout, server-side subscription entitlements, invoices/refunds, customer support operations, custom domain, monitoring/error-tracking service, tested restore drill or SLA is evidenced.
9. **Portability and handover are incomplete.** A Node 22 Dockerfile, Compose file, .dockerignore, local/OCI deployment notes and transfer checklist now exist. Static configuration/secret-exclusion tests and a Docker image build plus container /health smoke test have passed on candidate `eb258ba4e81a873537aaa8a53576955a726bcff3`. No second-host deployment or database backup/restore drill has been run; portability remains partial.
10. **SEO and accessibility coverage is partial.** This patch adds basic search/social metadata and crawler files. A full keyboard/screen-reader audit, dynamic control labels, SEO indexing and real social-preview validation remain outstanding.

## Current staging and production state

- Production URL: https://novaai-4auo.onrender.com
- Production Render dashboard: https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80
- Staging URL: https://novaai-pr98-staging.onrender.com
- Staging Render dashboard: https://dashboard.render.com/web/srv-dbqm035g1s2s73eogao0
- PR: https://github.com/s85960833-byte/NovaAI/pull/98
- Production service is on Render Free, Singapore, one instance, with no configured health-check path or SLA.
- Staging is on Render Free, Singapore, one instance; Auto Deploy is enabled and its Health Check Path is blank.

## Phase 1 work remaining

- Verify current-head Main and Browser CI after the SEO changes.
- Configure staging health check and deploy the current PR head to staging; run staging smoke tests.
- Inspect all dynamic feature dialogs, buttons, forms, errors, loading/empty states and keyboard/screen-reader behavior.
- Inspect every API route for authentication, input bounds, error leakage, rate limits, quota/spend protection and CORS.
- Complete account lifecycle, Auth redirects/email, two-user tenant isolation, cloud-sync concurrency, backup/restore and deletion tests.
- Complete physical Android and microphone checks.
- Verify real uptime/latency evidence and production smoke only after the approved release gates.
- Repeat the audit after fixes; do not declare zero known issues until every blocker has evidence.

## Decision

**Phase 1 is IN PROGRESS. Production release remains NO-GO.** This report deliberately separates automated/source-level evidence from live and physical-device verification.


## Exact-head verification update — 12 November 2026

- The SEO implementation on candidate `0a48f4c2bc1a9b34a240433dfd4adac0dcb9b261` passed Main workflow #43201970588 and Browser workflow #43201971052. Main: 44/44 steps successful. Browser: 16/16 steps successful.
- The local runtime smoke suite now checks homepage description/canonical/Open Graph metadata, `/robots.txt` and `/sitemap.xml`. Search indexing and social previews are not verified until the code is deployed and checked from the public URL.
- Reviewed `innerHTML` use in the main app, workspace modes, account, Company Cloud, NOVA BI and Agents. User/model-derived strings in reviewed paths are escaped or inserted as text. Remaining full dynamic-DOM and browser security verification is open.
- Market scan shows existing app builders and AI workspaces already cover major requested baseline features such as prompt-to-app, code handoff, deployment, databases, agents and research. No broad uniqueness claim is supportable from this scan; the differentiator must be narrowed to a measurable workflow and user evidence.
- Production remains on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`; Staging remains on `195739a04895de364a5af22aa61f930d5d782cbb`. Staging Health Check Path is blank. Live HTTP inspection and usable request/latency metrics were unavailable in this review.
- Phase 1 remains IN PROGRESS and Production release remains NO-GO. Staging deployment, Android/microphone, live provider/auth, account deletion/retention, API commercial rights, asset provenance, final legal review and backup/restore are not verified.


## Container verification update — 12 November 2026

- Candidate `eb258ba4e81a873537aaa8a53576955a726bcff3` built the production Docker image successfully and passed the container `/health` smoke test using an ephemeral host port.
- The CI smoke test currently exercises the default container port 3000. The image health check is being made `PORT`-aware and the test is extended to run on container port 3001 before portability is counted as verified.
- This is a local CI container test, not deployment to a second hosting provider.


## Supabase live read-only review — 12 November 2026

Project qrfwsewppafhxibdboam, PostgreSQL 17.11, eu-west-1, ACTIVE_HEALTHY. No database writes or secret retrieval were performed.

- 17 migration versions are present. 11 public base tables all have RLS enabled; no public views; 24 public policies; no anon table grants. The only policy including anon is the explicit deny-all policy on nova_bi_rate_limits. The nova_bi_audit_events SELECT policy requires an active owner/admin membership.
- Eight SECURITY DEFINER functions have empty search_path and are executable only by service_role, not anon/authenticated.
- nova-bi-api is ACTIVE v14 with verify_jwt=true. Its five primary deployed files exactly match the candidate repository files at review time.
- Security and Health Advisors returned no lints; Performance Advisor returned 13 informational unused-index findings. All inspected application tables report zero rows.
- This does not replace two-real-account authorization tests, live signup/reset/email, backup/restore, deletion/retention or penetration testing. FORCE RLS is not enabled, so privileged table owners/service roles must remain server-side.


## Current exact-head checkpoint — 12 November 2026, 16:45 IST

- PR #98 branch head: `671f6dcec0842106ba1b0a5a946bd69c01001abb`; PR remains Draft, Open and unmerged.
- Exact-head Main workflow #43207317636: **success**. Exact-head Browser workflow #43207318043: **success**. Both runs reference the same SHA above. This verifies only the checks in those workflows, not production readiness.
- Added a market/differentiation review based on official Lovable, v0 and Bolt product documentation. Existing platforms already offer many baseline app-builder, backend, Git and deployment capabilities. NOVA makes no broad exclusivity or category-first claim; differentiation remains a hypothesis until user testing and repeatable comparisons.
- Added a non-root Node 22 Docker image, Compose setup, secret-excluding build context and static CI checks. Container config checks do not prove a successful external-host deployment or operational portability.
- Render Staging remains on `195739a04895de364a5af22aa61f930d5d782cbb`; Health Check Path is still blank. The latest PR head has not been deployed to Staging. Auto Deploy is enabled, but current deployment evidence is stale.
- Production main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; Production Render remains on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. No Production merge or deploy was performed.
- Live blockers: current-head Staging deployment and smoke; owner Health Check configuration; physical Android/microphone checks; public AI route authentication and durable quotas; provider commercial rights; account deletion/retention; backup/restore and load evidence; full asset/IP/legal review.
- Overall Definition-of-Done progress: **23% estimated**. Buyer-readiness: **37/100 estimated**. These are internal qualitative estimates, not a formal appraisal.


## Visual review of the exact-head browser artifact — 12 November 2026

- Reviewed the PNG screenshots from Main CI run [#43260317789](https://github.com/s85960833-byte/NovaAI/actions/runs/43260317789), artifact `nova-integrated-browser-verification`, generated from code-bearing SHA `be4287fde83d7adcca5a41b13674d29f31383af6`.
- Screenshots reviewed: 360×800, 390×844, 412×915, 760×1024 and 1280×800.
- At the three phone-width emulated viewports, the workspace fills the screenshot width and stacks the Learn/Build cards vertically; no half-width page clipping or obvious horizontal cut-off was visible in the captured first screen.
- At 1280×800, the desktop layout uses a left navigation rail and three side-by-side workspace cards. At 760×1024, the layout returns to a stacked/tablet presentation.
- This is a visual spot-check of CI-generated local Chromium screenshots, not a live Render screenshot, physical Android certification, touch/keyboard test or microphone test. The mobile live-release gate remains open until the latest candidate is deployed and the owner's actual phone is checked.


## Repository secret-hygiene spot-check — 12 November 2026

- Scanned all 78 files changed in PR #98, covering 3,639 added patch lines, for common exposed credential formats (OpenAI-style keys, Supabase secret keys, AWS access-key IDs, private-key headers, GitHub tokens, Slack tokens and long Bearer credentials). No matches were found in added lines.
- Reviewed `.env.example`: secret fields are blank; it contains only non-secret defaults and the public Supabase project URL. No secret values were read from Render or Supabase.
- Reviewed `.dockerignore`: it excludes `.env`, `.env.*`, private-key/certificate files and credential JSON, while explicitly allowing `.env.example`. Dockerfile/Compose copy and env-file behavior are covered by CI configuration tests.
- This is a scan of the current PR's added diff and selected build/config files only. It does not establish that all Git history, all unchanged files, every external service, or account secret stores are clean. GitHub secret-scanning configuration and historical remediation still require owner verification.
