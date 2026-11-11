#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
: "${PGDATABASE:=nova_bi_test}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

# Supabase migration versions are UTC timestamps in YYYYMMDDHHmmss form.
# Reject impossible calendar/time values (for example, hour 28) before applying SQL.
for migration in supabase/migrations/202611*.sql; do
  version=${migration##*/}
  version=${version%%_*}
  if ! node -e '
    const value = process.argv[1];
    if (!/^\\d{14}$/.test(value)) process.exit(1);
    const parts = value.match(/^(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})$/).slice(1).map(Number);
    const [year, month, day, hour, minute, second] = parts;
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const valid = date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 && date.getUTCDate() === day &&
      date.getUTCHours() === hour && date.getUTCMinutes() === minute &&
      date.getUTCSeconds() === second;
    if (!valid) process.exit(1);
  ' "$version"; then
    echo "Invalid Supabase migration UTC timestamp: $migration" >&2
    exit 1
  fi
done

psql -v ON_ERROR_STOP=1 <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique
);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
SQL

for migration in supabase/migrations/202611*.sql; do
  echo "Applying ${migration}"
  psql -v ON_ERROR_STOP=1 -f "${migration}"
done

psql -v ON_ERROR_STOP=1 -f scripts/supabase-rls-integration.sql
psql -v ON_ERROR_STOP=1 -f scripts/mission-resolved-action-completion.sql
psql -v ON_ERROR_STOP=1 -f scripts/mission-verifier-nonce-replay.sql
