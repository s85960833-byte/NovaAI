# NOVA AI — Backup and Restore Runbook (Draft)

> Operational draft. Do not use against Production until an authorised operator approves scope, backup target, access controls and maintenance window. Prefer an isolated staging project with synthetic data.

## Before backup

1. Identify the exact Supabase project/environment and scope (Postgres, Storage objects and configuration metadata).
2. Confirm the operator is authorised to export the data and has a secure encrypted destination.
3. Record current migration revision, schema version, service version and backup timestamp.
4. Restrict backup access; never export Auth passwords, raw access tokens or unnecessary chat content.
5. Verify available storage, retention expiry, encryption and checksum method.

## Backup verification

- [ ] Export the database using the approved provider-supported method.
- [ ] Export Storage object inventory and required objects separately; a Postgres dump does not guarantee Storage files are included.
- [ ] Record backup identifier, environment, timestamp, schema version, object counts and SHA-256 checksum.
- [ ] Verify the backup archive can be read and checksum matches.
- [ ] Store the backup in an access-controlled location separate from the running project.
- [ ] Confirm retention is approved and deletion-request/tombstone handling exists.

## Restore test (isolated project only)

1. Create or select a disposable isolated Supabase project. Confirm its project reference is not Production.
2. Restore schema and data using the vendor-supported process and recorded migration revision.
3. Restore required Storage objects and verify counts/checksums.
4. Apply only migration history needed for the isolated project; do not replay destructive changes blindly.
5. Run migration tests, RLS isolation tests, Auth smoke tests with synthetic users and application health checks.
6. Confirm user A cannot read/change/delete user B data; verify shared-organization ownership and audit history.
7. Verify deletion tombstones/requests remain enforced so deleted accounts are not silently reintroduced.
8. Record duration, failures, row/object counts, checksum results and reviewer sign-off.

## Recovery / rollback

- Stop writes to the affected environment before restore, after operator approval.
- Preserve logs and the pre-restore snapshot for incident analysis.
- Restore only into the intended isolated environment until the owner authorises any production recovery.
- Reconcile records created after the backup from approved sources; document potential data loss.
- Run post-restore security and RLS checks before reopening access.
- Do not return deleted personal data to active service without an approved legal basis and tombstone reconciliation.

