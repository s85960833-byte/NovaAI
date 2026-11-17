# Backup and Restore Runbook

## Automated isolated CI rehearsal — PASS

GitHub Actions run #513, database job, 2026-11-17:
1. Started a fresh local Supabase stack (Supabase CLI 3.2.0, Postgres 17.12).
2. Ran `supabase db reset` against the isolated CI database; migration `20261117120000_nova2_initial.sql` applied from scratch.
3. Ran RLS/schema checks and synthetic account export/deletion lifecycle SQL.
4. Ran 5 durable mock-wallet DB integration tests.
5. Used a disposable `postgres:17-alpine` client container to create a custom-format dump of schema `nova2_staging`, restore it into separate local database `nova2_restore_check`, and compare table row counts.
6. Stopped the Supabase stack after the tests.

**Measured result**
- `RLS_AND_SCHEMA_CHECK_PASS`
- `ACCOUNT_EXPORT_RLS_ISOLATION_PASS`
- `ACCOUNT_DELETE_CASCADE_AND_USAGE_ANONYMISATION_PASS`
- DB integration file: 5 passed (107 ms).
- `SYNTHETIC BACKUP/RESTORE PASS: 5 tables; row counts 3:3:5:6:2`
- Artifact #14347895119 contains `nova2-staging.dump` (15,418 bytes) and `nova2-staging.contents` (2,384 bytes).

Integration coverage includes capture, invalid signature, duplicate and reused event ID, refund and second-refund rejection, delayed capture after payment failure, late failure after capture, concurrent duplicate delivery, insufficient balance, spend idempotency, ledger/cache reconciliation, append-only enforcement, spend caps, provider failure and injected slow-database timeout.

The test uses generated synthetic rows only. Account lifecycle checks run inside a transaction and end with ROLLBACK; sample identities are not persisted. Restore target is a separate disposable local DB.

## Hosted Free staging

- Render Free Postgres is used for synthetic staging data only.
- Render SQL access available in this session is read-only; a hosted database dump/restore or rollback could not be performed.
- Hosted staging backup/restore: **NOT VERIFIED**. Do not assume a Free plan backup exists or that the CI dump is a hosted backup.

## Restore procedure (isolated test only)

1. Record source schema version and take a custom-format dump using a PostgreSQL client matching the server major version.
2. Create a new, empty test database; never restore over production or NOVA 1.0.
3. Restore using `pg_restore --no-owner --single-transaction`.
4. Compare table and row counts; verify indexes, triggers, constraints and wallet balance/ledger reconciliation.
5. Run schema/RLS assertions, `npm run test:db`, then API health and synthetic mock smoke checks.
6. Retain the dump only as test evidence; discard only through approved test-environment controls.

## Production

Production snapshots, backup and restore were not accessed or changed in Phase 1–6. Production backup/restore and rollback are NOT RUN and NOT AUTHORISED.
