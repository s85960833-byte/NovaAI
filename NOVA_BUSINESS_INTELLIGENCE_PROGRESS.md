# NOVA Business Intelligence — Engineering Progress

Updated: 2026-11-01

## Current release state
- Feature branch: `feature/nova-business-intelligence`.
- Review: [Draft PR #46](https://github.com/s85960833-byte/NovaAI/pull/46).
- Latest verified code commit: `bea974e15e50f9bda4b657d1bd2a7564fba28ef0`.
- Production `main` and Render service `srv-dbidhpc9v7es73d6ia80` remain untouched. No merge or production deployment has been performed.
- Approved NOVA BI Supabase project: `qrfwsewppafhxibdboam`. The separate Research-to-Code project has not been used.

## Implemented and deployed to the approved Supabase project
- Eleven migrations are recorded; nine tenant tables plus one server-only rate-limit table (10 total) exist.
- All ten tables have RLS enabled; tenant data tables use active-membership/role policies and the rate-limit table has an explicit deny-all client policy.
- Supabase Security Advisor currently reports zero security findings.
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
- Keep PR #46 Draft until all automated and manual release gates pass.
- Do not merge to `main`, deploy to Render, enable public customer onboarding, or represent the system as enterprise-certified without explicit owner approval and verified evidence.
- No paid resource or external service purchase has been authorized.
