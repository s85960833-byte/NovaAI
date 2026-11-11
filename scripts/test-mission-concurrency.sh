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
  lease_token uuid not null,
  owner_id uuid,
  action_id uuid
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
  v_race_mission uuid;
  v_race_task uuid;
  v_race_approval uuid;
  v_race_run uuid;
  v_race_token uuid;
  v_race_action uuid;
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
  -- Prepare a second mission with an uncertain action and a fully released lease.
  v_race_mission := public.nova_create_mission(
      v_owner,'Concurrent owner resolution and claim regression',
      'Owner resolution and worker claim must serialize','agents',
      'mission-concurrent-resolution-claim-001','{}'::jsonb
    );
    perform public.nova_save_mission_plan(
      v_owner,v_race_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
      '[{"title":"Concurrent resolution task","description":"Race owner resolution against worker claim","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Race owner resolution against worker claim"}}]'::jsonb
    );
    select id into v_race_task from public.nova_mission_tasks where mission_id=v_race_mission;
    v_race_approval := public.nova_request_task_approval(
      v_owner,v_race_mission,v_race_task,'approval-concurrent-resolution-001',
      'Run owner resolution versus claim regression'
    );
    select id into v_race_run from public.nova_mission_execution_runs where approval_id=v_race_approval;
    perform public.nova_decide_task_approval(v_owner,v_race_approval,'approve',v_owner,'Approved race fixture');
    select lease_token into v_race_token
      from public.nova_claim_mission_task(v_race_run,'resolution-race-initial-worker',120);
    select action_id into v_race_action
      from public.nova_reserve_mission_action(v_race_run,v_race_token,'resolution-race-action',repeat('b',64));
    perform public.nova_mark_mission_action_uncertain(
      v_race_action,v_race_token,'Ambiguous provider result before owner review'
    );
    if public.nova_fail_mission_task(
      v_race_run,v_race_token,'WORKER_INTERRUPTED','Release lease for owner resolution race',0
    ) <> 'authorized' then
      raise exception 'Could not release race fixture worker lease';
    end if;
  insert into public.nova_mission_concurrency_fixture(
    mission_id,run_id,lease_token,owner_id,action_id
  ) values(v_race_mission,v_race_run,v_race_token,v_owner,v_race_action);
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

# Race owner resolution against a new worker claim. Both RPCs must serialize on
# the mission row: either resolution commits first, or claim wins and resolution
# is rejected because the run now has an active lease.
IFS='|' read -r race_mission race_run race_owner race_action < <(
  psql -v ON_ERROR_STOP=1 -At -F '|' -c \
    "select mission_id,run_id,owner_id,action_id from public.nova_mission_concurrency_fixture where action_id is not null"
)
if [[ -z "${race_run:-}" || -z "${race_owner:-}" || -z "${race_action:-}" ]]; then
  echo "Could not create owner-resolution race fixture" >&2
  exit 1
fi

claim_race() {
  psql -v ON_ERROR_STOP=1 -At <<SQL
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
select lease_token from public.nova_claim_mission_task(
  '$race_run'::uuid,'resolution-race-worker',120
);
SQL
}

resolve_race() {
  psql -v ON_ERROR_STOP=1 -At <<SQL
set role authenticated;
select set_config('request.jwt.claim.sub','$race_owner',false);
select public.nova_resolve_uncertain_mission_action(
  '$race_action'::uuid,
  'confirmed_not_executed',
  'provider-audit:concurrent-resolution-claim',
  'Checked the provider activity log and confirmed this action was not executed.'
);
SQL
}

claim_ok=0
resolve_ok=0
if claim_race >"$tmp_dir/claim-race.out" 2>"$tmp_dir/claim-race.err"; then claim_ok=1; fi
if resolve_race >"$tmp_dir/resolve-race.out" 2>"$tmp_dir/resolve-race.err"; then resolve_ok=1; fi

race_state="$(psql -v ON_ERROR_STOP=1 -At -F '|' -c \
  "select r.status, (r.lease_token is not null)::int, (select count(*) from public.nova_mission_action_resolutions x where x.action_id='$race_action'::uuid) from public.nova_mission_execution_runs r where r.id='$race_run'::uuid")"
IFS='|' read -r final_status active_lease resolution_count <<<"$race_state"

# A successful SELECT can still return zero rows, so validate the committed
# database state rather than treating psql's exit code as proof of a claim.
claim_token="$(grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$tmp_dir/claim-race.out" | tail -n 1 || true)"
if [[ "$active_lease" == "1" && "$resolution_count" == "0" && "$final_status" == "running" ]]; then
  if [[ -z "$claim_token" || "$claim_ok" -ne 1 ]]; then
    echo "Worker-claim winner did not return its committed lease token" >&2
    cat "$tmp_dir/claim-race.out"
    cat "$tmp_dir/claim-race.err"
    exit 1
  fi
elif [[ "$active_lease" == "0" && "$resolution_count" == "1" ]]; then
  if [[ "$resolve_ok" -ne 1 || -n "$claim_token" ]]; then
    echo "Owner-resolution winner did not exclude the competing worker claim" >&2
    echo "claim_ok=$claim_ok resolve_ok=$resolve_ok"
    cat "$tmp_dir/claim-race.out"
    cat "$tmp_dir/claim-race.err"
    cat "$tmp_dir/resolve-race.out"
    cat "$tmp_dir/resolve-race.err"
    exit 1
  fi
else
  echo "Owner-resolution/claim race invariant failed: claim_ok=$claim_ok resolve_ok=$resolve_ok state=$race_state" >&2
  echo "--- claim stdout ---"; cat "$tmp_dir/claim-race.out"
  echo "--- claim stderr ---"; cat "$tmp_dir/claim-race.err"
  echo "--- resolution stdout ---"; cat "$tmp_dir/resolve-race.out"
  echo "--- resolution stderr ---"; cat "$tmp_dir/resolve-race.err"
  exit 1
fi

echo "Concurrent owner-resolution/worker-claim race passed: claim acquired one lease; owner resolution either committed first or was safely blocked."
