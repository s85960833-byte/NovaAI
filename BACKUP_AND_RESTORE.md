# NOVA AI — Supabase Backup and Restore Runbook

**Status:** Documented procedure only. **No backup export or restore drill has been performed.** This is not proof of recoverability. A responsible adult project owner/operator must execute and verify it. Never send database URLs, passwords, service-role keys or backup files in chat or GitHub.

## 1. Current facts and scope

- Supabase project: `qrfwsewppafhxibdboam`; PostgreSQL 17.11; region `eu-west-1`.
- Project metadata available during this review did not expose the current billing plan. The account owner must check the Dashboard.
- Supabase documentation says managed daily backups are available on Pro, Team and Enterprise. Free-tier projects should regularly export their data with the Supabase CLI and keep an off-site copy.
- The documented CLI `db dump` path requires Supabase CLI and Docker Desktop; the manual restore uses PostgreSQL client tools such as `psql`.
- Supabase CLI logical database dumps exclude managed `auth` and `storage` schemas and extension-managed schemas. Database backups do not include the actual Storage objects. A SQL dump alone is **not** a complete NOVA project/account backup or a complete handover.
- Edge Function source lives in `supabase/functions/` in this repository. Deployed function versions, secrets, Auth settings, SMTP/OAuth configuration, Storage objects and project settings need separate inventory/recreation.

Official references reviewed 12 November 2026:
- Database Backups: https://supabase.com/docs/guides/platform/backups
- Backup and Restore using CLI: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
- Storage-object migration instructions: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## 2. Before an export

1. Use a private owner-controlled workstation and the account managed by the responsible adult operator.
2. Install a current supported Supabase CLI, Docker Desktop and PostgreSQL client tools. Record the CLI version and source PostgreSQL major version.
3. In the Supabase Dashboard, open the correct project and use **Connect** to obtain a database connection string. Prefer the Session Pooler unless the network supports the direct connection route.
4. Keep the database URL in a private process environment or approved secret manager. Do not paste it into chat, source code, tickets, command history, logs or a tracked file.
5. Create a private backup directory outside the repository. Restrict file permissions and encrypt the directory using an owner-controlled method.

## 3. Logical database export

In a private terminal session, set `SUPABASE_DB_URL` to the database URL without echoing it. Run:

```sh
supabase db dump --db-url "$SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$SUPABASE_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Keep the resulting files encrypted and outside Git. Record export timestamp, project reference, CLI version, PostgreSQL version and file sizes in a private owner-controlled inventory. Generate checksums, for example:

```sh
sha256sum roles.sql schema.sql data.sql
```

On Windows, `certutil -hashfile schema.sql SHA256` can calculate a file hash; repeat for each file. These commands create logical dumps for the schemas covered by the Supabase CLI. They do **not** export Auth user records, actual Storage objects, Edge Function secret values, Auth provider/SMTP settings, API keys, DNS or Render environment-variable values.

## 4. Other assets to export or reconfigure separately

- **Storage objects:** inventory buckets, privacy settings and object paths; export actual files using Supabase's documented Storage migration method or a reviewed owner-controlled script. Exporting only database metadata is insufficient.
- **Auth:** record enabled providers, Site URL, redirect allow-list, SMTP configuration owner, OAuth provider configuration and required secret names in a separate encrypted operator checklist. The CLI SQL dump above does not include the `auth` schema or user records. Account migration requires a separate supported process and privacy/legal review.
- **Edge Functions:** retain source and dependency configuration in the repo; separately inventory deployed versions, JWT-verification settings and secret names/owners. Put values only into the receiving owner's secret manager.
- **Database configuration:** record extensions, database webhooks, publications, replication settings, custom schemas and custom roles/password reset requirements.
- **Render:** separately record service settings, environment-variable names only, current deploy SHA, build/start commands, region and health check. Do not place secrets here.
- **Domain, email, payment and analytics:** no production custom domain, email delivery, payment or analytics account was verified during this review. Do not claim those accounts are part of a handover.

## 5. Restore drill — isolated destination only

**Never test restore against Production.** Obtain owner approval for an isolated local database or a separate owner-approved test destination. Do not create any paid resource.

1. Confirm the destination is empty and isolated. Record the PostgreSQL major version, extensions and connection method.
2. Set `TARGET_DB_URL` privately in the terminal environment/secret manager.
3. Follow the current Supabase CLI restore guide. Its documented manual logical restore pattern is:

```sh
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$TARGET_DB_URL"
```

4. Reapply extensions, webhooks, publications, RLS/security configuration and any separately managed schema changes using the current Supabase instructions.
5. Preserve migration history separately if required by the project's migration workflow.
6. Recreate Edge Functions from repository source and reconfigure their secret values in the owner-controlled secret manager.
7. Reconfigure Auth settings/redirects and restore actual Storage objects separately.
8. Verify table counts, relationships, RLS policies, function privileges, Edge Function JWT behavior, Auth sign-in/reset, two-account tenant isolation and a harmless read/write/delete test on the isolated destination.
9. Record errors, timings, row/object counts and checksums. A restore is **not passed** until an operator independently verifies restored application behavior.

The sample restore command is from Supabase's documented logical migration process. Do not execute it blindly: project-specific encryption, extensions, privileged roles and custom schemas may require additional steps. If Vault or column encryption is used, follow the current Supabase special instructions and preserve the required encryption material securely.

## 6. Recovery objectives and acceptance

No measured RPO or RTO exists for NOVA.

- **RPO:** maximum tolerable data loss window, set from actual export frequency and verified backup timestamps.
- **RTO:** measured time until the restored app and database are usable.
- **Acceptance evidence:** encrypted backup inventory, checksums, isolated restore logs, restored table/object counts, Auth/RLS tests, Edge Function check and responsible operator sign-off.

Repeat a restore drill before material releases and on a documented recurring schedule. Keep at least one encrypted copy outside the hosting/database provider account.

## 7. Current release status

- This runbook is documented, not executed.
- No backup file, database password, service-role key or other secret was retrieved or added to the repo.
- No restore result, RPO, RTO or complete portability claim is approved.
- Full database + Auth + Storage + Edge Functions + settings transfer remains a buyer-readiness blocker until verified end to end.
