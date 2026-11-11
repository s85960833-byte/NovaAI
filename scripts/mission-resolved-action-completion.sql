-- Regression: an owner-resolved uncertain action remains auditable but no longer
-- deadlocks lease-fenced task completion.
insert into auth.users(id,email)
values ('11111111-1111-4111-8111-111111111111','mission-owner@example.test')
on conflict (id) do nothing;

create temp table mission_resolved_action_fixture (
  mission_id uuid, task_id uuid, approval_id uuid, run_id uuid,
  action_id uuid, lease_token uuid, proof_id uuid, attestation_id uuid
);

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

  -- Simulate a worker ending after reserving an action: receipt must become uncertain.
  perform public.nova_fail_mission_task(
    v_run,v_token,'WORKER_INTERRUPTED','Worker stopped before action finalization',0
  );
  if (select status from public.nova_mission_action_receipts where id=v_action) <> 'uncertain' then
    raise exception 'Abandoned action was not marked uncertain';
  end if;

  insert into mission_resolved_action_fixture(mission_id,task_id,approval_id,run_id,action_id)
  values(v_mission,v_task,v_approval,v_run,v_action);
end;
$fixture$;
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
