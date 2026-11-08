# NOVA BI Supabase migration reconciliation

**Status: production migration execution remains BLOCKED.** The candidate's migration history and SQL lineage have been re-audited, but no remote migration repair or production SQL was executed.

## Live project evidence

- Supabase project: `qrfwsewppafhxibdboam`, PostgreSQL 17.11, region `eu-west-1`.
- Remote migration history has 12 entries. Its latest entry is `20261106130204_nova_bi_membership_accept_status_grant`.
- The candidate has the 12 corresponding historical logical migrations plus three forward-only hardening/repair migrations:
  - `20261106195900_nova_bi_rate_limit_search_path_hardening.sql`
  - `20261108120000_nova_bi_audit_admin_read_only.sql`
  - `20261108120100_nova_bi_branding_backfill.sql`
- Direct read-only SQL inspection found 10 `nova_bi_*` tables, all with RLS enabled; current organizations, memberships, datasets, analyses, workflows, audit events, branding and rate-limit rows are all zero.
- Security Advisor and Health Advisor returned no findings at the last check.
- Live audit SELECT still permits all active organization members. Live `nova_bi_consume_rate_limit` is SECURITY DEFINER with `search_path=public, pg_temp`, and its execute ACL is limited to postgres/service_role.
- Live Edge Function `nova-bi-api` remains ACTIVE v13 with JWT verification enabled and wildcard CORS. Candidate exact-origin CORS is not deployed.

## Remote version to candidate source mapping

The live names map to these repository migrations. The source commit column records the Git commit that introduced the logical migration on the original BI branch; it is provenance evidence, not proof of the exact SQL payload submitted to Supabase.

| Live version | Live migration name | Candidate file | Source commit |
|---|---|---|---|
| 20261101153420 | nova_bi_tenant_schema | 20261101000000_nova_bi_tenant_schema.sql | 1bfedfd9a1753229b2975bc31d87d558a7cd7bdc |
| 20261101153427 | nova_bi_workflow_execution_hardening | 20261101000001_nova_bi_workflow_execution_hardening.sql | 307d0fcfb8988d27996c5a3bb278544d234163b6 |
| 20261101153432 | nova_bi_rls_policy_corrections | 20261101000002_nova_bi_rls_policy_corrections.sql | 4045bf702c4b286037f021c66954df67abc4d7a8 |
| 20261101153602 | nova_bi_authenticated_workflows | 20261101000003_nova_bi_authenticated_workflows.sql | 7dd0068b86bf5c0e4d8c18095c9ccc76c1cc1183 |
| 20261101153622 | nova_bi_membership_rls_recursion_fix | 20261101000004_nova_bi_membership_rls_recursion_fix.sql | b92c58f57b8ffff98d3e667a55d91aae1807216d |
| 20261101154237 | nova_bi_trigger_guarded_mutations | 20261101000006_nova_bi_trigger_guarded_mutations.sql | 96fb8b534b51d386edc4e91eb7f2eece70b07602 |
| 20261101154631 | nova_bi_white_label_branding | 20261101000007_nova_bi_white_label_branding.sql | 865e32f83735c62aedf1477f9a38340513ddcfda |
| 20261101154913 | nova_bi_team_invitations | 20261101000008_nova_bi_team_invitations.sql | b73e3cd8463895f1f04b78ff885b8d77c6779cd2 |
| 20261101155313 | nova_bi_data_lifecycle | 20261101000009_nova_bi_data_lifecycle.sql | 91748cb08fd705129960cb5380d9f5f2aa7a3052 |
| 20261101163655 | nova_bi_api_rate_limits | 20261101000010_nova_bi_api_rate_limits.sql | b82c821478b42e4617cd93f3ab2f78a5af11d2a1 |
| 20261101163845 | nova_bi_rate_limit_deny_policy | 20261101000011_nova_bi_rate_limit_deny_policy.sql | cda1f4465e4db5e749cfe00a7f8c7c9210e834ec |
| 20261106130204 | nova_bi_membership_accept_status_grant | 20261106130204_nova_bi_membership_accept_status_grant.sql | a24bc141721617d39195d758aa389290d7e47fdf |

## Historical migration immutability corrections

The audit found two post-application edits in historical migration files. They have now been separated into forward-only migrations so the old files retain their original SQL:

1. **Branding backfill:** the historical `20261101000007_nova_bi_white_label_branding.sql` has been restored to its original Git-introduced contents. The additional idempotent backfill is now isolated in `20261108120100_nova_bi_branding_backfill.sql`. New organizations already receive branding atomically through the organization bootstrap trigger. The forward migration also covers any pre-existing organization missing its branding row.
2. **Rate-limit search_path:** the historical `20261101000010_nova_bi_api_rate_limits.sql` has been restored to its original `search_path=public, pg_temp` definition. The empty-search-path change and execute-ACL hardening remain in the separate forward migration `20261106195900_nova_bi_rate_limit_search_path_hardening.sql`. This preserves the already-applied migration instead of silently editing it.

The tenant-schema file differs from its introducing commit only in a comment describing the approved project; no SQL statement changed. The remaining historical SQL files were compared against their introducing Git snapshots and were byte-identical at the time of this audit. This still cannot prove which exact payload was executed remotely because Supabase's migration history stores version/name metadata, not the submitted SQL body.

## Why deployment is still blocked

Supabase CLI reconciles migration versions by timestamp, not by logical name or SQL equivalence. The first eleven live versions therefore do not match the local filename timestamps. Replaying those files may conflict with existing objects or alter live policies. A clean PostgreSQL CI reset proves that the candidate migration set works from an empty database; it does not prove that remote migration history can safely be reconciled.

## Required safe procedure

1. An authorized database administrator must review the mapping above and compare each historical migration with the actual deployment record/source and live schema. Git provenance alone is not sufficient evidence of the executed payload.
2. In a controlled checkout linked to the intended project, run `supabase migration list --remote` and inspect every mismatch.
3. Run `supabase db push --dry-run --remote`; do not run a normal push while historical timestamps remain unresolved.
4. After equivalence is proven, select one reviewed reconciliation strategy: align local filenames to the exact recorded remote versions, or use `supabase migration repair --status applied` for exact local versions. Do not mix strategies. Migration repair changes tracking history only; it does not execute or validate SQL.
5. Re-run migration list and dry-run. The only pending files should be the three forward migrations listed above. If any historical migration appears pending, stop.
6. Test those three migrations on a production-like restored backup, inspect the exact SQL diff and recovery plan, then obtain explicit project-owner approval before production application.
7. After application, verify remote history, audit SELECT policy, rate-limit function search_path/execute ACL, Security/Health Advisors and authenticated browser CORS from the actual deployed origin.

## Explicitly not done

No migration repair, remote db push, production SQL, Edge Function deployment, Auth/SMTP setting change or Render deployment was performed. Keep PR #74 Draft and the release decision NO-GO until reconciliation and all other release gates are completed.
