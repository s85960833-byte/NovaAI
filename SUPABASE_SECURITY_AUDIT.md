# NOVA AI — Supabase Security and Tenant-Isolation Audit

**Audit date:** 12 November 2026 (Asia/Kolkata)  
**Project:** qrfwsewppafhxibdboam  
**Region / engine:** eu-west-1 / PostgreSQL 17.11.0.003  
**Method:** Supabase project metadata, read-only SQL catalog queries, migration inventory, Edge Function metadata/source and Supabase Advisors. No schema/data mutation, user-record inspection, secret retrieval or new project creation.

## Executive result

**Read-only configuration review: PASS with operational limitations.** The project is ACTIVE_HEALTHY. All 11 public base tables have RLS enabled, no anon table grants were found, and the NOVA BI Edge Function requires JWT verification. Security and Health Advisors returned no lints. This is not a penetration test, production-readiness certification, backup/restore proof or end-to-end two-account isolation test.

## Database inventory and access controls

- 17 migration versions are present.
- 11 public base tables; 11/11 have RLS enabled. FORCE ROW LEVEL SECURITY is not enabled; privileged table owners and roles can bypass ordinary RLS, so keep privileged credentials server-side.
- 24 public RLS policies; no public views; no anon table grants.
- The only policy whose role list includes anon is the explicit deny-all policy on nova_bi_rate_limits (USING=false, WITH CHECK=false).
- nova_bi_audit_events SELECT is restricted to active organization members with role owner or admin.
- Workspace sync policies restrict row access to user_id = auth.uid(); NOVA BI tenant policies require active membership and role checks.
- All inspected application tables report zero rows at audit time. This is not a customer or usage metric.

## Privileged functions

Eight public SECURITY DEFINER functions were inspected. All set search_path to the empty path. EXECUTE is false for anon and authenticated, true only for service_role:

- nova_bi_audit_delete
- nova_bi_consume_rate_limit
- nova_bi_create_organization
- nova_bi_decide_workflow
- nova_bi_invite_accept_guard
- nova_bi_is_org_admin
- nova_bi_organization_bootstrap_guard
- nova_bi_workflow_decision_guard

Trigger functions are intended to run through their associated triggers. The rate-limit RPC is service-role-only and called from the Edge Function's server-side admin client.

## Edge Function verification

- nova-bi-api is ACTIVE version 14 with verify_jwt=true.
- Source uses authenticated user context, configured-site CORS, bounded JSON body reading, 120 API requests per 60 seconds per user and 5 invitations per hour per user.
- The deployed files index.ts, cors.ts, invitations.ts, request-input.ts and deno.json were compared with the PR candidate files; all five matched byte-for-byte at the time of inspection.
- Live invocation with valid/invalid JWT, email delivery, redirect allow-list and two-account cross-tenant attempts were not performed in this read-only review.

## Supabase Advisor results

- Security Advisor: no lints returned.
- Health Advisor: no lints returned.
- Performance Advisor: 13 INFO-level unused_index findings. Since all inspected application tables report zero rows, no index was dropped. Reassess after representative traffic exists.

## Remaining tests

1. Verify signup, email confirmation, password reset and Auth redirect allow-list in Staging.
2. Use two controlled test accounts for cross-tenant read/write/delete denial tests against the live Edge Function.
3. Verify service-role keys exist only in Supabase server-side secrets, never browser code, logs or repository.
4. Verify backup schedule, encrypted export, isolated restore and measured recovery time.
5. Implement and verify self-service account deletion, cloud-backup deletion and retention schedule.
6. Verify data export/deletion and consent against the final privacy notice with qualified review.
7. Re-run Advisors after schema changes and representative non-sensitive traffic.

**No database change was made during this audit.** Advisor results are current configuration evidence only, not a security guarantee.
