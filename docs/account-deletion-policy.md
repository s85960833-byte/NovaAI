# NOVA Account Deletion Policy — Draft

> DRAFT — not approved for publication or execution. This document is a technical policy proposal, not legal advice. The operator must approve it and obtain qualified privacy counsel review before enabling account deletion.

## 1. Current behavior

- The existing Delete cloud backup control deletes only the signed-in user's public.nova_user_workspaces row. It does not delete the Supabase Auth identity, company data, Storage objects, provider-held copies, logs or backups.
- DELETE /api/account is disabled unless ACCOUNT_DELETION_ENABLED=1.
- The current endpoint supports an authenticated dry-run inventory and blocks shared-company owners who have other members.
- Destructive execution deliberately returns 503 account_deletion_execution_requires_approved_data_lifecycle. No data or Auth identity is deleted by this route.

## 2. Eligibility, confirmation and ownership

1. Require a verified Supabase Auth user and a fresh session/step-up confirmation before execution.
2. Require an explicit confirmation string and provide a dry-run summary first.
3. If the user owns an organization with any other members, return HTTP 409 and require an authorised ownership transfer before reconsidering deletion.
4. Never cascade-delete a shared organization or its datasets, analyses, workflows, approvals, audit history or branding as a side-effect of deleting one account.
5. Records authored by a departing member in a shared tenant require an owner-approved retention, reassignment or anonymisation policy. Audit actor attribution must not be falsified.
6. Storage buckets and user-prefix mappings must be inventoried and approved before any object is deleted.

## 3. Proposed execution order — not implemented

1. Create a durable deletion job and verified dry-run snapshot.
2. In one PostgreSQL transaction, delete only explicitly approved user-owned rows; preserve shared company records and audit evidence according to the approved retention policy.
3. Delete only Storage objects whose bucket and ownership prefix were verified for that user.
4. Delete the Supabase Auth user using the server-side Admin API.
5. Write a non-PII completion audit record containing a keyed pseudonymous user reference, deletion-job id, completion time and retained-data exceptions.
6. Revoke active sessions and ensure protected routes reject deleted/inactive identities. Retry or reconcile partial cross-service failures with an idempotent deletion job.

PostgreSQL, Storage and Auth are separate systems; a single database transaction cannot make the whole sequence atomic. A durable, resumable saga and reconciliation plan are required.

## 4. Retention proposal

All figures below are PROPOSED — owner/lawyer तय करे. These are not current NOVA guarantees.

| Data category | Proposed period | Required decision |
|---|---:|---|
| Primary account data | Delete after verified request and approved exceptions | Define lawful exceptions and request SLA |
| Deletion job metadata | 90 days | Keep status and non-PII failure/retry details |
| Operational application logs | 30 days | Redact tokens, prompts and direct identifiers |
| Security/audit events | 365 days | Decide lawful purpose, access and minimisation |
| Backups containing account data | 35 days maximum expiry | Define backup rotation, restoration filters and deletion tombstones |
| Provider-side prompt/output data | Provider-specific; not controlled by NOVA alone | Verify each provider's deletion and retention terms |
| Legal hold / dispute records | Case-specific | Counsel determines basis, access and release |

## 5. Backup and recovery

- Before any destructive execution, take and verify an encrypted backup of affected database data and relevant Storage metadata.
- Record backup id, timestamp, checksum, retention expiry and restore-test evidence in the restricted operations log.
- Test restore into an isolated project; do not restore deleted personal data into active use without an approved legal basis.
- A restore must replay deletion tombstones/requests so that previously deleted accounts are not silently reintroduced.
- Never log service-role credentials, access tokens, passwords, full email addresses or chat contents in a deletion audit.

## 6. Operational controls

- Keep ACCOUNT_DELETION_ENABLED=0 until legal review, data inventory, ownership transfer, transactional migration, Storage rules, Auth Admin tests, backup restore and incident rollback are approved.
- Keep SUPABASE_SERVICE_ROLE_KEY server-side only in the hosting environment. Never put it in client code, .env.example with a real value, logs or screenshots.
- Use a disposable Supabase project and synthetic users for testing. No Production account or data is an acceptable test fixture.
