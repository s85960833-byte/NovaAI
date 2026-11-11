-- Defense in depth: enforce the proof JSON allowlist at the database boundary too.
-- The Edge Function remains responsible for cryptographic verification; this RPC
-- prevents accidental future callers from persisting unsupported envelope claims.

create or replace function public.nova_persist_mission_proof_and_complete_with_nonce(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token uuid,
  p_envelope jsonb,
  p_evidence_digest text,
  p_summary text,
  p_verifier_id text,
  p_verifier_nonce uuid
)
returns table (proof_id uuid, attestation_id uuid, completion_status text)
language plpgsql
security invoker
set search_path = ''
as $nonce$
begin
  if current_user <> 'service_role'
     or coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Verifier nonce consumption is restricted to the trusted server role'
      using errcode = '42501';
  end if;

  if p_run_id is null or p_verifier_nonce is null or p_verifier_id is null
     or p_envelope is null or pg_catalog.jsonb_typeof(p_envelope) is distinct from 'object'
     or p_envelope->>'verifier_id' is distinct from p_verifier_id then
    raise exception 'Verifier nonce binding is invalid' using errcode = '23514';
  end if;

  if exists (
    select 1
      from pg_catalog.jsonb_object_keys(p_envelope) as envelope_key(key)
     where envelope_key.key not in (
       'schema_version', 'mission_id', 'task_id', 'run_id', 'verifier_id',
       'verifier_version', 'observed_at', 'outcome', 'checks',
       'tool_policy', 'permission_policy'
     )
  ) then
    raise exception 'Proof envelope contains unsupported fields' using errcode = '23514';
  end if;

  if (p_verifier_id = 'agents.tool-gates-policy'
        and (not (p_envelope ? 'tool_policy') or p_envelope ? 'permission_policy'))
     or (p_verifier_id = 'agents.permissions-least-privilege'
        and (not (p_envelope ? 'permission_policy') or p_envelope ? 'tool_policy'))
     or (p_verifier_id not in ('agents.tool-gates-policy','agents.permissions-least-privilege')
        and (p_envelope ? 'tool_policy' or p_envelope ? 'permission_policy')) then
    raise exception 'Proof policy snapshot does not match the trusted verifier' using errcode = '23514';
  end if;

  if pg_catalog.jsonb_typeof(p_envelope->'checks') is distinct from 'array'
     or exists (
       select 1
         from pg_catalog.jsonb_array_elements(p_envelope->'checks') as check_item(value)
        where pg_catalog.jsonb_typeof(check_item.value) is distinct from 'object'
           or pg_catalog.jsonb_typeof(check_item.value->'id') is distinct from 'string'
           or pg_catalog.jsonb_typeof(check_item.value->'passed') is distinct from 'boolean'
           or (check_item.value ? 'detail'
               and pg_catalog.jsonb_typeof(check_item.value->'detail') is distinct from 'string')
           or exists (
             select 1
               from pg_catalog.jsonb_object_keys(
                 case when pg_catalog.jsonb_typeof(check_item.value) = 'object'
                      then check_item.value else '{}'::jsonb end
               ) as check_key(key)
              where check_key.key not in ('id', 'passed', 'detail')
           )
     ) then
    raise exception 'Proof checks contain unsupported fields or invalid shapes'
      using errcode = '23514';
  end if;

  -- Nonce consumption and proof persistence remain one atomic transaction.
  insert into public.nova_mission_verifier_nonce_ledger(verifier_id, verifier_nonce, run_id)
  values (p_verifier_id, p_verifier_nonce, p_run_id);

  return query
    select persisted.proof_id, persisted.attestation_id, persisted.completion_status
      from public.nova_persist_mission_proof_and_complete(
        p_run_id, p_worker_id, p_lease_token, p_envelope, p_evidence_digest, p_summary
      ) as persisted;
end;
$nonce$;
