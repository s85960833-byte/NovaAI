-- Trusted proof persistence and lease-fenced completion.
-- The caller must be the server-side verifier; the Edge Function authenticates it
-- with a Supabase secret key plus a verifier-specific HMAC. This RPC is atomic.

create unique index if not exists nova_mission_proof_attestations_run_uidx
  on public.nova_mission_proof_attestations(run_id);

create or replace function public.nova_persist_mission_proof_and_complete(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token uuid,
  p_envelope jsonb,
  p_evidence_digest text,
  p_summary text
)
returns table (proof_id uuid, attestation_id uuid, completion_status text)
language plpgsql
security invoker
set search_path = ''
as $proof$
declare
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_worker_id text;
  v_lease_token uuid;
  v_lease_expires_at timestamptz;
  v_task_status text;
  v_observed_at timestamptz;
  v_check_count integer;
  v_proof_id uuid;
  v_attestation_id uuid;
  v_verifier_id text;
  v_verifier_version text;
  v_sequence bigint;
begin
  if current_user <> 'service_role'
     or coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Proof persistence is restricted to the trusted server role'
      using errcode = '42501';
  end if;

  if p_run_id is null or p_lease_token is null
     or p_worker_id is null or pg_catalog.char_length(pg_catalog.btrim(p_worker_id)) not between 1 and 120
     or p_envelope is null or pg_catalog.jsonb_typeof(p_envelope) <> 'object'
     or p_evidence_digest is null or p_evidence_digest !~ '^[0-9a-f]{64}$'
     or p_summary is null or pg_catalog.char_length(pg_catalog.btrim(p_summary)) not between 1 and 2000 then
    raise exception 'Proof persistence parameters are invalid' using errcode = '23514';
  end if;

  -- Resolve trusted ownership and scope from the run; never accept owner/task/mission
  -- identifiers as independent authority from the caller.
  select r.mission_id, r.approval_id, r.task_id, r.owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs r
   where r.id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  -- Match the global lock order used by claim and completion: mission -> approval -> run -> task.
  select m.state into v_mission_state
    from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;

  select a.status into v_approval_status
    from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;

  select r.status, r.worker_id, r.lease_token, r.lease_expires_at
    into v_run_status, v_worker_id, v_lease_token, v_lease_expires_at
    from public.nova_mission_execution_runs r
   where r.id = p_run_id and r.owner_id = v_owner_id for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select t.status into v_task_status
    from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  if v_mission_state <> 'running' or v_approval_status <> 'approved'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_worker_id is distinct from pg_catalog.btrim(p_worker_id)
     or v_lease_token is distinct from p_lease_token
     or v_lease_expires_at is null or v_lease_expires_at <= pg_catalog.now() then
    raise exception 'Proof requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  if p_envelope->>'schema_version' is distinct from 'nova.proof.v1'
     or p_envelope->>'mission_id' is distinct from v_mission_id::text
     or p_envelope->>'task_id' is distinct from v_task_id::text
     or p_envelope->>'run_id' is distinct from p_run_id::text
     or p_envelope->>'outcome' is distinct from 'passed'
     or pg_catalog.char_length(coalesce(p_envelope->>'verifier_id','')) not between 1 and 80
     or pg_catalog.char_length(coalesce(p_envelope->>'verifier_version','')) not between 1 and 40
     or pg_catalog.jsonb_typeof(p_envelope->'checks') is distinct from 'array' then
    raise exception 'Proof envelope does not match the active task, run or verifier contract'
      using errcode = '23514';
  end if;

  v_check_count := pg_catalog.jsonb_array_length(p_envelope->'checks');
  if v_check_count not between 1 and 50
     or exists (
       select 1 from pg_catalog.jsonb_array_elements(p_envelope->'checks') as check_item(value)
        where pg_catalog.jsonb_typeof(check_item.value) is distinct from 'object'
           or pg_catalog.jsonb_typeof(check_item.value->'passed') is distinct from 'boolean'
           or check_item.value->>'passed' is distinct from 'true'
           or pg_catalog.char_length(pg_catalog.btrim(coalesce(check_item.value->>'id',''))) not between 1 and 100
           or pg_catalog.char_length(coalesce(check_item.value->>'detail','')) > 1000
     )
     or (select count(distinct check_item.value->>'id')
           from pg_catalog.jsonb_array_elements(p_envelope->'checks') as check_item(value)) <> v_check_count then
    raise exception 'Only a complete passing proof with unique checks can be persisted'
      using errcode = '23514';
  end if;

  begin
    v_observed_at := (p_envelope->>'observed_at')::timestamptz;
  exception when others then
    raise exception 'Proof observation timestamp is invalid' using errcode = '23514';
  end;
  if v_observed_at is null or v_observed_at > pg_catalog.now() + interval '5 minutes'
     or v_observed_at < pg_catalog.now() - interval '24 hours' then
    raise exception 'Proof observation timestamp is outside the accepted window'
      using errcode = '23514';
  end if;

  v_verifier_id := p_envelope->>'verifier_id';
  v_verifier_version := p_envelope->>'verifier_version';

  -- One proof completion per execution run; replay cannot create a second proof.
  if exists (
    select 1 from public.nova_mission_proof_attestations a where a.run_id = p_run_id
  ) then
    raise exception 'This execution run already has a persisted proof'
      using errcode = '23505';
  end if;

  v_proof_id := gen_random_uuid();
  insert into public.nova_mission_proofs(
    id, mission_id, task_id, owner_id, proof_type, summary,
    verification_status, evidence_json, verified_at
  ) values (
    v_proof_id, v_mission_id, v_task_id, v_owner_id, 'trusted_verifier',
    pg_catalog.btrim(p_summary), 'passed', p_envelope, pg_catalog.now()
  );

  v_attestation_id := gen_random_uuid();
  insert into public.nova_mission_proof_attestations(
    id, proof_id, mission_id, task_id, run_id, owner_id,
    verifier_id, verifier_version, evidence_digest, envelope_json,
    outcome, check_count, observed_at
  ) values (
    v_attestation_id, v_proof_id, v_mission_id, v_task_id, p_run_id, v_owner_id,
    v_verifier_id, v_verifier_version, p_evidence_digest, p_envelope,
    'passed', v_check_count, v_observed_at
  );

  -- Nested function call remains in this transaction. Any failure rolls back both inserts.
  perform public.nova_complete_mission_task(
    p_run_id, p_lease_token, v_proof_id, v_attestation_id
  );

  return query select v_proof_id, v_attestation_id, 'succeeded'::text;
end;
$proof$;

revoke all on function public.nova_persist_mission_proof_and_complete(uuid,text,uuid,jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.nova_persist_mission_proof_and_complete(uuid,text,uuid,jsonb,text,text)
  to service_role;
