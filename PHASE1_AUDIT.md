# NOVA AI — Phase 1 Product and Technical Audit

**Audit started:** 12 November 2026 (Asia/Kolkata)  
**Repository:** `s85960833-byte/NovaAI`  
**Branch:** `fix/nova-home-learn-first-mobile-20261109`  
**Scope:** Source-level product, route, security, UX, documentation and Render configuration review. This is an in-progress audit, not a certification or a claim that all pages/features are defect-free.

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
9. **Portability and handover are incomplete.** No Dockerfile, alternate-host deployment runbook, one-day transfer pack or verified database backup/restore drill was found in the reviewed tree.
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
