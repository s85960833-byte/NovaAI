# NOVA Business Intelligence — Security Status and Release Gate

**Status:** Core tenant-authentication and database isolation controls are implemented. Automated tests are not a security certification. Keep the feature branch isolated until all release gates pass.

## Implemented candidate controls (not a deployment claim)
- Supabase Auth handles account authentication.
- Edge Function `nova-bi-api` requires a verified user JWT.
- The browser contains only a Supabase publishable key; the service-role key remains server-side.
- All nine tenant tables plus the server-only rate-limit table have Postgres RLS enabled.
- Tenant reads and writes use the authenticated database client and tenant-scoped predicates.
- Owner/admin-only membership invitations, roster access, branding writes, workflow decisions and deletions have explicit server-side checks and/or database policies.
- Organization creation, invitation acceptance, workflow approval separation and delete audit events are guarded by database triggers.
- Authenticated users cannot directly insert or modify membership roles. Invitation acceptance has a narrow column-level `UPDATE(status)` grant only; `role`, `organization_id` and `user_id` remain non-updatable by the authenticated role.
- CSV contents remain browser-local; cloud persistence is limited to metadata, analysis aggregates, assumptions and evidence.
- Edge Function request bodies and JSON payloads have explicit size limits; list endpoints are capped. Per-user throttling allows 120 authenticated API requests/minute and 5 invitations/hour. Rate-limit counters and the limiter function are inaccessible to anon/authenticated roles.
- The last read-only Security Advisor check on the connected project returned zero findings. That result is not a certification of this entire candidate: pending candidate migrations and Edge Function changes have not all been applied to the live project.

## Live Edge Function CORS mismatch

A fresh read-only inspection of deployed `nova-bi-api` v13 found that production still sends `Access-Control-Allow-Origin: *` and accepts OPTIONS preflights without validating Origin. The candidate's `cors.ts` enforces the configured exact origin and its Deno tests cover lookalike/opaque origins, but candidate code is not deployed. The live Edge Function replacement and post-deploy hostile-origin smoke test remain mandatory release gates. Do not describe the live endpoint as exact-origin protected until those checks pass.

## Hosting and recovery are not production-ready
The connected Render service and Supabase organization are both on Free plans. Render explicitly says Free web services should not be used for production applications; they spin down after 15 minutes idle and may take about a minute to wake. Supabase Free does not include automatic backups. The Render service is in Singapore while the Supabase database is in Ireland (`eu-west-1`); evaluate a common or otherwise latency-appropriate region before customer onboarding. Supabase offers Mumbai and Singapore regions, but region changes require migration and are also data-residency decisions. Before customer data is accepted, choose an approved always-on hosting plan, implement off-site backups, complete a restore drill, and validate latency. References: [Render Free limits](https://render.com/docs/free), [Supabase Free backup FAQ](https://supabase.com/kb/faqs/platform/free-plan-backups), [Supabase backups](https://supabase.com/docs/guides/platform/backups).

## Browser Content Security Policy gap
The Express response header sets `Content-Security-Policy: frame-ancestors 'none'`. Separately, `index.html` includes a meta CSP with `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, and other resource directives. The current candidate no longer permits `'unsafe-inline'` in `script-src`: the primary app surfaces were checked for inline script blocks and inline HTML event-handler markup, and neither remains. However, `style-src` still permits `'unsafe-inline'` for inline CSS/style attributes, while `connect-src https:` remains broad to support configured BYOK providers. A nonce/hash-based style policy and a deliberately minimized provider-origin allowlist are not implemented. Therefore CSP is improved but not yet strict. This remains a defense-in-depth release gate; verify all flows in browser CI before tightening further.

## Auth email delivery and redirect configuration

The Company Cloud signup, confirmation resend and password-reset flows call Supabase Auth with `window.location.origin` as the redirect target. Production delivery is not verified. Supabase's built-in SMTP is explicitly non-production: it only sends to pre-authorized project-team addresses, is currently limited to two messages per hour and has no delivery SLA. Configure custom SMTP with a verified sending domain and confirm SPF/DKIM/DMARC; then test signup confirmation, resend and password recovery using controlled mailboxes. Also set the Supabase Site URL to the production origin and add only the required production redirect URL(s) to the allow-list; the default Site URL is `localhost:3000`. References: [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). The current connector cannot read or update these Auth settings, so an authorized project owner must verify them directly. Do not disable email confirmation to bypass delivery problems.

## Account deletion and retention are not yet production-ready

The current Company Cloud UI supports sign-up, sign-in, email confirmation, password reset, company membership and deletion of selected datasets/analyses. It does not expose a complete self-service account-deletion flow or a published retention schedule. The current schema uses `ON DELETE RESTRICT` for several Auth-user references, including organization creators, memberships and record creators; deleting an Auth user without a designed transfer/anonymization/data-retention workflow can fail or damage company records. A safe implementation must define organization-owner transfer, company-data ownership, audit-record preservation, legal holds, session revocation and the retention period before adding an account-delete endpoint. Do not promise account erasure or accept customer personal/employee data until this process is designed, tested and reviewed.

## Data classification and user notice
Do not use this release candidate with regulated, highly sensitive, or production employee personal data until privacy, retention, backup and incident-response controls are reviewed. Productivity insights are team-level and must not be used as individual surveillance or automated employment decisions.

Cloud save sends the selected dataset metadata and calculated aggregates/evidence to the NOVA BI Supabase project. Original CSV rows are not uploaded. The company export downloads records visible to the signed-in user.

## Important remaining controls
1. Verify real signup, email confirmation, sign-in, sign-out, token refresh and revoked-session behavior in a browser.
2. Verify two real test accounts across separate organizations, including cross-tenant reads/writes/deletes and role downgrade/removal.
3. Verify invitation email delivery with the configured Supabase Auth SMTP/provider; automated tests currently stub this external delivery.
4. Define retention windows and backup/restore procedures; verify provider backups and recovery.
5. Verify deletion semantics for all tenant data, including memberships, audit history, branding and organization closure. Current UI supports owner/admin deletion of saved analyses and dataset metadata only.
6. Add IP-level abuse monitoring and alerting before broad public exposure; per-user API throttling (120/minute) and invitation throttling (5/hour) are implemented.
7. Complete manual Android touch, keyboard/screen-reader, contrast, low-bandwidth and performance checks.
8. Complete incident-response and secret-rotation runbooks.

## Threat-model checks
- Cross-tenant resource IDs must not disclose another tenant's records.
- Unauthenticated requests must return 401.
- Authenticated non-members and insufficient roles must be denied.
- A viewer cannot create or delete data; an analyst cannot invite, change branding, delete data or approve workflows.
- A workflow creator cannot approve their own proposal.
- Only the invitee can accept a pending invitation.
- No raw CSV rows, service-role credentials or passwords may appear in browser bundles, logs, URLs or error messages.
- CSV cell contents must render as text and never execute as markup/script.
- Data export and deletion must be scoped to the active organization and leave required audit evidence.

## Release decision

**Status: NOT production-ready; do not merge or deploy yet.**

The integrated candidate is on Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73), branch `feature/nova-integrated-release-20261106`, latest candidate head `8cb4ce3461f43554c2fa712f3c2d1d0891bc098e`. Exact-head CI push run [#42379148497](https://github.com/s85960833-byte/NovaAI/actions/runs/42379148497) and PR run [#42379153742](https://github.com/s85960833-byte/NovaAI/actions/runs/42379153742) both passed.

**Important scope:** CI's deployed-function smoke test and all live Render website/provider/image smoke tests were skipped because the candidate has not been merged/deployed. Chromium mobile viewport tests are not a physical Android device test. A green candidate CI run is not proof of production readiness.

### Remaining release blockers (must be closed before a sales-ready production claim)
1. Deploy the candidate only after owner approval; then verify live exact-origin CORS, authenticated function behavior and provider/image flows against the real production origin.
2. Complete real signup, confirmation, resend, password reset, sign-in/out, token refresh and revoked-session checks using controlled test accounts and verified custom SMTP; set the production Site URL and redirect allow-list.
3. Complete two real accounts in separate organizations and test cross-tenant reads/writes/deletes, role changes/removal, invitations and audit evidence.
4. Complete physical Android checks (touch, keyboard, screen reader, contrast, low bandwidth and performance) on supported devices; browser emulation alone is insufficient.
5. Finish CSP hardening. Inline style attributes and runtime style mutation remain; broad `connect-src https:` is still permissive. Refactor and test before removing unsafe inline style allowances or narrowing provider connections.
6. Configure and verify the Render health-check path as `/health`; it currently is not configured on the service. This requires the correct Render workspace/service to be confirmed by the owner.
7. Establish off-site backups and complete a successful restore drill. Supabase Free does not provide the required automatic backup/recovery assurance for production.
8. Choose and verify production-suitable hosting, backup, monitoring and alerting; current Render Free/Supabase Free settings are not a demonstrated production SLA/recovery plan.
9. Complete privacy/data-processing notice, retention/deletion design, organization-owner transfer, audit retention, incident response and secret-rotation runbooks. Do not promise full account erasure or process real employee/customer personal data before this is reviewed.
10. Decide and document region/data-residency strategy; the current Render/Supabase regions are different.
11. Enable and verify required branch protections/status checks before production merge.
12. Re-run full live smoke tests after deployment and record rollback/recovery evidence.

No live service, production database, Auth setting, billing plan, branch protection or production deployment was changed by this candidate update. These external gates require owner access/approval and, where relevant, an authorized adult/account owner. Keep PR #73 Draft and unmerged until every applicable gate is evidenced.




## Latest candidate verification — 7 November 2026

- Current Draft PR #73 head: `3014e4bcd4600c09320045e8caacdab7c53ba53d`; PR push workflow [#42379943971](https://github.com/s85960833-byte/NovaAI/actions/runs/42379943971) completed successfully. A duplicate push run #42379938717 remains pending without a job and is not counted as a pass.
- The successful run passed syntax/security, PostgreSQL migration and tenant-RLS integration, Deno Edge Function type-check/CORS tests, BI calculations/CSV, dependency audit, local runtime/PWA, Chromium workspace/PDF, Company Cloud mobile-browser workflows and five-viewport responsive/drawer tests.
- Live deployed Edge Function, Render/provider/image checks were skipped because this candidate is not deployed. No physical Android device, real SMTP/Auth email, or two-real-account live tenant test has been completed.
- PR #73 remains Draft, open, unmerged and undeployed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No live service, database, Auth setting, billing plan or deployment was changed.


## Authoritative candidate status — 8 November 2026

This section supersedes earlier dated candidate-head and CI snapshots above. Historical entries are retained as audit history; use this section for the current release decision.

- Draft PR #73 head: `0411d158650c909c133d3eda069b587b04ac9d61`; open, Draft, unmerged. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`.
- Exact-head CI run [#42430566602](https://github.com/s85960833-byte/NovaAI/actions/runs/42430566602) completed successfully. PostgreSQL migration/RLS integration, Edge Function type-check, BI calculations/CSV tests, dependency audit, Chromium/PDF, Company Cloud browser workflows and five-viewport mobile/drawer tests passed. No failed steps were reported.
- The following live checks were skipped by workflow conditions: deployed Edge Function auth/CORS, live Render website/provider smoke, live image-generation smoke, and wait-for-production deployment. A green CI run is candidate verification, not production verification or physical Android testing.
- Current GitHub comparison: 490 commits ahead of `main`, 0 behind, 64 changed files. This is a large review surface; the authorized project owner must review the full history and diff before any merge.
- The connected Render service is configured to deploy `main`, on the Free plan in Singapore; no health-check path is configured. It has not been switched to this candidate.
- Live Supabase Edge Function `nova-bi-api` remains ACTIVE v13 with `verify_jwt=true`; its deployed source still has wildcard CORS. Live migration history currently ends at `20261106130204`. Candidate migrations `20261106195900_nova_bi_rate_limit_search_path_hardening.sql` and `20261108120000_nova_bi_audit_admin_read_only.sql` are not applied live.
- The candidate now consistently limits audit-log read access to active owners/admins in its database migration, Company Cloud UI, provider-neutral role permission map and regression tests. This is verified in isolated PostgreSQL CI only, not live Supabase.
- No production deployment, live migration, Auth/SMTP setting, billing change, hosting-plan change, branch-protection change or real customer-data operation was performed in this work session.

### Release decision remains NO-GO for paid sales or customer onboarding

Outstanding gates remain: owner-approved release review; full diff/history review; apply candidate migrations and deploy the candidate Edge Function only with approval; live exact-origin CORS/auth tests; controlled real-account signup/confirmation/reset/invitation tests with verified custom SMTP and redirect allow-list; two-account cross-tenant and role tests; physical Android accessibility/performance checks; approved hosting, health checks, backups and restore drill; region/data-residency decision; CSP tightening; complete account deletion/retention/owner-transfer/privacy/incident-response/secret-rotation procedures; and verified branch protection. Do not collect confidential company or employee data, promise SLA/availability, or accept payment on the basis of candidate CI.

