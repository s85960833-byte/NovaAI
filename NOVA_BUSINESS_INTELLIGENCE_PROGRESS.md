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
