-- Executor-side idempotency ledger and lease-fenced action receipts.
-- This migration records action intent/results only; it never calls external systems.

create table if not exists public.nova_mission_action_receipts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  task_id uuid not null,
  run_id uuid not null,
  owner_id uuid not null,
  action_key text not null
    check (char_length(btrim(action_key)) between 1 and 160),
  request_digest text not null
    check (request_digest ~ '^[0-9a-f]{64}$'),
  lease_token uuid not null,
  reconciled_by_lease_token uuid,
  reconciled_at timestamptz,
  status text not null default 'reserved'
    check (status in ('reserved','completed','uncertain')),
  result_digest text
    check (result_digest is null or result_digest ~ '^[0-9a-f]{64}$'),
  external_reference text not null default ''
    check (char_length(external_reference) <= 300),
  uncertain_reason text not null default ''
    check (char_length(uncertain_reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (owner_id, action_key),
  foreign key (run_id, mission_id, task_id, owner_id)
    references public.nova_mission_execution_runs(id, mission_id, task_id, owner_id)
    on delete cascade,
  check (
    (status = 'completed' and result_digest is not null and completed_at is not null)
    or (status in ('reserved','uncertain') and result_digest is null and completed_at is null)
  )
);

create index if not exists nova_mission_action_receipts_run_status_idx
  on public.nova_mission_action_receipts(run_id, status, created_at);
create index if not exists nova_mission_action_receipts_owner_idx
  on public.nova_mission_action_receipts(owner_id, created_at desc);

alter table public.nova_mission_action_receipts enable row level security;
revoke all on public.nova_mission_action_receipts from public, anon, authenticated, service_role;
grant select (
  id, mission_id, task_id, run_id, owner_id, action_key, request_digest,
  status, result_digest, external_reference, uncertain_reason,
  created_at, updated_at, completed_at
) on public.nova_mission_action_receipts to authenticated;
grant select on public.nova_mission_action_receipts to service_role;

drop policy if exists nova_mission_action_receipts_select_own
  on public.nova_mission_action_receipts;
create policy nova_mission_action_receipts_select_own
  on public.nova_mission_action_receipts
  for select to authenticated using (owner_id = (select auth.uid()));

-- Reserve one idempotent action under the currently active worker lease.
-- Replays with the same key+digest return the original receipt. A different payload
-- conflicts; an uncertain receipt is never silently replayed as a fresh side effect.
create or replace function public.nova_reserve_mission_action(
  p_run_id uuid,
  p_lease_token uuid,
  p_action_key text,
  p_request_digest text
)
returns table(action_id uuid, action_status text, replayed boolean)
language plpgsql
security definer
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
  v_lease_expiry timestamptz;
  v_task_status text;
  v_existing_id uuid;
  v_existing_mission uuid;
  v_existing_task uuid;
  v_existing_run uuid;
  v_existing_digest text;
  v_existing_token uuid;
  v_existing_status text;
  v_new_id uuid;
begin
  if coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Action reservations are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_run_id is null or p_lease_token is null
     or p_action_key is null or pg_catalog.char_length(pg_catalog.btrim(p_action_key)) not between 1 and 160
     or p_request_digest is null or p_request_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'Action reservation parameters are invalid' using errcode = '23514';
  end if;

  select r.mission_id, r.approval_id, r.task_id, r.owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs r where r.id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  -- Global lock order: mission -> approval -> run -> task -> action receipt.
  select m.state into v_mission_state from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.status into v_approval_status from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select r.status, r.lease_token, r.lease_expires_at
    into v_run_status, v_run_token, v_lease_expiry
    from public.nova_mission_execution_runs r
   where r.id = p_run_id and r.owner_id = v_owner_id for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  select t.status into v_task_status from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  if v_approval_status <> 'approved' or v_mission_state <> 'running'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_run_token is distinct from p_lease_token
     or v_lease_expiry is null or v_lease_expiry <= pg_catalog.now() then
    raise exception 'Action reservation requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  -- INSERT .. ON CONFLICT closes the concurrent first-reservation race: one
  -- caller creates the receipt and the other observes that exact committed row.
  insert into public.nova_mission_action_receipts(
    mission_id, task_id, run_id, owner_id, action_key,
    request_digest, lease_token, status
  ) values (
    v_mission_id, v_task_id, p_run_id, v_owner_id, pg_catalog.btrim(p_action_key),
    p_request_digest, p_lease_token, 'reserved'
  )
  on conflict (owner_id, action_key) do nothing
  returning id into v_new_id;

  if v_new_id is not null then
    return query select v_new_id, 'reserved'::text, false;
    return;
  end if;

  select a.id, a.mission_id, a.task_id, a.run_id, a.request_digest,
         a.lease_token, a.status
    into v_existing_id, v_existing_mission, v_existing_task, v_existing_run,
         v_existing_digest, v_existing_token, v_existing_status
    from public.nova_mission_action_receipts a
   where a.owner_id = v_owner_id and a.action_key = pg_catalog.btrim(p_action_key)
   for update;
  if not found then
    raise exception 'Conflicting action reservation disappeared; retry safely'
      using errcode = '40001';
  end if;
  if v_existing_mission is distinct from v_mission_id
     or v_existing_task is distinct from v_task_id
     or v_existing_run is distinct from p_run_id
     or v_existing_digest is distinct from p_request_digest then
    raise exception 'Action idempotency key is already bound to a different request'
      using errcode = '23505';
  end if;
  if v_existing_status = 'reserved' and v_existing_token is distinct from p_lease_token then
    raise exception 'Reserved action belongs to an earlier lease and requires reconciliation'
      using errcode = '55P03';
  end if;
  return query select v_existing_id, v_existing_status, true;
end;
$$;

-- Complete a reserved receipt only while its original lease is still current.
-- A replay is idempotent only when result digest and external reference match.
create or replace function public.nova_complete_mission_action(
  p_action_id uuid,
  p_lease_token uuid,
  p_result_digest text,
  p_external_reference text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_run_token uuid;
  v_lease_expiry timestamptz;
  v_task_status text;
  v_action_status text;
  v_action_token uuid;
  v_old_digest text;
  v_old_reference text;
begin
  if coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Action completion is restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_action_id is null or p_lease_token is null
     or p_result_digest is null or p_result_digest !~ '^[0-9a-f]{64}$'
     or p_external_reference is null or pg_catalog.char_length(p_external_reference) > 300 then
    raise exception 'Action completion parameters are invalid' using errcode = '23514';
  end if;

  select a.run_id, a.mission_id, a.task_id, a.owner_id
    into v_run_id, v_mission_id, v_task_id, v_owner_id
    from public.nova_mission_action_receipts a where a.id = p_action_id;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;
  select r.approval_id into v_approval_id from public.nova_mission_execution_runs r
   where r.id = v_run_id and r.owner_id = v_owner_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select m.state into v_mission_state from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.status into v_approval_status from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select r.status, r.lease_token, r.lease_expires_at
    into v_run_status, v_run_token, v_lease_expiry
    from public.nova_mission_execution_runs r where r.id = v_run_id and r.owner_id = v_owner_id
    for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  select t.status into v_task_status from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if v_approval_status <> 'approved' or v_mission_state <> 'running'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_run_token is distinct from p_lease_token
     or v_lease_expiry is null or v_lease_expiry <= pg_catalog.now() then
    raise exception 'Action completion requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  select a.status, a.lease_token, a.result_digest, a.external_reference
    into v_action_status, v_action_token, v_old_digest, v_old_reference
    from public.nova_mission_action_receipts a where a.id = p_action_id for update;
  if not found or v_action_token is distinct from p_lease_token then
    raise exception 'Action receipt is not owned by the current worker lease'
      using errcode = '55000';
  end if;
  if v_action_status = 'completed' then
    if v_old_digest is distinct from p_result_digest
       or v_old_reference is distinct from p_external_reference then
      raise exception 'Completed action replay has a different result'
        using errcode = '23505';
    end if;
    return 'completed';
  end if;
  if v_action_status <> 'reserved' then
    raise exception 'Uncertain action must be reconciled before completion'
      using errcode = '55000';
  end if;

  update public.nova_mission_action_receipts
     set status = 'completed', result_digest = p_result_digest,
         external_reference = p_external_reference,
         completed_at = pg_catalog.now(), updated_at = pg_catalog.now()
   where id = p_action_id and lease_token = p_lease_token and status = 'reserved';
  return 'completed';
end;
$$;

-- Mark an action uncertain when the executor cannot determine whether the external
-- side effect occurred. An uncertain action is never automatically re-issued.
create or replace function public.nova_mark_mission_action_uncertain(
  p_action_id uuid,
  p_lease_token uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_run_token uuid;
  v_lease_expiry timestamptz;
  v_task_status text;
  v_action_status text;
  v_action_token uuid;
  v_old_reason text;
begin
  if coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Action reconciliation markers are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_action_id is null or p_lease_token is null
     or p_reason is null or pg_catalog.char_length(p_reason) not between 1 and 1000 then
    raise exception 'Uncertain action parameters are invalid' using errcode = '23514';
  end if;

  select a.run_id, a.mission_id, a.task_id, a.owner_id
    into v_run_id, v_mission_id, v_task_id, v_owner_id
    from public.nova_mission_action_receipts a where a.id = p_action_id;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;
  select r.approval_id into v_approval_id from public.nova_mission_execution_runs r
   where r.id = v_run_id and r.owner_id = v_owner_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select m.state into v_mission_state from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.status into v_approval_status from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select r.status, r.lease_token, r.lease_expires_at
    into v_run_status, v_run_token, v_lease_expiry
    from public.nova_mission_execution_runs r where r.id = v_run_id and r.owner_id = v_owner_id
    for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  select t.status into v_task_status from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if v_approval_status <> 'approved' or v_mission_state <> 'running'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_run_token is distinct from p_lease_token
     or v_lease_expiry is null or v_lease_expiry <= pg_catalog.now() then
    raise exception 'Action reconciliation requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  select a.status, a.lease_token, a.uncertain_reason
    into v_action_status, v_action_token, v_old_reason
    from public.nova_mission_action_receipts a where a.id = p_action_id for update;
  if not found or v_action_token is distinct from p_lease_token then
    raise exception 'Action receipt is not owned by the current worker lease'
      using errcode = '55000';
  end if;
  if v_action_status = 'uncertain' then
    if v_old_reason is distinct from p_reason then
      raise exception 'Uncertain action replay has a different reason'
        using errcode = '23505';
    end if;
    return 'uncertain';
  end if;
  if v_action_status <> 'reserved' then
    raise exception 'Completed action cannot be marked uncertain'
      using errcode = '55000';
  end if;

  update public.nova_mission_action_receipts
     set status = 'uncertain', uncertain_reason = p_reason, updated_at = pg_catalog.now()
   where id = p_action_id and lease_token = p_lease_token and status = 'reserved';
  return 'uncertain';
end;
$$;

revoke all on function public.nova_reserve_mission_action(uuid,uuid,text,text)
  from public, anon, authenticated;
revoke all on function public.nova_complete_mission_action(uuid,uuid,text,text)
  from public, anon, authenticated;
-- Reconcile a reservation left open by an expired worker lease.
-- This records uncertainty only; it never retries or claims the external action succeeded.
create or replace function public.nova_reconcile_mission_action(
  p_action_id uuid,
  p_current_lease_token uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $reconcile$
declare
  v_run_id uuid;
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_run_token uuid;
  v_lease_expiry timestamptz;
  v_task_status text;
  v_action_status text;
  v_original_token uuid;
  v_reconciled_token uuid;
  v_old_reason text;
begin
  if coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Action reconciliation is restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_action_id is null or p_current_lease_token is null
     or p_reason is null or pg_catalog.char_length(pg_catalog.btrim(p_reason)) not between 1 and 1000 then
    raise exception 'Action reconciliation parameters are invalid' using errcode = '23514';
  end if;

  select a.run_id, a.mission_id, a.task_id, a.owner_id
    into v_run_id, v_mission_id, v_task_id, v_owner_id
    from public.nova_mission_action_receipts a where a.id = p_action_id;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;
  select r.approval_id into v_approval_id from public.nova_mission_execution_runs r
   where r.id = v_run_id and r.owner_id = v_owner_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  -- Match the global lock order used by claim, fail and action RPCs.
  select m.state into v_mission_state from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.status into v_approval_status from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select r.status, r.lease_token, r.lease_expires_at
    into v_run_status, v_run_token, v_lease_expiry
    from public.nova_mission_execution_runs r where r.id = v_run_id and r.owner_id = v_owner_id
    for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  select t.status into v_task_status from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;
  if v_approval_status <> 'approved' or v_mission_state <> 'running'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_run_token is distinct from p_current_lease_token
     or v_lease_expiry is null or v_lease_expiry <= pg_catalog.now() then
    raise exception 'Reconciliation requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  select a.status, a.lease_token, a.reconciled_by_lease_token, a.uncertain_reason
    into v_action_status, v_original_token, v_reconciled_token, v_old_reason
    from public.nova_mission_action_receipts a where a.id = p_action_id for update;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;

  if v_action_status = 'uncertain'
     and v_reconciled_token = p_current_lease_token
     and v_old_reason = pg_catalog.btrim(p_reason) then
    return 'uncertain';
  end if;
  if v_action_status <> 'reserved' then
    raise exception 'Only an unfinished reserved action can be reconciled'
      using errcode = '55000';
  end if;
  if v_original_token is not distinct from p_current_lease_token then
    raise exception 'The action still belongs to the current lease; use normal completion or uncertainty reporting'
      using errcode = '55000';
  end if;

  update public.nova_mission_action_receipts
     set status = 'uncertain',
         reconciled_by_lease_token = p_current_lease_token,
         reconciled_at = pg_catalog.now(),
         uncertain_reason = pg_catalog.btrim(p_reason),
         updated_at = pg_catalog.now()
   where id = p_action_id and status = 'reserved'
     and lease_token = v_original_token;
  return 'uncertain';
end;
$reconcile$;

revoke all on function public.nova_mark_mission_action_uncertain(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.nova_reserve_mission_action(uuid,uuid,text,text)
  to service_role;
grant execute on function public.nova_complete_mission_action(uuid,uuid,text,text)
  to service_role;
grant execute on function public.nova_mark_mission_action_uncertain(uuid,uuid,text)
  to service_role;
revoke all on function public.nova_reconcile_mission_action(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.nova_reconcile_mission_action(uuid,uuid,text)
  to service_role;

