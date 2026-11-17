# Backup and Restore Runbook

## Synthetic CI rehearsal (Phases 1–6)
- CI starts an isolated local Supabase stack using only `supabase-v2/`.
- The database job dumps only `nova2_staging` with `pg_dump --format=custom`.
- It restores that dump into a separate local database named `nova2_restore_check`.
- CI checks that the restored schema contains the expected tables.
- This rehearsal contains only generated synthetic rows; it does not connect to hosted or production data.
- The exact command and pass/fail output are recorded in the GitHub Actions database job.

## Hosted free staging
- The Render Free Postgres database is temporary, has no automatic backups and expires; it is not a durable backup target.
- Render's SQL connector is read-only, so a full hosted dump/restore cannot be performed from this environment.
- Hosted Render backup/restore drill: **NOT VERIFIED**. Do not claim that the hosted database has a backup.

## Restore procedure (isolated test only)
1. Stop test traffic and record the staging commit/schema version.
2. Take a custom-format dump of the synthetic staging schema only.
3. Create a new empty test database; never restore over production or NOVA 1.0.
4. Restore with `pg_restore --no-owner`.
5. Verify table count, indexes, triggers, constraints and synthetic wallet balances.
6. Run `npm run test:db` and API health/smoke tests.
7. Keep or discard the temporary restore database only through the approved test environment.

## Production
Production backups, snapshots and restore are out of scope. No production resource or data is accessed or changed in Phases 1–6.
