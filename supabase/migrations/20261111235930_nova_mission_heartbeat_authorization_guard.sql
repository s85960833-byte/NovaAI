-- Heartbeats must not extend a lease after mission/task cancellation or
-- authorization invalidation. Preserve the global lock order.
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
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_run_token uuid;
  v_run_expiry timestamptz;
  v_task_status text;
  v_expiry timestamptz;
begin
  if current_user <> 'service_role' then
    raise exception 'Worker heartbeats are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_run_id is null or p_lease_token is null
     or p_lease_seconds is null or p_lease_seconds not between 30 and 300 then
    raise exception 'Heartbeat parameters are invalid' using errcode = '23514';
  end if;

  select mission_id, approval_id, task_id, owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs where id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select state into v_mission_state from public.nova_missions
   where id = v_mission_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;

  select status into v_approval_status from public.nova_mission_approvals
   where id = v_approval_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;

  select status, lease_token, lease_expires_at
    into v_run_status, v_run_token, v_run_expiry
    from public.nova_mission_execution_runs
   where id = p_run_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select status into v_task_status from public.nova_mission_tasks
   where id = v_task_id and mission_id = v_mission_id and owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  if v_mission_state <> 'running' or v_approval_status <> 'approved'
     or v_task_status <> 'running' or v_run_status <> 'running'
     or v_run_token is distinct from p_lease_token
     or v_run_expiry is null or v_run_expiry <= pg_catalog.now() then
    raise exception 'Heartbeat requires the current active approved mission, task and lease'
      using errcode = '55000';
  end if;

  v_expiry := pg_catalog.now() + pg_catalog.make_interval(secs => p_lease_seconds);
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
