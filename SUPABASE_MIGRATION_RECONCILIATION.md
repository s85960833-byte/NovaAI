# NOVA BI Supabase migration reconciliation

**Status: local version mapping reconciled; remote dry-run and production application still require authorized DBA review.**

## Live project evidence

- Supabase project: `qrfwsewppafhxibdboam`, PostgreSQL 17.11, region `eu-west-1`.
- Remote migration history contains 12 entries and ends at `20261106130204_nova_bi_membership_accept_status_grant`.
- The candidate's 12 historical migration files have now been renamed to the exact version timestamps and logical names recorded by the remote migration ledger. Supabase CLI compares version timestamps; the local filenames now match those remote versions.
- Three forward-only candidate migrations remain pending:
  - `20261106195900_nova_bi_rate_limit_search_path_hardening.sql`
  - `20261108120000_nova_bi_audit_admin_read_only.sql`
  - `20261108120100_nova_bi_branding_backfill.sql`
- Direct read-only SQL inspection found 10 `nova_bi_*` tables, all with RLS enabled; current organizations, memberships, datasets, analyses, workflows, audit events, branding and rate-limit rows are all zero.
- Security Advisor and Health Advisor returned no findings at the last check.
- Live audit SELECT still permits all active organization members. Live `nova_bi_consume_rate_limit` is SECURITY DEFINER with `search_path=public, pg_temp`, and execute is limited to postgres/service_role.
- Live Edge Function `nova-bi-api` remains ACTIVE v13 with JWT verification enabled and wildcard CORS. Candidate exact-origin CORS is not deployed.

## Remote migration mapping

| Remote version | Remote migration name | Candidate filename |
|---|---|---|
| 20261101153420 | nova_bi_tenant_schema | 20261101153420_nova_bi_tenant_schema.sql |
| 20261101153427 | nova_bi_workflow_execution_hardening | 20261101153427_nova_bi_workflow_execution_hardening.sql |
| 20261101153432 | nova_bi_rls_policy_corrections | 20261101153432_nova_bi_rls_policy_corrections.sql |
| 20261101153602 | nova_bi_authenticated_workflows | 20261101153602_nova_bi_authenticated_workflows.sql |
| 20261101153622 | nova_bi_membership_rls_recursion_fix | 20261101153622_nova_bi_membership_rls_recursion_fix.sql |
| 20261101154237 | nova_bi_trigger_guarded_mutations | 20261101154237_nova_bi_trigger_guarded_mutations.sql |
| 20261101154631 | nova_bi_white_label_branding | 20261101154631_nova_bi_white_label_branding.sql |
| 20261101154913 | nova_bi_team_invitations | 20261101154913_nova_bi_team_invitations.sql |
| 20261101155313 | nova_bi_data_lifecycle | 20261101155313_nova_bi_data_lifecycle.sql |
| 20261101163655 | nova_bi_api_rate_limits | 20261101163655_nova_bi_api_rate_limits.sql |
| 20261101163845 | nova_bi_rate_limit_deny_policy | 20261101163845_nova_bi_rate_limit_deny_policy.sql |
| 20261106130204 | nova_bi_membership_accept_status_grant | 20261106130204_nova_bi_membership_accept_status_grant.sql |

## Historical migration immutability

- The historical branding migration was restored to its original SQL. The extra idempotent branding backfill is isolated in `20261108120100_nova_bi_branding_backfill.sql`.
- The historical rate-limit migration was restored to its original `search_path=public, pg_temp` definition. The empty-search-path and execute-ACL hardening remain in forward migration `20261106195900_nova_bi_rate_limit_search_path_hardening.sql`.
- The tenant-schema migration differs from its introducing Git commit only in a descriptive comment; its SQL statements are unchanged. The other historical migration files were compared against their introducing Git snapshots and matched.
- Git provenance and live version/name mapping now align, but the remote ledger does not store the SQL payload itself. A local filename match does not prove which exact SQL body was submitted to the remote database.

## Required pre-deployment verification

1. In a controlled checkout linked to the intended project, run `supabase migration list --remote` and verify that all 12 historical versions are paired, with only the three forward migrations pending.
2. Run `supabase db push --dry-run --remote`. Do not run a normal push yet. If the dry-run proposes any historical migration, stop and investigate.
3. Review the three forward migrations against a production-like restored backup and verify the recovery/rollback plan.
4. Obtain explicit project-owner approval before applying any migration to production.
5. After application, verify remote history, audit SELECT policy, rate-limit function search_path/execute ACL, Security/Health Advisors and authenticated browser CORS from the actual deployed origin.

No remote migration repair, db push, production SQL, Edge Function deployment, Auth/SMTP setting change or Render deployment was performed. Keep PR #74 Draft and release NO-GO until dry-run, owner approval and all other release gates are complete.
