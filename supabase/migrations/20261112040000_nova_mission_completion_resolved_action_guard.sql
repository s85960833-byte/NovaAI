-- A resolved uncertain action is no longer an unresolved side effect.
-- Preserve the receipt as uncertain for audit; consult the immutable owner-resolution
-- ledger when deciding whether task completion may proceed.
create or replace function public.nova_complete_mission_task(
  p_run_id uuid,
  p_lease_token uuid,
  p_proof_id uuid,
  p_attestation_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $complete$
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
  v_proof_status text;
  v_proof_verified_at timestamptz;
  v_attestation_outcome text;
  v_attestation_verifier text;
  v_attestation_version text;
  v_attestation_proof_id uuid;
  v_attestation_run_id uuid;
  v_sequence bigint;
begin
  if coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Mission task completion is restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_run_id is null or p_lease_token is null
     or p_proof_id is null or p_attestation_id is null then
    raise exception 'Mission completion parameters are required' using errcode = '23514';
  end if;

  select r.mission_id, r.approval_id, r.task_id, r.owner_id
    into v_mission_id, v_approval_id, v_task_id, v_owner_id
    from public.nova_mission_execution_runs r where r.id = p_run_id;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;

  select m.state into v_mission_state
    from public.nova_missions m
   where m.id = v_mission_id and m.owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.status into v_approval_status
    from public.nova_mission_approvals a
   where a.id = v_approval_id and a.owner_id = v_owner_id for update;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select r.status, r.lease_token, r.lease_expires_at
    into v_run_status, v_run_token, v_lease_expiry
    from public.nova_mission_execution_runs r
   where r.id = p_run_id and r.owner_id = v_owner_id for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  select t.status into v_task_status
    from public.nova_mission_tasks t
   where t.id = v_task_id and t.mission_id = v_mission_id and t.owner_id = v_owner_id
   for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  if v_approval_status <> 'approved' or v_mission_state <> 'running'
     or v_run_status <> 'running' or v_task_status <> 'running'
     or v_run_token is distinct from p_lease_token
     or v_lease_expiry is null or v_lease_expiry <= pg_catalog.now() then
    raise exception 'Completion requires the current active approved worker lease'
      using errcode = '55000';
  end if;

  select p.verification_status, p.verified_at
    into v_proof_status, v_proof_verified_at
    from public.nova_mission_proofs p
   where p.id = p_proof_id and p.mission_id = v_mission_id
     and p.task_id = v_task_id and p.owner_id = v_owner_id
   for update;
  if not found or v_proof_status <> 'passed' or v_proof_verified_at is null then
    raise exception 'Completion requires a matching passing verified proof'
      using errcode = '23514';
  end if;

  select a.outcome, a.verifier_id, a.verifier_version, a.proof_id, a.run_id
    into v_attestation_outcome, v_attestation_verifier, v_attestation_version,
         v_attestation_proof_id, v_attestation_run_id
    from public.nova_mission_proof_attestations a
   where a.id = p_attestation_id and a.mission_id = v_mission_id
     and a.task_id = v_task_id and a.owner_id = v_owner_id;
  if not found or v_attestation_outcome <> 'passed'
     or v_attestation_proof_id is distinct from p_proof_id
     or v_attestation_run_id is distinct from p_run_id
     or v_attestation_verifier is null or pg_catalog.btrim(v_attestation_verifier) = ''
     or v_attestation_version is null or pg_catalog.btrim(v_attestation_version) = '' then
    raise exception 'Completion requires a passing attestation bound to this proof and run'
      using errcode = '23514';
  end if;

  -- Reserved actions always block. An uncertain receipt blocks only until its
  -- owner records one immutable resolution; the original receipt stays auditable.
  perform 1 from public.nova_mission_action_receipts a
   where a.run_id = p_run_id and a.mission_id = v_mission_id
     and a.task_id = v_task_id and a.owner_id = v_owner_id
     and (
       a.status = 'reserved'
       or (
         a.status = 'uncertain'
         and not exists (
           select 1 from public.nova_mission_action_resolutions resolution
            where resolution.action_id = a.id
              and resolution.mission_id = v_mission_id
              and resolution.task_id = v_task_id
              and resolution.run_id = p_run_id
              and resolution.owner_id = v_owner_id
         )
       )
     )
   for update;
  if found then
    raise exception 'Completion is blocked by reserved or unresolved uncertain external actions'
      using errcode = '55000';
  end if;

  update public.nova_mission_execution_runs
     set status = 'succeeded', updated_at = pg_catalog.now()
   where id = p_run_id and owner_id = v_owner_id and status = 'running'
     and lease_token = p_lease_token;
  if not found then
    raise exception 'Execution lease changed before completion'
      using errcode = '55000';
  end if;

  update public.nova_mission_tasks
     set status = 'completed', result_json = pg_catalog.jsonb_build_object(
       'proof_id', p_proof_id, 'attestation_id', p_attestation_id,
       'verifier_id', v_attestation_verifier,
       'verifier_version', v_attestation_version
     ), updated_at = pg_catalog.now()
   where id = v_task_id and mission_id = v_mission_id
     and owner_id = v_owner_id and status = 'running';
  if not found then
    raise exception 'Task state changed before completion' using errcode = '55000';
  end if;

  if not exists (
    select 1 from public.nova_mission_tasks t
     where t.mission_id = v_mission_id and t.owner_id = v_owner_id
       and t.status <> 'completed'
  ) then
    update public.nova_missions
       set state = 'completed', version = version + 1, updated_at = pg_catalog.now()
     where id = v_mission_id and owner_id = v_owner_id and state = 'running';
  else
    update public.nova_missions
       set version = version + 1, updated_at = pg_catalog.now()
     where id = v_mission_id and owner_id = v_owner_id and state = 'running';
  end if;

  select coalesce(max(e.sequence), 0) + 1 into v_sequence
    from public.nova_mission_events e where e.mission_id = v_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    v_mission_id, v_owner_id, v_sequence, 'task.execution_completed',
    'running', case when not exists (
      select 1 from public.nova_mission_tasks t
       where t.mission_id = v_mission_id and t.owner_id = v_owner_id
         and t.status <> 'completed'
    ) then 'completed' else 'running' end,
    v_owner_id,
    pg_catalog.jsonb_build_object(
      'task_id',v_task_id,'run_id',p_run_id,'proof_id',p_proof_id,
      'attestation_id',p_attestation_id,'verifier_id',v_attestation_verifier,
      'verifier_version',v_attestation_version
    )
  );
  return 'succeeded';
end;
$complete$;

revoke all on function public.nova_complete_mission_task(uuid,uuid,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.nova_complete_mission_task(uuid,uuid,uuid,uuid)
  to service_role;
