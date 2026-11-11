#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
: "${PGDATABASE:=nova_bi_test}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

fixture_table="public.nova_mission_concurrency_fixture"
psql -v ON_ERROR_STOP=1 <<'SQL'
create table public.nova_mission_concurrency_fixture (
  mission_id uuid not null,
  run_id uuid not null,
  lease_token uuid not null
);
grant insert on public.nova_mission_concurrency_fixture to service_role;
insert into auth.users(id,email)
values ('11111111-1111-4111-8111-111111111112','mission-concurrency@example.test')
on conflict (id) do nothing;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $fixture$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111112';
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
begin
  v_mission := public.nova_create_mission(
    v_owner,'Concurrent action reservation regression',
    'Only one unresolved mission action may be reserved at once','agents',
    'mission-concurrent-action-reservation-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Concurrent action task","description":"Race two independent reservations","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Race two independent reservations"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-concurrent-action-001','Run concurrent reservation regression'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved concurrency fixture');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'concurrent-reservation-worker',120);
  insert into public.nova_mission_concurrency_fixture(mission_id,run_id,lease_token)
  values(v_mission,v_run,v_token);
end;
$fixture$;
reset role;
SQL

IFS='|' read -r mission_id run_id lease_token < <(
  psql -v ON_ERROR_STOP=1 -At -F '|' -c \
    "select mission_id,run_id,lease_token from public.nova_mission_concurrency_fixture"
)
if [[ -z "${mission_id:-}" || -z "${run_id:-}" || -z "${lease_token:-}" ]]; then
  echo "Could not create the concurrent reservation fixture" >&2
  exit 1
fi

run_reservation() {
  local action_key="$1"
  local output_file="$2"
  local error_file="$3"
  psql -v ON_ERROR_STOP=1 -At >"$output_file" 2>"$error_file" <<SQL
select set_config('request.jwt.claim.role','service_role',false);
select action_id from public.nova_reserve_mission_action(
  '$run_id'::uuid,
  '$lease_token'::uuid,
  '$action_key',
  repeat('a',64)
);
SQL
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"; psql -v ON_ERROR_STOP=1 -c "drop table if exists public.nova_mission_concurrency_fixture" >/dev/null' EXIT

run_reservation "concurrent-action-alpha" "$tmp_dir/alpha.out" "$tmp_dir/alpha.err" &
pid_alpha=$!
run_reservation "concurrent-action-beta" "$tmp_dir/beta.out" "$tmp_dir/beta.err" &
pid_beta=$!

alpha_ok=0
beta_ok=0
if wait "$pid_alpha"; then alpha_ok=1; fi
if wait "$pid_beta"; then beta_ok=1; fi

successes=$((alpha_ok + beta_ok))
reserved_count="$(psql -v ON_ERROR_STOP=1 -At -c \
  "select count(*) from public.nova_mission_action_receipts where mission_id='$mission_id'::uuid and status='reserved'")"

if [[ "$successes" -ne 1 || "$reserved_count" -ne 1 ]]; then
  echo "Concurrent reservation invariant failed: successful_calls=$successes reserved_receipts=$reserved_count" >&2
  echo "--- alpha stdout ---"; cat "$tmp_dir/alpha.out"
  echo "--- alpha stderr ---"; cat "$tmp_dir/alpha.err"
  echo "--- beta stdout ---"; cat "$tmp_dir/beta.out"
  echo "--- beta stderr ---"; cat "$tmp_dir/beta.err"
  exit 1
fi

echo "Concurrent mission-wide reservation race passed: exactly one action reserved; competing action rejected."
