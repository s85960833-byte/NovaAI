# NOVA Business Intelligence — Engineering Progress

Updated: 2026-11-08

## Authoritative current release checkpoint
- Current unified candidate is Draft PR #73 on `feature/nova-integrated-release-20261106`; current head shown in PR #73, 501 commits ahead of production `main`, 0 behind, 64 changed files. Open, Draft, unmerged and undeployed.
- Latest application-code verification snapshot: `aa822abe16ff77e5d8533dbec2b69e30e35aaa2a`; exact-head CI #42434333838 passed with 34 successful steps, 0 failed and 4 live-production checks skipped. Later commits only update documentation.
- Live Supabase: 12 migrations; candidate audit-read and rate-limit search_path migrations remain pending. Live `nova-bi-api` v13 still has wildcard CORS. The live audit SELECT policy still allows active members, while candidate restricts it to owners/admins.
- All 10 BI tables have RLS enabled; Security and Health Advisors currently return zero findings. Performance Advisor has 13 INFO-only unused-index notices.
- Read-only 24-hour Edge Function log sample: 509 requests (340 OPTIONS/204, 169 GET `/me`/401), no successful authenticated API request in that sample. Real Auth/SMTP delivery and two-account tenant isolation remain unverified.
- Render production remains on `main` in Singapore; Supabase remains in Ireland. Physical Android, backup/restore, privacy, account deletion, hosting and branch-protection checks remain open.
- **Paid-sales status: NO-GO.** See `PITCH_READINESS.md` and Draft PR #73 for current release gates.

## Current release state
- Unified feature branch: `feature/nova-integrated-release-20261106`.
- Review: [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73), which combines the three-workspace UI and NOVA BI.
- BI-only PR #67 is a predecessor; PR #46 is an older divergent branch. Do not merge either as a substitute for PR #73.
- Latest application-code verification snapshot is `aa822abe16ff77e5d8533dbec2b69e30e35aaa2a` (exact-head CI #42434333838 passed). Later commits are documentation-only; use PR #73 for current branch-head and exact status. PR #73 remains Draft, unmerged and undeployed; live CORS and candidate migrations are not applied.
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
- CI applies the committed migrations to a fresh PostgreSQL 17 instance and exercises tenant-isolation, membership, invitation, approval-separation, branding, audited deletion and server-only rate-limit enforcement/window reset.
- CI type-checks the Edge Function and checks the deployed endpoint for unauthenticated 401 behavior and CORS preflight, including DELETE.
- GitHub Actions run [41327443120](https://github.com/s85960833-byte/NovaAI/actions/runs/41327443120) passed on the latest verified commit: 37/37 BI tests, fresh PostgreSQL 17 migrations/RLS integration, Deno type-check, deployed Edge Function unauthenticated 401/CORS checks, local server/PWA smoke tests, and the Playwright 390×844 mobile browser flow.
- The Playwright flow exercises CSV analysis, project risk, scenario calculation, workflow planning, Action Proof export, cloud save without raw CSV rows, branding, invitations, invite acceptance UI, approval, audited deletion controls, JSON export and Escape-key dialog close.
- Live Supabase SQL checks were also run inside transactions and rolled back. They verified tenant isolation, owner bootstrap, viewer write/delete denial, analyst approval/branding denial, admin approval of another member's proposal, admin owner-role escalation denial, invite acceptance and deletion audit evidence. A follow-up count confirmed zero test organizations/users remained.
- Live rate-limit function tests passed threshold denial and window reset; authenticated/anon roles cannot read counters or execute the limiter. Latest Edge Function logs show unauthenticated `GET /me` returns 401 and CORS preflight returns 204 on deployed function version 13.
- Security Advisor reports zero findings, including after adding the explicit deny-all client policy on the server-only rate-limit table. Performance Advisor currently reports 13 unused-index INFO notices on the newly created low-traffic schema; these are observations, not security findings or runtime failures.
- Live Render smoke tests are skipped on the feature branch; no production deployment has been performed.

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
