# NOVA Business Intelligence — Security Status and Release Gate

**Status:** Core tenant-authentication and database isolation controls are implemented. Automated tests are not a security certification. Keep the feature branch isolated until all release gates pass.

## Deployed security controls
- Supabase Auth handles account authentication.
- Edge Function `nova-bi-api` requires a verified user JWT.
- The browser contains only a Supabase publishable key; the service-role key remains server-side.
- All nine tenant tables plus the server-only rate-limit table have Postgres RLS enabled.
- Tenant reads and writes use the authenticated database client and tenant-scoped predicates.
- Owner/admin-only membership invitations, roster access, branding writes, workflow decisions and deletions have explicit server-side checks and/or database policies.
- Organization creation, invitation acceptance, workflow approval separation and delete audit events are guarded by database triggers.
- Authenticated users cannot directly insert or modify membership roles.
- CSV contents remain browser-local; cloud persistence is limited to metadata, analysis aggregates, assumptions and evidence.
- Edge Function request bodies and JSON payloads have explicit size limits; list endpoints are capped. Per-user throttling allows 120 authenticated API requests/minute and 5 invitations/hour. Rate-limit counters and the limiter function are inaccessible to anon/authenticated roles.
- Security Advisor returned zero findings on the approved project at the latest check.

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
This is a verified feature-branch release candidate, not a 100%-complete public product. Do not merge or deploy until remaining release controls and manual checks are completed and the owner explicitly approves.
