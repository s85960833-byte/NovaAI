-- Serialize approval decisions with mission cancellation and other mission events.
-- The mission row is always locked before child approval rows, preventing event-sequence
-- races and avoiding inconsistent approval/cancellation interleavings.

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
  v_task_id uuid;
  v_status text;
  v_mission_state text;
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

  -- Resolve the parent first, then acquire locks in the common parent->child order.
  select mission_id into v_mission_id
    from public.nova_mission_approvals
   where id = p_approval_id and owner_id = p_owner_id;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;

  select state into v_mission_state
    from public.nova_missions
   where id = v_mission_id and owner_id = p_owner_id
   for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  if v_mission_state <> 'waiting_approval' then
    raise exception 'Mission is no longer awaiting approval' using errcode = '55000';
  end if;

  select mission_id, task_id, status into v_mission_id, v_task_id, v_status
    from public.nova_mission_approvals
   where id = p_approval_id and owner_id = p_owner_id
   for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  if v_status <> 'pending' then
    raise exception 'Approval has already been decided' using errcode = '55000';
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
    -- Authorization is not execution: keep the mission planned until a worker claims it.
    v_next_mission_state := 'planned';
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
