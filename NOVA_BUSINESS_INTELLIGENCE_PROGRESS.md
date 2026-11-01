# NOVA Business Intelligence — Engineering Progress

Updated: 2026-11-01

## Current release state
- Feature branch: `feature/nova-business-intelligence`.
- Review: [Draft PR #46](https://github.com/s85960833-byte/NovaAI/pull/46).
- Latest commit at this checkpoint: `833c51b8dc2e6c0619322e8c1e67054173e3af77`.
- Production `main` and Render service `srv-dbidhpc9v7es73d6ia80` remain untouched. No merge or production deployment has been performed.
- Approved NOVA BI Supabase project: `qrfwsewppafhxibdboam`. The separate Research-to-Code project has not been used.

## Implemented and deployed to the approved Supabase project
- Nine migrations are recorded and nine NOVA BI tables exist.
- All nine tenant tables have RLS enabled with active-membership and role-scoped policies.
- Supabase Security Advisor currently reports zero security findings.
- Edge Function `nova-bi-api` is ACTIVE at version 12 with JWT verification enabled.
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
- CI applies the committed migrations to a fresh PostgreSQL 17 instance and exercises tenant-isolation, membership, invitation, approval-separation, branding and audited-deletion behavior.
- CI type-checks the Edge Function and checks the deployed endpoint for unauthenticated 401 behavior and CORS preflight, including DELETE.
- CI runs the calculation/CSV tests, local server and PWA smoke checks.
- A Playwright mobile-viewport test now exercises the local BI workspace and Company Cloud mock API flow, including CSV analysis, project risk, scenario calculation, workflow proposal, Action Proof export, cloud persistence without raw CSV rows, branding, and delete-control states. Latest browser run exposed a sidebar-test sequencing issue; the test was corrected and the new run is pending. Do not count it as passed until the matching latest commit's Actions run completes successfully.
- Live Render smoke tests are skipped on the feature branch; no production deployment has been performed.

## Release blockers that still require real-world verification
1. Perform real signup, email confirmation, sign-in, sign-out and session-refresh tests in a browser.
2. Verify two real users in separate organizations, cross-tenant denial, role downgrade/removal and the complete invitation-email acceptance flow. CI uses a mock email/API path and does not prove SMTP delivery.
3. Confirm Auth site URL, allowed redirect URLs, email provider/SMTP and invitation template behavior before opening signups to customers.
4. Define retention periods, backups, restore testing, organization closure and full deletion semantics. Current UI deletion covers saved analyses and dataset metadata; it is not a complete company-account erasure workflow.
5. Add and verify rate limiting/abuse monitoring before broad public exposure.
6. Complete manual Android checks for touch targets, keyboard/screen-reader navigation, contrast, reduced motion, low bandwidth and performance.
7. Complete production regression and live smoke tests only after an explicitly approved release.
8. Review privacy notice, data processing terms, incident response and secret-rotation procedures before using real or regulated company data.

## Release controls
- Keep PR #46 Draft until all automated and manual release gates pass.
- Do not merge to `main`, deploy to Render, enable public customer onboarding, or represent the system as enterprise-certified without explicit owner approval and verified evidence.
- No paid resource or external service purchase has been authorized.
