-- NOVA safe execution authorization queue.
-- This migration records explicit approval before any future executor may perform work.
-- It does not execute external actions or start workers.

create table if not exists public.nova_mission_approvals (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  task_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_key text not null check (char_length(btrim(request_key)) between 1 and 160),
  action_summary text not null check (char_length(btrim(action_summary)) between 1 and 2000),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text not null default '' check (char_length(decision_note) <= 1000),
  unique (owner_id, request_key),
  unique (id, mission_id, task_id, owner_id),
  foreign key (task_id, mission_id, owner_id)
    references public.nova_mission_tasks(id, mission_id, owner_id) on delete cascade,
  foreign key (mission_id, owner_id)
    references public.nova_missions(id, owner_id) on delete cascade,
  check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  )
);

create table if not exists public.nova_mission_execution_runs (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null unique,
  mission_id uuid not null,
  task_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'awaiting_approval'
    check (status in ('awaiting_approval','authorized','blocked','running','succeeded','failed','cancelled')),
  attempt integer not null default 0 check (attempt >= 0 and attempt <= 5),
  idempotency_key text not null check (char_length(btrim(idempotency_key)) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, idempotency_key),
  foreign key (approval_id, mission_id, task_id, owner_id)
    references public.nova_mission_approvals(id, mission_id, task_id, owner_id) on delete cascade,
  foreign key (task_id, mission_id, owner_id)
    references public.nova_mission_tasks(id, mission_id, owner_id) on delete cascade
);

create index if not exists nova_mission_approvals_owner_status_idx
  on public.nova_mission_approvals(owner_id, status, requested_at desc);
create index if not exists nova_mission_execution_runs_owner_status_idx
  on public.nova_mission_execution_runs(owner_id, status, created_at desc);

alter table public.nova_mission_approvals enable row level security;
alter table public.nova_mission_execution_runs enable row level security;
revoke all on public.nova_mission_approvals, public.nova_mission_execution_runs
  from public, anon, authenticated;
grant select on public.nova_mission_approvals, public.nova_mission_execution_runs to authenticated;
grant select, insert, update on public.nova_mission_approvals to service_role;
grant select, insert, update on public.nova_mission_execution_runs to service_role;

drop policy if exists nova_mission_approvals_select_own on public.nova_mission_approvals;
create policy nova_mission_approvals_select_own on public.nova_mission_approvals
for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists nova_mission_execution_runs_select_own on public.nova_mission_execution_runs;
create policy nova_mission_execution_runs_select_own on public.nova_mission_execution_runs
for select to authenticated using (owner_id = (select auth.uid()));

-- Queue a task for human approval. This creates records only; no worker is invoked.
create or replace function public.nova_request_task_approval(
  p_owner_id uuid,
  p_mission_id uuid,
  p_task_id uuid,
  p_request_key text,
  p_action_summary text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mission_state text;
  v_task_status text;
  v_approval_id uuid;
  v_existing_mission_id uuid;
  v_existing_task_id uuid;
  v_existing_action_summary text;
  v_sequence bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Approval requests are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_request_key is null or pg_catalog.char_length(pg_catalog.btrim(p_request_key)) not between 1 and 160
     or p_action_summary is null or pg_catalog.char_length(pg_catalog.btrim(p_action_summary)) not between 1 and 2000 then
    raise exception 'Approval request input is invalid' using errcode = '23514';
  end if;

  select state into v_mission_state from public.nova_missions
   where id = p_mission_id and owner_id = p_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select status into v_task_status from public.nova_mission_tasks
   where id = p_task_id and mission_id = p_mission_id and owner_id = p_owner_id for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  select id, mission_id, task_id, action_summary into v_approval_id, v_existing_mission_id, v_existing_task_id, v_existing_action_summary
    from public.nova_mission_approvals
   where owner_id = p_owner_id and request_key = p_request_key;
  if v_approval_id is not null then
    if v_existing_mission_id is distinct from p_mission_id or v_existing_task_id is distinct from p_task_id or v_existing_action_summary is distinct from pg_catalog.btrim(p_action_summary) then
      raise exception 'Approval idempotency key is already used for a different request'
        using errcode = '23505';
    end if;
    return v_approval_id;
  end if;

  if v_mission_state not in ('planned','running')
     or v_task_status <> 'planned' then
    raise exception 'Mission and task are not eligible for an approval request'
      using errcode = '55000';
  end if;

  insert into public.nova_mission_approvals(
    mission_id, task_id, owner_id, request_key, action_summary
  ) values (p_mission_id, p_task_id, p_owner_id, p_request_key, pg_catalog.btrim(p_action_summary))
  on conflict (owner_id, request_key) do nothing
  returning id into v_approval_id;
  if v_approval_id is null then
    select id, mission_id, task_id, action_summary into v_approval_id, v_existing_mission_id, v_existing_task_id, v_existing_action_summary
      from public.nova_mission_approvals
     where owner_id = p_owner_id and request_key = p_request_key;
    if v_existing_mission_id is distinct from p_mission_id
       or v_existing_task_id is distinct from p_task_id
       or v_existing_action_summary is distinct from pg_catalog.btrim(p_action_summary) then
      raise exception 'Approval idempotency key is already used for a different request'
        using errcode = '23505';
    end if;
    return v_approval_id;
  end if;

  insert into public.nova_mission_execution_runs(
    approval_id, mission_id, task_id, owner_id, status, idempotency_key
  ) values (
    v_approval_id, p_mission_id, p_task_id, p_owner_id, 'awaiting_approval', p_request_key
  );

  update public.nova_mission_tasks set status = 'waiting_approval',
    updated_at = pg_catalog.now()
   where id = p_task_id and mission_id = p_mission_id and owner_id = p_owner_id;
  update public.nova_missions set state = 'waiting_approval',
    version = version + 1, updated_at = pg_catalog.now()
   where id = p_mission_id and owner_id = p_owner_id;

  select coalesce(max(sequence), 0) + 1 into v_sequence
    from public.nova_mission_events where mission_id = p_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    p_mission_id, p_owner_id, v_sequence, 'task.approval_requested',
    v_mission_state, 'waiting_approval', p_owner_id,
    pg_catalog.jsonb_build_object('task_id', p_task_id, 'approval_id', v_approval_id)
  );
  return v_approval_id;
end;
$$;
revoke all on function public.nova_request_task_approval(uuid,uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.nova_request_task_approval(uuid,uuid,uuid,text,text)
  to service_role;

-- Only the authenticated mission owner can be recorded as the approver.
-- The server calls this RPC after verifying the caller's JWT subject.
create or replace function public.nova_decide_task_approval(
  p_owner_id uuid,
  p_approval_id uuid,
  p_decision text,
  p_actor_id uuid,
  p_decision_note text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mission_id uuid;
  v_mission_state text;
  v_task_id uuid;
  v_status text;
  v_sequence bigint;
  v_next_mission_state text;
begin
  if current_user <> 'service_role' then
    raise exception 'Approval decisions are restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_actor_id is distinct from p_owner_id then
    raise exception 'Only the mission owner may approve this action'
      using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('approve','reject')
     or p_decision_note is not null and pg_catalog.char_length(p_decision_note) > 1000 then
    raise exception 'Approval decision is invalid' using errcode = '23514';
  end if;

  -- Lock in the same order as cancellation (mission, then approval) to avoid deadlocks.
  select mission_id into v_mission_id
    from public.nova_mission_approvals
   where id = p_approval_id and owner_id = p_owner_id;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;

  select state into v_mission_state
    from public.nova_missions
   where id = v_mission_id and owner_id = p_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;

  select task_id, status into v_task_id, v_status
    from public.nova_mission_approvals
   where id = p_approval_id and owner_id = p_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  if v_status <> 'pending' then
    raise exception 'Approval has already been decided' using errcode = '55000';
  end if;
  if v_mission_state <> 'waiting_approval' then
    raise exception 'Mission is not waiting for this approval decision' using errcode = '55000';
  end if;

  update public.nova_mission_approvals
     set status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
         decided_at = pg_catalog.now(), decided_by = p_actor_id,
         decision_note = coalesce(p_decision_note,'')
   where id = p_approval_id and owner_id = p_owner_id;

  update public.nova_mission_execution_runs
     set status = case when p_decision = 'approve' then 'authorized' else 'blocked' end,
         updated_at = pg_catalog.now()
   where approval_id = p_approval_id and owner_id = p_owner_id
     and status = 'awaiting_approval';

  if p_decision = 'approve' then
    update public.nova_mission_tasks set status = 'planned', updated_at = pg_catalog.now()
     where id = v_task_id and mission_id = v_mission_id and owner_id = p_owner_id
       and status = 'waiting_approval';
    v_next_mission_state := 'running';
  else
    update public.nova_mission_tasks set status = 'failed', updated_at = pg_catalog.now()
     where id = v_task_id and mission_id = v_mission_id and owner_id = p_owner_id
       and status = 'waiting_approval';
    v_next_mission_state := 'failed';
  end if;

  update public.nova_missions set state = v_next_mission_state,
    version = version + 1, updated_at = pg_catalog.now()
   where id = v_mission_id and owner_id = p_owner_id
     and state = 'waiting_approval';

  select coalesce(max(sequence), 0) + 1 into v_sequence
    from public.nova_mission_events where mission_id = v_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    v_mission_id, p_owner_id, v_sequence,
    case when p_decision = 'approve' then 'task.approval_granted' else 'task.approval_rejected' end,
    'waiting_approval', v_next_mission_state, p_actor_id,
    pg_catalog.jsonb_build_object('task_id', v_task_id, 'approval_id', p_approval_id)
  );
  return p_approval_id;
end;
$$;
revoke all on function public.nova_decide_task_approval(uuid,uuid,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.nova_decide_task_approval(uuid,uuid,text,uuid,text)
  to service_role;
