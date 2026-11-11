-- Persist policy snapshots only inside their matching trusted, task-bound proof.
-- The signed envelope digest covers the snapshots; runtime authorization revalidates them.

alter table public.nova_mission_proof_attestations
  add constraint nova_mission_policy_snapshot_consistency check (
    (
      verifier_id = 'agents.tool-gates-policy'
      and pg_catalog.jsonb_typeof(envelope_json->'tool_policy') is not distinct from 'object'
      and not (envelope_json ? 'permission_policy')
    )
    or (
      verifier_id = 'agents.permissions-least-privilege'
      and pg_catalog.jsonb_typeof(envelope_json->'permission_policy') is not distinct from 'object'
      and not (envelope_json ? 'tool_policy')
    )
    or (
      verifier_id not in ('agents.tool-gates-policy', 'agents.permissions-least-privilege')
      and not (envelope_json ? 'tool_policy')
      and not (envelope_json ? 'permission_policy')
    )
  );

create or replace function public.nova_validate_mission_policy_attestation()
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
    raise exception 'Policy attestation task binding is invalid'
      using errcode = '23503';
  end if;

  if new.verifier_id = 'agents.tool-gates-policy' then
    if v_task_type is distinct from 'agents.tool_gates'
       or pg_catalog.jsonb_typeof(new.envelope_json->'tool_policy') is distinct from 'object'
       or new.envelope_json ? 'permission_policy' then
      raise exception 'Tool policy snapshot must belong only to a valid agents.tool_gates proof'
        using errcode = '23514';
    end if;
    if new.envelope_json->'tool_policy'->>'version' is distinct from '1'
       or pg_catalog.jsonb_typeof(new.envelope_json->'tool_policy'->'gates') is distinct from 'array' then
      raise exception 'Tool policy snapshot version or gates are invalid'
        using errcode = '23514';
    end if;
    if pg_catalog.jsonb_array_length(new.envelope_json->'tool_policy'->'gates') not between 1 and 16 then
      raise exception 'Tool policy snapshot must contain between 1 and 16 gates'
        using errcode = '23514';
    end if;
  elsif new.verifier_id = 'agents.permissions-least-privilege' then
    if v_task_type is distinct from 'agents.permissions'
       or pg_catalog.jsonb_typeof(new.envelope_json->'permission_policy') is distinct from 'object'
       or new.envelope_json ? 'tool_policy' then
      raise exception 'Permission snapshot must belong only to a valid agents.permissions proof'
        using errcode = '23514';
    end if;
    if pg_catalog.jsonb_typeof(new.envelope_json->'permission_policy'->'permissions') is distinct from 'array' then
      raise exception 'Permission policy snapshot must contain a permissions array'
        using errcode = '23514';
    end if;
    if pg_catalog.jsonb_array_length(new.envelope_json->'permission_policy'->'permissions') not between 1 and 20 then
      raise exception 'Permission policy snapshot must contain between 1 and 20 grants'
        using errcode = '23514';
    end if;
  elsif v_task_type in ('agents.tool_gates', 'agents.permissions')
     or new.envelope_json ? 'tool_policy'
     or new.envelope_json ? 'permission_policy' then
    raise exception 'Only the matching trusted policy verifier may persist a policy snapshot'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.nova_validate_mission_policy_attestation()
  from public, anon, authenticated, service_role;

drop trigger if exists nova_validate_mission_tool_policy_attestation
  on public.nova_mission_proof_attestations;
drop trigger if exists nova_validate_mission_policy_attestation
  on public.nova_mission_proof_attestations;
create trigger nova_validate_mission_policy_attestation
  before insert on public.nova_mission_proof_attestations
  for each row execute function public.nova_validate_mission_policy_attestation();
