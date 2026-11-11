-- Persist tool-gate policy snapshots only as part of a trusted, task-bound proof.
-- The signed proof envelope digest covers the snapshot; runtime authorization revalidates it.

alter table public.nova_mission_proof_attestations
  add constraint nova_mission_tool_policy_snapshot_consistency check (
    (
      verifier_id = 'agents.tool-gates-policy'
      and pg_catalog.jsonb_typeof(envelope_json->'tool_policy') is not distinct from 'object'
    )
    or (
      verifier_id <> 'agents.tool-gates-policy'
      and not (envelope_json ? 'tool_policy')
    )
  );

create or replace function public.nova_validate_mission_tool_policy_attestation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_task_type text;
begin
  select t.task_type into v_task_type
    from public.nova_mission_tasks t
   where t.id = new.task_id
     and t.mission_id = new.mission_id
     and t.owner_id = new.owner_id;

  if not found then
    raise exception 'Tool policy attestation task binding is invalid'
      using errcode = '23503';
  end if;

  if new.verifier_id = 'agents.tool-gates-policy' then
    if v_task_type is distinct from 'agents.tool_gates'
       or pg_catalog.jsonb_typeof(new.envelope_json->'tool_policy') is distinct from 'object' then
      raise exception 'Tool policy snapshot must belong to a valid agents.tool_gates proof'
        using errcode = '23514';
    end if;
    if new.envelope_json->'tool_policy'->>'version' is distinct from '1'
       or pg_catalog.jsonb_typeof(new.envelope_json->'tool_policy'->'gates') is distinct from 'array' then
      raise exception 'Tool policy snapshot version or gates are invalid'
        using errcode = '23514';
    end if;
    if pg_catalog.jsonb_array_length(new.envelope_json->'tool_policy'->'gates') not between 1 and 20 then
      raise exception 'Tool policy snapshot must contain between 1 and 20 gates'
        using errcode = '23514';
    end if;
  elsif v_task_type = 'agents.tool_gates' or new.envelope_json ? 'tool_policy' then
    raise exception 'Only the trusted tool-gates verifier may persist a tool policy snapshot'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.nova_validate_mission_tool_policy_attestation()
  from public, anon, authenticated, service_role;

drop trigger if exists nova_validate_mission_tool_policy_attestation
  on public.nova_mission_proof_attestations;
create trigger nova_validate_mission_tool_policy_attestation
  before insert on public.nova_mission_proof_attestations
  for each row execute function public.nova_validate_mission_tool_policy_attestation();
