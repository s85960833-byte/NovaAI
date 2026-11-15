# NOVA AI — Account Deletion and Data-Lifecycle Review

**Audit date:** 12 November 2026  
**Project:** Supabase `qrfwsewppafhxibdboam`, PostgreSQL 17.11.  
**Method:** Read-only PostgreSQL catalog query, migration/source and UI review. No user records were inspected, no deletion was executed and no schema was changed.

## Executive finding

**Full self-service Auth account deletion is not implemented.** The account UI's **Delete cloud backup** action removes only the row in `public.nova_user_workspaces`; it does not delete the Supabase Auth identity, BI tenant data, Storage objects, external-provider content, logs or backups.

A read-only query over `pg_constraint` found these public foreign-key relationships to `auth.users(id)`:

| Table | Column | ON DELETE |
|---|---|---|
| `nova_bi_analyses` | `created_by` | RESTRICT |
| `nova_bi_datasets` | `created_by` | RESTRICT |
| `nova_bi_memberships` | `user_id` | RESTRICT |
| `nova_bi_organizations` | `created_by` | RESTRICT |
| `nova_bi_workflow_approvals` | `actor_id` | RESTRICT |
| `nova_bi_workflow_proposals` | `created_by` | RESTRICT |
| `nova_bi_audit_events` | `actor_id` | SET NULL |
| `nova_user_workspaces` | `user_id` | CASCADE |

There are six RESTRICT relationships, one SET NULL and one CASCADE. This is a schema-level result, not a test against any user's records.

## Existing implementation facts

- `nova-account.js` has a **Delete cloud backup** control which deletes the current user's row from `nova_user_workspaces` and disables sync.
- That control is not full account deletion. It does not call Supabase Auth Admin `deleteUser`.
- No complete self-service Auth account deletion endpoint or approved deletion-request workflow was found in the client/server/Edge Function source.
- The Edge Function uses privileged Auth deletion only as compensation for failed invitation setup; this is not a user account deletion workflow.
- Supabase documents that deleting an Auth user does not instantly invalidate already-issued access tokens. Session revocation/expiry and server-side authorization checks must be part of a safe process.

## Why a blind delete endpoint is unsafe

1. Six RESTRICT foreign keys can prevent Auth deletion while BI records or memberships remain.
2. Cascading organization deletion can remove datasets, analyses, proposals, approvals and audit history belonging to other members.
3. Reassigning authorship or approval actors without an approved retention policy can falsify audit records.
4. Deleting only the cloud backup can be mistaken for deleting the entire account.
5. Storage objects, Auth data, provider-held content, backups and logs require separate deletion/retention handling.
6. Already-issued JWTs may remain usable until expiry unless sessions/authorization are explicitly handled.

## Required safe deletion design

1. Publish a data map covering each user/tenant table, Storage bucket, provider, log, backup and retention period.
2. Require a fresh verified session and explicit confirmation; show affected organisations, memberships and authored records before execution.
3. If the user owns an organisation with other members, require an authorised ownership transfer or an approved closure process. Never silently delete a shared tenant.
4. Define what happens to authored datasets, analyses, workflow proposals, approvals and audit events: lawful retention, attribution transfer with an audit event, anonymisation, or deletion.
5. Execute privileged deletion only server-side after validating the approved plan; never expose service-role/secret keys in the browser.
6. Revoke sessions/credentials and make protected routes reject deleted/inactive identities, even where a previously-issued token remains unexpired.
7. Handle Storage objects, provider-held data, logs and backup expiry separately; issue a deletion receipt with scope and exceptions.
8. Test in an isolated environment with owner/member/analyst/viewer scenarios, last-owner protection, approval/audit retention, RLS, revocation, retries and recovery. Never test against Production user data.
9. Obtain qualified Indian privacy counsel review for notice, consent, age handling, grievance, retention and deletion exceptions before customer onboarding.

## Current decision

- Full Auth account deletion: **NOT IMPLEMENTED**.
- Delete cloud backup: limited control exists; **not** full account deletion.
- Published retention schedule and complete processor deletion: **NOT VERIFIED / NOT PUBLISHED**.
- Session revocation and cross-tenant deletion-safety workflow: **NOT VERIFIED**.
- **NO-GO** for customer onboarding, confidential company data or complete account-deletion claims.

This is a technical review, not a legal opinion or proof that deletion requests have been processed.
