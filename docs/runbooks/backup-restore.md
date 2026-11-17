# Backup and Restore Runbook

- The free staging database must contain synthetic data only.
- Export only test data; never copy production data.
- Record schema migration version and seed version.
- Restore into a new isolated test database, not production.
- Run row-count, ownership and referential-integrity checks after restore.
- Free Render Postgres has no backups and expires after 30 days; it is not a durable backup target.
- A real production backup/restore drill is NOT AUTHORIZED in Phases 1–6.
