-- NOVA worker lease foundation.
-- This migration only adds server-side claim/heartbeat/fail primitives. It does not
-- expose a worker endpoint, call external tools, or run tasks automatically.

alter table public.nova_mission_execution_runs
  add column if not exists worker_id text,
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists heartbeat_at timestamptz,
  add column if not exists retry_after timestamptz,
  add column if not exists last_error_code text,
  add column if not exists last_error_summary text not null default '';

alter table public.nova_mission_execution_runs
  drop constraint if exists nova_mission_execution_runs_lease_consistency;
alter table public.nova_mission_execution_runs
  add constraint nova_mission_execution_runs_lease_consistency check (
    (status = 'running' and worker_id is not null and lease_token is not null
      and lease_expires_at is not null and heartbeat_at is not null)
    or (status <> 'running' and lease_token is null and lease_expires_at is null)
  );
alter table public.nova_mission_execution_runs
  drop constraint if exists nova_mission_execution_runs_error_bounds;
alter table public.nova_mission_execution_runs
  add constraint nova_mission_execution_runs_error_bounds check (
    char_length(coalesce(last_error_code,'')) <= 80
    and char_length(last_error_summary) <= 1000
  );

-- Keep lease metadata internally consistent when approval/cancellation changes a run.
create or replace function public.nova_clear_execution_lease_on_terminal_status()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  if new.status <> 'running' then
    new.worker_id := null;
    new.lease_token := null;
    new.lease_expires_at := null;
    new.heartbeat_at := null;
  end if;
  return new;
end;
$;
revoke all on function public.nova_clear_execution_lease_on_terminal_status() from public, anon, authenticated;
drop trigger if exists nova_execution_run_clear_lease on public.nova_mission_execution_runs;
create trigger nova_execution_run_clear_lease
before update of status on public.nova_mission_execution_runs
for each row execute function public.nova_clear_execution_lease_on_terminal_status();

create index if not exists nova_mission_execution_runs_claim_idx
  on public.nova_mission_execution_runs(status, retry_after, lease_expires_at, created_at);

-- A worker may claim only a previously owner-approved run. A stale running lease can
-- be reclaimed after expiry; the old token is replaced atomically and becomes invalid.
create or replace function public.nova_claim_mission_task(
  p_run_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 120
)
returns table (
  run_id uuid,
  mission_id uuid,
  task_id uuid,
  owner_id uuid,
  attempt integer,
  lease_token uuid,
  lease_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_task_status text;
  v_attempt integer;
  v_retry_after timestamptz;
  v_lease_token uuid;
  v_expiry timestamptz;
  v_sequence bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Worker claims are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_worker_id is null or pg_catalog.char_length(pg_catalog.btrim(p_worker_id)) not between 1 and 120
     or p_lease_seconds is null or p_lease_seconds not between 30 and 300 then
    raise exception 'Worker claim parameters are invalid' using errcode = '23514';
  end if;

  select r.mission_id, r.approval_id, r.task_id, r.owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs r
   where r.id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  -- Global lock order: mission -> approval -> run -> task.
  select m.state into v_mission_state
    from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;

  select a.status into v_approval_status
    from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;

  select r.status, r.attempt, r.retry_after, r.lease_expires_at
    into v_run_status, v_attempt, v_retry_after, v_expiry
    from public.nova_mission_execution_runs r
   where r.id = p_run_id and r.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select t.status into v_task_status
    from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  if v_approval_status <> 'approved' then
    raise exception 'Task execution requires an approved authorization'
      using errcode = '42501';
  end if;
  if v_mission_state not in ('planned','running') then
    raise exception 'Mission is not eligible for execution' using errcode = '55000';
  end if;
  if v_run_status not in ('authorized','running') then
    raise exception 'Execution run is not claimable' using errcode = '55000';
  end if;
  if v_run_status = 'running' and v_expiry > pg_catalog.now() then
    raise exception 'Execution run already has an active lease' using errcode = '55P03';
  end if;
  -- Keep execution serial per mission. An expired process may still be finishing an
  -- external side effect, so do not start a different task until that run is reconciled.
  if exists (
    select 1 from public.nova_mission_execution_runs other_run
     where other_run.mission_id = v_mission_id
       and other_run.id <> p_run_id
       and other_run.status = 'running'
  ) then
    raise exception 'Another task in this mission still owns an execution lease'
      using errcode = '55P03';
  end if;
  if v_retry_after is not null and v_retry_after > pg_catalog.now() then
    raise exception 'Execution retry is not due yet' using errcode = '55P03';
  end if;
  if v_attempt >= 5 then
    raise exception 'Execution attempt limit reached' using errcode = '54000';
  end if;
  if v_task_status not in ('planned','running') then
    raise exception 'Task is not eligible for execution' using errcode = '55000';
  end if;

  v_lease_token := gen_random_uuid();
  v_expiry := pg_catalog.now() + pg_catalog.make_interval(secs => p_lease_seconds);
  update public.nova_mission_execution_runs
     set status = 'running', attempt = attempt + 1, worker_id = pg_catalog.btrim(p_worker_id),
         lease_token = v_lease_token, lease_expires_at = v_expiry,
         heartbeat_at = pg_catalog.now(), retry_after = null, updated_at = pg_catalog.now()
   where id = p_run_id and owner_id = v_owner_id
  returning attempt into v_attempt;

  update public.nova_mission_tasks
     set status = 'running', attempts = greatest(attempts, v_attempt), updated_at = pg_catalog.now()
   where id = v_task_id and mission_id = v_mission_id and owner_id = v_owner_id;

  update public.nova_missions
     set state = 'running', attempts = attempts + 1, version = version + 1, updated_at = pg_catalog.now()
   where id = v_mission_id and owner_id = v_owner_id
     and state = 'planned';

  select coalesce(max(e.sequence), 0) + 1 into v_sequence
    from public.nova_mission_events e where e.mission_id = v_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    v_mission_id, v_owner_id, v_sequence, 'task.worker_claimed',
    v_mission_state, 'running', v_owner_id,
    pg_catalog.jsonb_build_object('task_id',v_task_id,'run_id',p_run_id,'attempt',v_attempt,'worker_id',pg_catalog.btrim(p_worker_id))
  );

  return query select p_run_id, v_mission_id, v_task_id, v_owner_id,
    v_attempt, v_lease_token, v_expiry;
end;
$$;

create or replace function public.nova_heartbeat_mission_task(
  p_run_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer default 120
)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mission_id uuid;
  v_approval_id uuid;
  v_owner_id uuid;
  v_expiry timestamptz;
begin
  if current_user <> 'service_role' then
    raise exception 'Worker heartbeats are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_lease_token is null or p_lease_seconds is null or p_lease_seconds not between 30 and 300 then
    raise exception 'Heartbeat parameters are invalid' using errcode = '23514';
  end if;
  select mission_id, approval_id, owner_id into v_mission_id, v_approval_id, v_owner_id
    from public.nova_mission_execution_runs where id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  perform 1 from public.nova_missions where id = v_mission_id and owner_id = v_owner_id for update;
  perform 1 from public.nova_mission_approvals where id = v_approval_id and owner_id = v_owner_id for update;
  select pg_catalog.now() + pg_catalog.make_interval(secs => p_lease_seconds)
    into v_expiry;
  update public.nova_mission_execution_runs
     set heartbeat_at = pg_catalog.now(), lease_expires_at = v_expiry, updated_at = pg_catalog.now()
   where id = p_run_id and owner_id = v_owner_id and status = 'running'
     and lease_token = p_lease_token and lease_expires_at > pg_catalog.now();
  if not found then
    raise exception 'Worker lease is stale, expired, or no longer owned'
      using errcode = '55000';
  end if;
  return v_expiry;
end;
$$;

-- A failed attempt is retryable only within the bounded attempt budget. A retry returns
-- the mission/task to planned and the run to authorized; no external side effect is retried
-- automatically by this database function.
create or replace function public.nova_fail_mission_task(
  p_run_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_error_summary text,
  p_retry_delay_seconds integer default 30
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_attempt integer;
  v_next_status text;
  v_next_mission_state text;
  v_sequence bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Worker failures are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_lease_token is null or p_error_code is null
     or pg_catalog.char_length(p_error_code) > 80
     or p_error_summary is null or pg_catalog.char_length(p_error_summary) > 1000
     or p_retry_delay_seconds is null or p_retry_delay_seconds not between 0 and 3600 then
    raise exception 'Worker failure details are invalid' using errcode = '23514';
  end if;
  select mission_id, approval_id, task_id, owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs where id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  perform 1 from public.nova_missions where id = v_mission_id and owner_id = v_owner_id for update;
  perform 1 from public.nova_mission_approvals where id = v_approval_id and owner_id = v_owner_id for update;
  select attempt into v_attempt from public.nova_mission_execution_runs
   where id = p_run_id and owner_id = v_owner_id and status = 'running'
     and lease_token = p_lease_token and lease_expires_at > pg_catalog.now()
   for update;
  if not found then raise exception 'Worker lease is stale, expired, or no longer owned' using errcode = '55000'; end if;
  perform 1 from public.nova_mission_tasks
   where id = v_task_id and mission_id = v_mission_id and owner_id = v_owner_id for update;

  if v_attempt < 5 then
    v_next_status := 'authorized';
    v_next_mission_state := 'planned';
  else
    v_next_status := 'failed';
    v_next_mission_state := 'failed';
  end if;

  update public.nova_mission_execution_runs
     set status = v_next_status, worker_id = null, lease_token = null,
         lease_expires_at = null, heartbeat_at = null,
         retry_after = case when v_next_status = 'authorized'
           then pg_catalog.now() + pg_catalog.make_interval(secs => p_retry_delay_seconds) else null end,
         last_error_code = p_error_code, last_error_summary = p_error_summary,
         updated_at = pg_catalog.now()
   where id = p_run_id and owner_id = v_owner_id;

  update public.nova_mission_tasks
     set status = case when v_next_status = 'authorized' then 'planned' else 'failed' end,
         updated_at = pg_catalog.now()
   where id = v_task_id and mission_id = v_mission_id and owner_id = v_owner_id;

  update public.nova_missions
     set state = v_next_mission_state, version = version + 1, updated_at = pg_catalog.now()
   where id = v_mission_id and owner_id = v_owner_id and state = 'running';

  select coalesce(max(e.sequence), 0) + 1 into v_sequence
    from public.nova_mission_events e where e.mission_id = v_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    v_mission_id, v_owner_id, v_sequence,
    case when v_next_status = 'authorized' then 'task.retry_scheduled' else 'task.execution_failed' end,
    'running', v_next_mission_state, v_owner_id,
    pg_catalog.jsonb_build_object('task_id',v_task_id,'run_id',p_run_id,'attempt',v_attempt,'error_code',p_error_code)
  );
  return v_next_status;
end;
$$;

revoke all on function public.nova_claim_mission_task(uuid,text,integer) from public, anon, authenticated;
revoke all on function public.nova_heartbeat_mission_task(uuid,uuid,integer) from public, anon, authenticated;
revoke all on function public.nova_fail_mission_task(uuid,uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.nova_claim_mission_task(uuid,text,integer) to service_role;
grant execute on function public.nova_heartbeat_mission_task(uuid,uuid,integer) to service_role;
grant execute on function public.nova_fail_mission_task(uuid,uuid,text,text,integer) to service_role;
