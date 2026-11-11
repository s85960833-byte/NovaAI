-- Regression: an owner-resolved uncertain action remains auditable but no longer
-- deadlocks lease-fenced task completion.
insert into auth.users(id,email)
values ('11111111-1111-4111-8111-111111111111','mission-owner@example.test')
on conflict (id) do nothing;

create temp table mission_resolved_action_fixture (
  mission_id uuid, task_id uuid, approval_id uuid, run_id uuid,
  action_id uuid, lease_token uuid, proof_id uuid, attestation_id uuid
);

-- The fixture is created by the database test owner but accessed under
-- service_role/authenticated below; grant only the operations each test role needs.
grant select, insert on mission_resolved_action_fixture to service_role;
grant select on mission_resolved_action_fixture to authenticated;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $fixture$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_action uuid;
begin
  if (
    select count(*) from pg_catalog.pg_trigger
     where tgrelid = 'public.nova_mission_action_receipts'::regclass
       and tgfoid = 'public.nova_guard_unresolved_mission_action()'::regprocedure
       and not tgisinternal
  ) <> 1 then
    raise exception 'Exactly one mission-wide unresolved-action guard trigger must be installed';
  end if;

  v_mission := public.nova_create_mission(
    v_owner,'Resolved action completion regression',
    'Complete only after explicit owner resolution','agents',
    'mission-resolved-action-completion-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Resolved action task","description":"Verify owner-resolved action completion","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Verify owner-resolved action completion"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-resolved-action-completion-001',
    'Run resolved action completion regression'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved regression fixture');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'resolved-action-worker',120);
  select action_id into v_action
    from public.nova_reserve_mission_action(v_run,v_token,'resolved-action-completion-001',repeat('a',64));

  -- Mark the outcome uncertain while the worker lease is still active.
  perform public.nova_mark_mission_action_uncertain(
    v_action,v_token,'Provider outcome is ambiguous; owner review is required'
  );
  if (select status from public.nova_mission_action_receipts where id=v_action) <> 'uncertain' then
    raise exception 'Active worker action was not marked uncertain';
  end if;

  -- An unresolved uncertain receipt blocks a different action key mission-wide.
  begin
    perform * from public.nova_reserve_mission_action(
      v_run,v_token,'blocked-before-owner-resolution',repeat('c',64)
    );
    raise exception 'A different action was reserved while an earlier action remained unresolved';
  exception when sqlstate '55P03' then
    null;
  end;

  insert into mission_resolved_action_fixture(mission_id,task_id,approval_id,run_id,action_id,lease_token)
  values(v_mission,v_task,v_approval,v_run,v_action,v_token);
end;
$fixture$;
reset role;

-- An owner may not unlock another action while the original worker lease is active.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $active_resolution$
begin
  perform public.nova_resolve_uncertain_mission_action(
    (select action_id from mission_resolved_action_fixture),
    'confirmed_not_executed',
    'provider-audit:case-active-lease',
    'Checked the provider activity log and confirmed this request was not executed.'
  );
  raise exception 'Owner resolution unexpectedly succeeded while worker lease was active';
exception when sqlstate '55P03' then null;
end;
$active_resolution$;
reset role;

-- Revoke the worker lease first; only then may the owner record the final resolution.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $release$
declare
  v_run uuid;
  v_token uuid;
  v_status text;
begin
  select run_id,lease_token into v_run,v_token from mission_resolved_action_fixture;
  v_status := public.nova_fail_mission_task(
    v_run,v_token,'WORKER_INTERRUPTED','Worker stopped before action finalization',0
  );
  if v_status <> 'authorized'
     or exists (
       select 1 from public.nova_mission_execution_runs
        where id=v_run
          and (worker_id is not null or lease_token is not null
               or lease_expires_at is not null or heartbeat_at is not null)
     ) then
    raise exception 'Worker lease metadata was not fully cleared before owner resolution';
  end if;
end;
$release$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select public.nova_resolve_uncertain_mission_action(
  (select action_id from mission_resolved_action_fixture),
  'confirmed_not_executed',
  'provider-audit:case-2026-001',
  'Checked the provider activity log and confirmed this action was not executed.'
);
reset role;

set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $completion$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
  v_run uuid;
  v_token uuid;
  v_proof uuid;
  v_attestation uuid;
  v_envelope jsonb;
  v_status text;
begin
  select mission_id,task_id,run_id
    into v_mission,v_task,v_run from mission_resolved_action_fixture;
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'resolved-action-retry-worker',120);
  if v_token is null then raise exception 'Could not reclaim run after owner resolution'; end if;

  -- Once the owner resolves the earlier receipt, a new action key is allowed.
  select action_id into v_action
    from public.nova_reserve_mission_action(
      v_run,v_token,'allowed-after-owner-resolution',repeat('c',64)
    );
  if v_action is null then raise exception 'Resolved action did not release the mission-wide action guard'; end if;
  if public.nova_complete_mission_action(
       v_action,v_token,repeat('d',64),'provider-audit:followup-action'
     ) <> 'completed' then
    raise exception 'Follow-up action did not complete after owner resolution';
  end if;

  insert into public.nova_mission_proofs(
    mission_id,task_id,owner_id,proof_type,summary,verification_status,evidence_json,verified_at
  ) values (
    v_mission,v_task,v_owner,'browser-check','Resolved action completion proof','passed',
    '{"checks":[{"id":"owner-resolution-reviewed","passed":true}]}'::jsonb,now()
  ) returning id into v_proof;
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','nova.resolved-action-integration-verifier','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','owner-resolution-reviewed','passed',true))
  );
  insert into public.nova_mission_proof_attestations(
    proof_id,mission_id,task_id,run_id,owner_id,verifier_id,verifier_version,
    evidence_digest,envelope_json,outcome,check_count,observed_at
  ) values (
    v_proof,v_mission,v_task,v_run,v_owner,'nova.resolved-action-integration-verifier',
    '1.0.0',repeat('b',64),v_envelope,'passed',1,now()
  ) returning id into v_attestation;

  v_status := public.nova_complete_mission_task(v_run,v_token,v_proof,v_attestation);
  if v_status <> 'succeeded'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'completed'
     or (select status from public.nova_mission_action_receipts
          where id=(select action_id from mission_resolved_action_fixture)) <> 'uncertain'
     or not exists (select 1 from public.nova_mission_action_resolutions
          where action_id=(select action_id from mission_resolved_action_fixture)) then
    raise exception 'Owner-resolved uncertain action did not permit auditable task completion';
  end if;
end;
$completion$;
reset role;
