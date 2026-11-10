-- Owner-requested mission cancellation. Cancels pending authorization records atomically;
-- it never invokes or attempts to stop an external system.

create or replace function public.nova_cancel_mission(
  p_owner_id uuid,
  p_mission_id uuid,
  p_reason text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_state text;
  v_sequence bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Mission cancellation is restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_reason is not null and pg_catalog.char_length(p_reason) > 1000 then
    raise exception 'Cancellation reason is too long' using errcode = '23514';
  end if;

  select state into v_state
    from public.nova_missions
   where id = p_mission_id and owner_id = p_owner_id
   for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  if v_state in ('completed','cancelled') then
    raise exception 'Mission is already in a terminal state' using errcode = '55000';
  end if;

  update public.nova_mission_approvals
     set status = 'expired', decided_at = pg_catalog.now(),
         decided_by = p_owner_id, decision_note = coalesce(nullif(p_reason,''),'Mission cancelled by owner')
   where mission_id = p_mission_id and owner_id = p_owner_id and status = 'pending';

  update public.nova_mission_execution_runs
     set status = 'cancelled', updated_at = pg_catalog.now()
   where mission_id = p_mission_id and owner_id = p_owner_id
     and status in ('awaiting_approval','authorized','running');

  update public.nova_mission_tasks
     set status = 'cancelled', updated_at = pg_catalog.now()
   where mission_id = p_mission_id and owner_id = p_owner_id
     and status not in ('completed','failed','cancelled');

  update public.nova_missions
     set state = 'cancelled', version = version + 1, updated_at = pg_catalog.now()
   where id = p_mission_id and owner_id = p_owner_id;

  select coalesce(max(sequence), 0) + 1 into v_sequence
    from public.nova_mission_events where mission_id = p_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    p_mission_id, p_owner_id, v_sequence, 'mission.cancelled',
    v_state, 'cancelled', p_owner_id,
    pg_catalog.jsonb_build_object('reason', coalesce(p_reason,''))
  );
  return p_mission_id;
end;
$$;
revoke all on function public.nova_cancel_mission(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.nova_cancel_mission(uuid,uuid,text)
  to service_role;
