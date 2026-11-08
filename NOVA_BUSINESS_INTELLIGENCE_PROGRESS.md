# NOVA Business Intelligence — Engineering Progress

Updated: 2026-11-08

## Authoritative current release checkpoint

- Unified candidate: [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73), branch `feature/nova-integrated-release-20261106`; open, Draft, unmerged and undeployed. Use the PR's live comparison for commit/file counts; this document intentionally does not hard-code them.
- Application-code snapshot: `7f7d6bc475359c19975dbb8702205af5ad86cb30`; subsequent changes include documentation corrections and a PostgreSQL RLS integration-test assertion; test-only commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943). Check Draft PR #73 for the live branch head; never infer that skipped live checks passed. Never infer that skipped live checks passed.
- Latest application-code verification snapshot: `7f7d6bc475359c19975dbb8702205af5ad86cb30`; exact-head CI [#42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) passed. Later changes include documentation corrections and the PostgreSQL RLS integration-test update; the test-only update passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943).
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; Render production remains configured to deploy `main`. No candidate merge or deployment occurred.
- Live Supabase findings remain unchanged: candidate audit-read and rate-limit search_path migrations are pending; deployed `nova-bi-api` v13 still has wildcard CORS; live audit SELECT still permits active members. Do not describe candidate hardening as live.
- Candidate CI covers PostgreSQL 17 migration/RLS integration, Deno Edge Function type-check and invitation/CORS tests, BI calculation/CSV validation, dependency audit, local runtime/PWA smoke, Chromium Company Cloud workflows and responsive viewport tests.
- Four live checks were skipped on the feature branch: deployed Edge Function auth/CORS, Render live deployment/provider smoke, live website/provider smoke and free image-generation smoke. Chromium viewport tests are not a physical Android test.
- Other unclosed release gates: real signup/confirmation/reset/invitation email delivery, two-real-account tenant isolation, physical Android/accessibility/performance, backup/restore, privacy/retention and complete account/organization deletion, hosting/region/health-check review, CSP tightening and branch-protection verification.
- **Release decision: NO-GO for paid sales, customer onboarding, sensitive company data or production promises.** Only clearly disclosed, non-sensitive concept feedback is appropriate until all gates are verified and approved.

## Current release state
- Unified feature branch: `feature/nova-integrated-release-20261106`.
- Review: [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73), which combines the three-workspace UI and NOVA BI.
- BI-only PR #67 is a predecessor; PR #46 is an older divergent branch. Do not merge either as a substitute for PR #73.
- Latest application-code verification snapshot is `7f7d6bc475359c19975dbb8702205af5ad86cb30` (exact-head CI #42443089589 passed). Later changes include documentation corrections and a PostgreSQL RLS integration-test update; test-only commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943). PR #73 remains Draft, unmerged and undeployed; live CORS and candidate migrations are not applied.
- Production `main`, Render and the live Supabase schema/function remain unchanged. No merge, production deployment, live migration, Auth config change or SMTP change has been performed.
- Production `main` and Render service `srv-dbidhpc9v7es73d6ia80` remain untouched. No merge or production deployment has been performed.
- Approved NOVA BI Supabase project: `qrfwsewppafhxibdboam`. The separate Research-to-Code project has not been used.

## Implemented and deployed to the approved Supabase project
- Twelve migrations are recorded; nine tenant tables plus one server-only rate-limit table (10 total) exist.
- All ten tables have RLS enabled; tenant data tables use active-membership/role policies and the rate-limit table has an explicit deny-all client policy.
- Supabase Security Advisor currently reports zero security findings. A live invitation-acceptance permission gap was found during the A–Z audit and fixed with a narrow `UPDATE(status)` column grant; direct role/tenant/user identity updates remain denied. The deployed migration is `20261106130204_nova_bi_membership_accept_status_grant`.
- Edge Function `nova-bi-api` is ACTIVE at version 13 with JWT verification enabled.
- Server-enforced limits allow 120 authenticated API requests per user per minute and 5 invitation attempts per user per hour; rate-limit counters are inaccessible to client roles. IP-level abuse monitoring remains a separate release gate.
- The authenticated server API supports organization bootstrap, own invitation acceptance, owner/admin invitations and roster access, dataset/analysis metadata, workflow proposals and approval decisions, branding, audit reads, and audited dataset/analysis deletion.
- Service-role operations remain in the server-side Edge Function; the browser uses only the publishable key and user session.
- Original CSV contents are parsed locally and are not uploaded. Cloud persistence stores metadata, calculation outputs, assumptions and evidence.
- Workflow plans require approval records but do not execute external company actions.

## Product scope and truthful limitations
- Cost Leak Detector, client profitability analysis, team-level productivity indicators, heuristic project risk, assumption-based Digital Twin scenarios, workflow proposal planner, Action Proof export and company cloud workspace are implemented on the feature branch.
- Risk scoring is an explainable heuristic, not a trained/calibrated prediction.
- Digital Twin calculations are based on user-entered assumptions, not guaranteed savings or forecasts.
- Productivity output is team-level and is not an individual employee ranking or surveillance feature.
- Workflow Automation currently creates approval-gated plans/records; no external workflow connector or execution engine is connected.
- White-label controls update workspace name/tagline/logo/colors; custom domains and complete NOVA brand removal are not implemented.
- External accounting, HR, CRM, payment and project-management integrations are not implemented.

## Automated verification

- Latest fully verified application-code snapshot: `7f7d6bc475359c19975dbb8702205af5ad86cb30`; exact-head CI [#42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) passed. Later changes include documentation corrections and a PostgreSQL RLS integration-test update; test-only commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943).
- Latest documentation-only checkpoint before this progress-note correction: head `36e0460ea905116e1c198e45ad3e6ff6754001f3`; exact-head CI [#42442558669](https://github.com/s85960833-byte/NovaAI/actions/runs/42442558669) passed. Its browser artifact contains 360×800, 390×844, 412×915, 760×1024 and 1280×800 Chromium screenshots. These are browser simulations, not physical Android-device evidence.
- Candidate CI applies the committed migrations to a fresh PostgreSQL 17 database and exercises tenant isolation, membership, invitation, approval separation, branding, audited deletion and server-only rate-limit behavior.
- Candidate CI type-checks the Edge Function and runs invitation/CORS unit tests, BI calculation/CSV tests, syntax/security checks, dependency audit, local runtime/PWA smoke, Chromium workspace/PDF tests, Company Cloud browser workflows and five-viewport responsive/drawer tests.
- The deployed Edge Function unauthenticated/CORS smoke is conditional on `main`; it is skipped for this unmerged feature branch. Live Render/provider/image smoke is also skipped. Do not treat skipped live checks as passed.
- The latest browser run reported six mobile-layout tests passed, Company Cloud flows passed, and no browser page errors or CSP violations. The screenshots show a full-width layout in the tested Chromium viewports; they do not replace physical Android testing.
- Live Supabase Security and Health Advisors currently return zero findings. Performance Advisor reports 13 INFO-level unused-index notices on the low-traffic schema; these are not security findings or runtime failures.
- Live production remains distinct from the candidate: Edge Function v13 still has wildcard CORS, the audit-read policy still allows active members, and the candidate rate-limit/audit hardening migrations are pending.

## Release blockers that still require real-world verification
1. Perform real signup, email confirmation, sign-in, sign-out and session-refresh tests in a browser.
2. Verify two real users in separate organizations, cross-tenant denial, role downgrade/removal and the complete invitation-email acceptance flow. CI uses a mock email/API path and does not prove SMTP delivery.
3. Confirm Auth site URL, allowed redirect URLs, email provider/SMTP and invitation template behavior before opening signups to customers.
4. Define retention periods, backups, restore testing, organization closure and full deletion semantics. Current UI deletion covers saved analyses and dataset metadata; it is not a complete company-account erasure workflow.
5. Add IP-level abuse monitoring and alerting before broad public exposure; per-user API and invitation limits are implemented.
6. Complete manual Android checks for touch targets, keyboard/screen-reader navigation, contrast, reduced motion, low bandwidth and performance.
7. Complete production regression and live smoke tests only after an explicitly approved release.
8. Review privacy notice, data processing terms, incident response and secret-rotation procedures before using real or regulated company data.

## Release controls
- Keep unified PR #73 Draft until all automated and manual release gates pass. PR #67 is the BI-only predecessor and PR #46 is the older divergent branch; neither should be merged as a substitute.
- Do not merge to `main`, deploy to Render, enable public customer onboarding, or represent the system as enterprise-certified without explicit owner approval and verified evidence.
- No paid resource or external service purchase has been authorized.


## 2026-11-06 reconciled release update
- Current release candidate: Draft PR #67, branch `feature/nova-bi-reconciled-20261106`, based on current `main`; latest inspected head `26bd9ef43d8ffaeaa4cd5571e83ad2a084ee6f2b`, 67 commits ahead and 0 behind. It remains unmerged and undeployed.
- PR #46 is the older divergent BI branch and must not be merged as a substitute for PR #67. PR #66 remains the separate Draft UI candidate; it is not deployed.
- CI run #967 passed 27/27 steps against the latest inspected head. Syntax, PostgreSQL 17 migrations/RLS integration, Deno type-check, deployed Edge Function auth/CORS smoke, BI calculation tests, 60-case fixture validation, production dependency audit, local runtime/PWA smoke and Playwright Company Cloud mobile-browser workflows all passed. Only the production-live Render/provider steps were skipped because this is not the main branch.
- Additional hardening added to the candidate: HTTP response headers (nosniff, frame denial, no-referrer, restricted permissions, CSP frame-ancestors), whole-number validation for project blockers, 500 status for unexpected BI backend errors, and a forward-only migration to pin the already-applied rate-limit SECURITY DEFINER function to an empty search_path while preserving service-role-only execution.
- Static regression assertions and local syntax checks were added for these changes. The new forward migration is included in the fresh PostgreSQL migration test sequence. It has **not** been applied to the live Supabase project.
- The live Supabase project remains on its previously deployed schema/function versions; no Production Render deployment, PR merge, Auth settings change, SMTP change, or paid resource change was made in this update.
- Remaining external release gates are real signup/confirmation email, two real accounts and tenant isolation, production/preview redirect allow-list verification, Preview deployment, physical Android checks, backup/restore, retention, privacy and incident-response review.


## Final candidate verification — 2026-11-06
- Exact candidate head `dc0f9864d0c77534eaeba8bcdaa771e93ebf63b9` was verified by GitHub Actions run #978: 27/27 steps successful, 0 failed. The workflow's live Render wait and live website/provider smoke steps were skipped by design because no preview/production deployment was authorized.
- PostgreSQL migrations/RLS integration, Deno dependency install and Edge Function type-check, authenticated Edge Function auth/CORS smoke, BI calculation/CSV validation, 60-case fixture validation, dependency audit, local route/PWA checks, and Chromium Company Cloud mobile browser workflows all passed on this exact candidate head.
- Camera/microphone browser access is explicitly preserved by the same-origin Permissions-Policy; geolocation remains disabled. Runtime smoke and static CI assertions verify the policy.
- Company workspace switching clears the previous tenant's cached display data and discards any late response belonging to the previously selected organization; static CI assertion added.
- Temporary CI-only PRs #68, #70 and #71 were closed without merging. The authoritative BI PR remains Draft #67; the separate UI candidate remains Draft #66. Neither has been merged or deployed.
- This is automated candidate verification, not production certification. Signup/SMTP, two real-user tenant isolation, production/preview redirect allow-list, Preview and physical Android checks, backup/restore and privacy/retention review remain release gates.


## Unified candidate status (2026-11-07) — supersedes the earlier separate-PR snapshot

- NOVA Business Intelligence is now carried inside the unified Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73), branch `feature/nova-integrated-release-20261106`. The earlier PR #67 entry above is historical and is not the authoritative combined release candidate.
- Exact unified candidate head at this documentation checkpoint: `07454287053c538472f25832fcc475b9c67ed520`.
- GitHub Actions [run #1041](https://github.com/s85960833-byte/NovaAI/actions/runs/42329917724) and paired push [run #1040](https://github.com/s85960833-byte/NovaAI/actions/runs/42329912529) passed on that exact head: 55/55 steps completed, 52 succeeded, 3 live-environment steps skipped by design, 0 failures. The committed lockfile and `npm ci` dependency installation are included in this verified snapshot.
- The run verified PostgreSQL migration/RLS integration, Edge Function type-check and auth/CORS smoke, BI calculations and CSV validation, the 60-case fixture, dependency audit, local routes/PWA, Company Cloud browser flow and responsive browser tests.
- The run did not verify live SMTP delivery, real signup, two-real-account tenant isolation, live Render/provider behavior or physical Android behavior. These remain release gates.
- The unified candidate is still Draft, unmerged and undeployed. Do not use real or regulated company data until privacy, retention, backup/restore and incident-response controls are completed. Do not describe this module as launched or production-ready.

## Latest unified candidate verification — 7 November 2026

- Current unified Draft PR #73 head is `b51f0ff8c5234004455284aafcdc58b21a276823`; exact-head CI runs [#1222](https://github.com/s85960833-byte/NovaAI/actions/runs/42346535889) and [#1223](https://github.com/s85960833-byte/NovaAI/actions/runs/42346539792) both passed.
- The successful candidate CI includes PostgreSQL migration/RLS integration, Edge Function type-check and invitation lookup tests, BI calculations/CSV validation, dependency audit, local route/PWA checks and browser regression tests. Live Render/provider and free image-generation checks were skipped because no isolated preview was authorized.
- Changes after the last full application-code verification snapshot `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` are documentation-only. This does not change the outstanding release gates: isolated preview/runtime, real signup/email, two-account tenant isolation, physical Android, backup/restore, privacy/retention and incident response.
- Production `main` and live Supabase remain unchanged; PR #73 remains Draft and unmerged. This addendum supersedes earlier statements that the combined exact-head CI was still running or that `0745428...` was the latest checkpoint. Check PR #73 for the latest state.


## Authoritative unified release status — 8 November 2026

- Unified candidate: [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73), branch `feature/nova-integrated-release-20261106`; open, unmerged and undeployed.
- Latest application-code snapshot: `7f7d6bc475359c19975dbb8702205af5ad86cb30`; exact-head CI [#42443089589](https://github.com/s85960833-byte/NovaAI/actions/runs/42443089589) succeeded. It includes PostgreSQL 17 migration/RLS integration, Deno checks, BI tests and Chromium browser tests. Four live-only checks remain skipped.
- At that earlier checkpoint, documentation-only head `a8385e98463f28fcf0e13547ee5bb5db2f1fe0ec` passed CI [#42443325980](https://github.com/s85960833-byte/NovaAI/actions/runs/42443325980). The subsequent test-only PostgreSQL RLS assertion commit `e90f3f91525191b78149d8a02aa63133bdc0f029` passed exact-head CI [#42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943).
- Live release blockers remain: deployed Edge Function wildcard CORS, unapplied candidate audit-read and rate-limit search_path migrations, real Auth/SMTP and two-account testing, physical Android verification, backup/restore, privacy/retention/deletion, hosting/region/health checks, CSP hardening and branch-protection verification.
- Keep PR #73 Draft. No merge, deployment, live migration, Auth/SMTP change or paid resource change was performed. Release decision remains **NO-GO** for paid sales, customer onboarding, sensitive company data or production promises.


## Latest test-only RLS verification — 8 November 2026

- Latest exact-head candidate CI: commit `e90f3f91525191b78149d8a02aa63133bdc0f029`; [run #42443767943](https://github.com/s85960833-byte/NovaAI/actions/runs/42443767943) completed successfully. This test-only change adds an active-admin audit-read assertion to the PostgreSQL 17 RLS integration suite; it does not change runtime application code. Four live-only release checks remain skipped.
- Runtime application source remains at the previously verified application-code snapshot; the latest change only strengthens the isolated PostgreSQL integration test. Live Supabase policy was not changed.
