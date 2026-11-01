# NOVA Business Intelligence — Engineering Progress

Updated: 2026-11-01

## Current status
- Workspace prototype and deterministic calculation engine are in the existing Draft PR #46.
- Current implementation branch: `feature/nova-business-intelligence`.
- Production `main` and Render have not been changed by this work.
- No company login, live shared storage, production database, integrations, or external automation is enabled.

## Completed in this work session
- Added a Supabase/Postgres schema draft for organizations, memberships, dataset metadata, analyses, workflow proposals, approvals, audit events and workflow execution evidence.
- Added tenant-scoped composite foreign keys for datasets/analyses and workflow proposals/approvals/executions.
- Enabled RLS on all proposed tables.
- Added active-membership-based read/write policies and least-privilege role checks.
- Kept organization creation, membership writes, workflow approvals/state changes, audit writes and execution writes server-only.
- Restricted dataset metadata updates to the name column; original creator and soft-delete metadata cannot be rewritten by ordinary authenticated clients.
- Added static migration-contract tests to the existing BI test suite.

## Verification
- GitHub Actions run: [41318838371](https://github.com/s85960833-byte/NovaAI/actions/runs/41318838371)
- Result: PASS.
- Verified steps: backend/frontend syntax, mode registry, BI calculations and CSV validation tests (including tenant-schema contract assertions), local Express startup, local routes and PWA assets.
- Live Render smoke tests were skipped because this is a feature-branch run.
- SQL has **not** yet been executed against a Postgres database. Static tests verify expected security clauses are present; they do not prove the migration executes or that live RLS behavior is correct.

## Provider / database gate
- The user has an existing empty Supabase project, but its intended use for NOVA BI has not been confirmed.
- No Supabase project was modified and no new project, paid resource, secret, or environment variable was created.
- Before applying migrations, confirm which existing project is intended for NOVA BI and inspect its plan, region, backups, API exposure settings and current schema.
- Supabase changed Data API exposure defaults on 2026-10-30: do not assume new public tables are automatically exposed. Explicit schema exposure and grants must be reviewed together with RLS.
- Do not store raw CSV rows by default. Persist only user-approved metadata, aggregate results and evidence.

## Remaining work
1. Confirm provider/project and authentication/session model.
2. Apply migrations only to the confirmed project, then run SQL syntax, RLS role-matrix and cross-tenant integration tests against it.
3. Implement server-side authentication, trusted membership loading, tenant-scoped repository methods and audit writes.
4. Add secure organization onboarding and invitations; do not create client-writable membership/approval endpoints.
5. Add durable dataset/analysis metadata persistence with export/deletion/retention controls.
6. Implement tested end-to-end workflow approval and execution records; no real external action until connector scopes and approval UX exist.
7. Complete mobile/manual accessibility, security, regression and production smoke tests.
8. Keep PR #46 draft until all release gates pass. Do not merge or deploy automatically.

 
## Verification update (2026-11-01)
- Latest feature-branch commit: `2b2cfea91a955fb833c38349b09daadb76cfd72f`.
- GitHub Actions run [41320123885](https://github.com/s85960833-byte/NovaAI/actions/runs/41320123885) passed all 28 BI tests, syntax checks, mode registry checks, local server startup, local route smoke tests and PWA asset checks.
- Fixed CSV source-row evidence so physical line numbers remain correct across blank lines and quoted multiline cells; malformed-row warnings now report physical line numbers.
- Added a file-size check before reading an uploaded CSV into browser memory.
- Date-only task/project deadlines are treated as due through the end of their calendar day rather than as overdue from midnight.
- Feature-branch CI does not run live Render smoke tests; no production deployment was performed.
- SQL migrations remain unexecuted; no Supabase project has been selected or modified. Authentication, trusted membership loading, tenant-scoped server APIs, durable shared storage, audit writes, onboarding, integrations and real workflow execution remain release blockers.

 
## Provider discovery checkpoint (read-only)
- Supabase project `qrfwsewppafhxibdboam` is named `thakurshreyanshthakurshreyansh-eng's Project`, is ACTIVE_HEALTHY in `eu-west-1`, has no recorded migrations and currently has no tables in the `public` schema.
- Supabase project `tfpltqrikyqbuqmbrgln` is named `research-to-code` and already has five migrations; it is not to be reused for NOVA BI.
- No project was modified. The generic empty project is only a possible candidate, not a confirmed NOVA BI database. Obtain explicit confirmation before applying any migration or configuring app credentials.


## Current status supersedes earlier provider gate
The user approved the empty Supabase project `qrfwsewppafhxibdboam`. Eight migrations are applied; nine NOVA BI tables exist with RLS enabled. Security Advisor reports zero findings. Edge Function `nova-bi-api` is deployed with JWT verification. Company Cloud includes account sign-in, organizations, cloud dataset/analysis storage, workflow approval records, team invitations and branding settings. Raw CSV rows remain local. Latest CI run `41323331945` passed 35/35 tests plus Deno type-check and local smoke checks. Remaining gates: real auth and two-tenant browser tests, invitation email verification, retention/export/deletion, full custom-domain white-label, external connectors/execution, manual accessibility/performance, and live production smoke tests. Production remains unchanged and PR #46 remains Draft.


## Latest verified checkpoint (2026-11-01)
- Approved Supabase project `qrfwsewppafhxibdboam` now has nine applied NOVA BI migrations and nine tenant tables; RLS is enabled on every table and Security Advisor reports zero findings.
- Supabase Edge Function `nova-bi-api` is ACTIVE at version 9 with JWT verification enabled.
- PostgreSQL CI applies every committed migration to a fresh Postgres 17 instance and passes tenant-isolation, invitation acceptance, creator/approver separation, branding and audited deletion checks.
- GitHub Actions run `41324374911` on commit `8db500730582188ff57d8edf56b3ba6cae36d01e` passed 36/36 BI tests, Deno type-check, live Edge Function unauthenticated 401/CORS checks, local server and PWA smoke tests.
- Live Render checks are skipped on the feature branch; production remains unchanged and PR #46 remains Draft.
- Not yet release-ready: actual account signup/sign-in and two-account invitation email delivery have not been tested; custom domains/full white-label, external company integrations and live workflow execution are not implemented; user-facing deletion controls and full mobile/accessibility/performance testing remain incomplete.
