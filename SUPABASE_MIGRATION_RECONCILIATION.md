# Supabase migration-history reconciliation — NOVA BI

**Status: BLOCKED pending authorized migration-source verification. Do not run a production migration push.**

## Evidence from the connected project

- Project: qrfwsewppafhxibdboam (PostgreSQL 17.11, live project).
- Live migration history contains 12 entries, ending at 20261106130204_nova_bi_membership_accept_status_grant.
- The candidate branch contains 14 SQL migration files: eleven early logical migrations with filenames from 20261101000000 through 20261101000011 (excluding the unused 00005 slot), one exact-match migration 20261106130204, and two later hardening migrations 20261106195900 and 20261108120000.
- For the first eleven, live history has matching logical names but different timestamps. Supabase documents that local and remote migration history are compared by timestamp only.

## Mapping observed

| Live version | Live name | Candidate file |
|---|---|---|
| 20261101153420 | nova_bi_tenant_schema | 20261101000000_nova_bi_tenant_schema.sql |
| 20261101153427 | nova_bi_workflow_execution_hardening | 20261101000001_nova_bi_workflow_execution_hardening.sql |
| 20261101153432 | nova_bi_rls_policy_corrections | 20261101000002_nova_bi_rls_policy_corrections.sql |
| 20261101153602 | nova_bi_authenticated_workflows | 20261101000003_nova_bi_authenticated_workflows.sql |
| 20261101153622 | nova_bi_membership_rls_recursion_fix | 20261101000004_nova_bi_membership_rls_recursion_fix.sql |
| 20261101154237 | nova_bi_trigger_guarded_mutations | 20261101000006_nova_bi_trigger_guarded_mutations.sql |
| 20261101154631 | nova_bi_white_label_branding | 20261101000007_nova_bi_white_label_branding.sql |
| 20261101154913 | nova_bi_team_invitations | 20261101000008_nova_bi_team_invitations.sql |
| 20261101155313 | nova_bi_data_lifecycle | 20261101000009_nova_bi_data_lifecycle.sql |
| 20261101163655 | nova_bi_api_rate_limits | 20261101000010_nova_bi_api_rate_limits.sql |
| 20261101163845 | nova_bi_rate_limit_deny_policy | 20261101000011_nova_bi_rate_limit_deny_policy.sql |
| 20261106130204 | nova_bi_membership_accept_status_grant | 20261106130204_nova_bi_membership_accept_status_grant.sql |

Pending candidate changes (not found in live history):
- 20261106195900_nova_bi_rate_limit_search_path_hardening.sql
- 20261108120000_nova_bi_audit_admin_read_only.sql

## Why this blocks deployment

Supabase's CLI uses migration timestamps to compare local files with supabase_migrations.schema_migrations; it does not infer equivalence from migration names or SQL bodies. The eleven local versions can therefore be treated as missing even though the live database records corresponding logical names under different timestamps. Replaying those migrations against an already-populated schema can fail or produce unexpected policy/function changes.

A fresh PostgreSQL CI reset tests that the candidate migration set works on a clean database. It does not test the connected production project's migration-history reconciliation.

## Required safe procedure

1. An authorized database administrator must obtain the exact deployed SQL/source for each of the eleven live migrations and compare it with the candidate file bearing the corresponding logical name. Current schema inspection alone is not proof that every migration side effect is equivalent.
2. On a controlled local checkout linked to the intended project, run supabase migration list --remote and inspect the mismatch.
3. Run supabase db push --dry-run --remote to see precisely what the CLI proposes to apply. Do not run a normal push while the eleven-version mismatch remains.
4. After SQL equivalence has been independently proven, choose and review a single reconciliation strategy: rename local migration files to the exact recorded live timestamps, or use supabase migration repair --status applied <exact-local-version> --remote for the matching files. Do not apply both strategies. Migration repair changes tracking history only; it does not execute SQL or validate equivalence.
5. Re-run migration list and dry-run. The only pending migrations should be the two hardening migrations listed above. If anything else appears, stop and reconcile again.
6. Test the two pending migrations on a production-like restored backup, inspect the SQL diff and rollback/recovery plan, then obtain explicit owner approval before applying to production.
7. After applying, verify live migration history, audit SELECT policy, rate-limit function search_path and execute ACL, Security/Health Advisors, and authenticated browser CORS smoke tests.

## Current live facts

- All ten nova_bi_* tables currently have RLS enabled.
- Security Advisor and Health Advisor currently return no findings.
- Live audit policy nova_bi_audit_read_member still permits all active organization members to read audit events; candidate migration narrows this to owners/admins.
- Live nova_bi_consume_rate_limit remains SECURITY DEFINER with search_path=public, pg_temp; execute is limited to postgres and service_role. Candidate migration pins an empty search path.
- Live Edge Function nova-bi-api is ACTIVE v13 with JWT verification enabled and still has wildcard CORS. Candidate exact-origin CORS is not deployed.

## Explicitly not done

No migration repair, db push, SQL execution, Edge Function deployment, Auth setting change or production resource modification was performed. Keep PR #73 Draft and the release decision NO-GO until reconciliation and the other live release gates are completed.
