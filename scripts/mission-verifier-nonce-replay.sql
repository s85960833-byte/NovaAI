-- Regression tests for persistent verifier nonce replay protection.
-- Run after all migrations with scripts/test-supabase-migrations.sh.

set role service_role;
select set_config('request.jwt.claim.role', 'service_role', false);

do $nonce_replay_tests$
declare
  v_nonce uuid := gen_random_uuid();
  v_duplicate_nonce uuid := gen_random_uuid();
  v_run uuid := gen_random_uuid();
  v_rejected boolean := false;
  v_checks jsonb;
begin
  -- A failed proof persistence must roll back the nonce reservation in the same RPC transaction.
  begin
    perform public.nova_persist_mission_proof_and_complete_with_nonce(
      v_run,
      'nonce-rollback-test-worker',
      gen_random_uuid(),
      jsonb_build_object(
        'output',jsonb_build_object('fixture','test-output'),
        'verifier_id','test.nonce-rollback',
        'checks',jsonb_build_array(jsonb_build_object('id','rollback','passed',true))
      ),
      repeat('a',64),
      'Expected to fail because the run does not exist',
      'test.nonce-rollback',
      v_nonce
    );
    raise exception 'Nonce wrapper unexpectedly accepted a missing execution run';
  exception when sqlstate 'P0002' then
    null;
  end;

  -- Database boundary rejects unsupported envelope and check fields before nonce use.
  begin
    perform public.nova_persist_mission_proof_and_complete_with_nonce(
      v_run, 'nonce-envelope-test-worker', gen_random_uuid(),
      jsonb_build_object(
        'schema_version','nova.proof.v2',
        'mission_id',gen_random_uuid()::text,
        'task_id',gen_random_uuid()::text,
        'run_id',v_run::text,
        'output',jsonb_build_object('fixture','test-output'),
        'verifier_id','test.nonce-envelope',
        'verifier_version','1.0.0',
        'observed_at',now()::text,
        'outcome','passed',
        'checks',jsonb_build_array(jsonb_build_object('id','shape','passed',true)),
        'assurance_level','external_verified'
      ),
      repeat('a',64), 'Unsupported envelope field test',
      'test.nonce-envelope', gen_random_uuid()
    );
    raise exception 'Unsupported proof envelope field was accepted';
  exception when check_violation then
    null;
  end;

  begin
    perform public.nova_persist_mission_proof_and_complete_with_nonce(
      v_run, 'nonce-check-test-worker', gen_random_uuid(),
      jsonb_build_object(
        'schema_version','nova.proof.v2',
        'mission_id',gen_random_uuid()::text,
        'task_id',gen_random_uuid()::text,
        'run_id',v_run::text,
        'output',jsonb_build_object('fixture','test-output'),
        'verifier_id','test.nonce-check',
        'verifier_version','1.0.0',
        'observed_at',now()::text,
        'outcome','passed',
        'checks',jsonb_build_array(jsonb_build_object('id','shape','passed',true,'evidence_url','https://example.invalid'))
      ),
      repeat('a',64), 'Unsupported check field test',
      'test.nonce-check', gen_random_uuid()
    );
    raise exception 'Unsupported proof check field was accepted';
  exception when check_violation then
    null;
  end;

  -- Scalar and array envelopes must be rejected cleanly at the database boundary.
  foreach v_checks in array array['null'::jsonb, '42'::jsonb, '"text"'::jsonb, '[]'::jsonb] loop
    begin
      perform public.nova_persist_mission_proof_and_complete_with_nonce(
        v_run, 'nonce-non-object-envelope-worker', gen_random_uuid(),
        v_checks, repeat('a',64), 'Non-object envelope test',
        'test.non-object-envelope', gen_random_uuid()
      );
      raise exception 'Non-object proof envelope was accepted';
    exception when check_violation then
      null;
    end;
  end loop;

  -- A proof without the exact output it attests must fail before nonce consumption.
  begin
    perform public.nova_persist_mission_proof_and_complete_with_nonce(
      v_run, 'nonce-missing-output-test-worker', gen_random_uuid(),
      jsonb_build_object(
        'schema_version','nova.proof.v2',
        'mission_id',gen_random_uuid()::text,
        'task_id',gen_random_uuid()::text,
        'run_id',v_run::text,
        'verifier_id','test.nonce-missing-output',
        'verifier_version','1.0.0',
        'observed_at',now()::text,
        'outcome','passed',
        'checks',jsonb_build_array(jsonb_build_object('id','shape','passed',true))
      ),
      repeat('a',64), 'Missing output proof test',
      'test.nonce-missing-output', gen_random_uuid()
    );
    raise exception 'Proof without task output was accepted';
  exception when check_violation then
    null;
  end;

  -- Non-array check containers must be rejected as a constraint violation,
  -- never leak jsonb_array_elements runtime errors from the database boundary.
  foreach v_checks in array array['null'::jsonb, '"not-an-array"'::jsonb, '{}'::jsonb] loop
    begin
      perform public.nova_persist_mission_proof_and_complete_with_nonce(
        v_run, 'nonce-non-array-check-test-worker', gen_random_uuid(),
        jsonb_build_object(
          'schema_version','nova.proof.v2',
          'mission_id',gen_random_uuid()::text,
          'task_id',gen_random_uuid()::text,
          'run_id',v_run::text,
          'output',jsonb_build_object('fixture','test-output'),
          'verifier_id','test.nonce-non-array-checks',
          'verifier_version','1.0.0',
          'observed_at',now()::text,
          'outcome','passed',
          'checks',v_checks
        ),
        repeat('a',64), 'Non-array proof checks test',
        'test.nonce-non-array-checks', gen_random_uuid()
      );
      raise exception 'Non-array proof checks were accepted';
    exception when check_violation then
      null;
    end;
  end loop;

  -- A committed nonce cannot be consumed a second time, even under another run.
  insert into public.nova_mission_verifier_nonce_ledger(verifier_id, verifier_nonce, run_id)
  values ('test.nonce-replay', v_duplicate_nonce, v_run);
  begin
    insert into public.nova_mission_verifier_nonce_ledger(verifier_id, verifier_nonce, run_id)
    values ('test.nonce-replay', v_duplicate_nonce, gen_random_uuid());
    raise exception 'Duplicate verifier nonce was accepted';
  exception when unique_violation then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Duplicate nonce regression test did not observe unique_violation';
  end if;
end;
$nonce_replay_tests$;

reset role;

do $nonce_rollback_assertion$
begin
  if exists (
    select 1 from public.nova_mission_verifier_nonce_ledger
     where verifier_id = 'test.nonce-rollback'
  ) then
    raise exception 'Nonce remained consumed after proof persistence rolled back';
  end if;
  if not exists (
    select 1 from public.nova_mission_verifier_nonce_ledger
     where verifier_id = 'test.nonce-replay'
  ) then
    raise exception 'Replay ledger did not retain the first accepted nonce';
  end if;
  if has_function_privilege('anon',
       'public.nova_persist_mission_proof_and_complete_with_nonce(uuid,text,uuid,jsonb,text,text,text,uuid)','execute')
     or has_function_privilege('authenticated',
       'public.nova_persist_mission_proof_and_complete_with_nonce(uuid,text,uuid,jsonb,text,text,text,uuid)','execute')
     or not has_function_privilege('service_role',
       'public.nova_persist_mission_proof_and_complete_with_nonce(uuid,text,uuid,jsonb,text,text,text,uuid)','execute') then
    raise exception 'Nonce-protected proof RPC must be service_role only';
  end if;
end;
$nonce_rollback_assertion$;


do $nonce_ledger_privileges$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'nova_mission_verifier_nonce_ledger'
      and c.relrowsecurity
  ) then
    raise exception 'Verifier nonce ledger must have row-level security enabled';
  end if;

  if not has_table_privilege('service_role',
       'public.nova_mission_verifier_nonce_ledger','INSERT')
     or has_table_privilege('service_role',
       'public.nova_mission_verifier_nonce_ledger','SELECT')
     or has_table_privilege('service_role',
       'public.nova_mission_verifier_nonce_ledger','UPDATE')
     or has_table_privilege('service_role',
       'public.nova_mission_verifier_nonce_ledger','DELETE')
     or has_table_privilege('authenticated',
       'public.nova_mission_verifier_nonce_ledger','INSERT')
     or has_table_privilege('anon',
       'public.nova_mission_verifier_nonce_ledger','INSERT') then
    raise exception 'Nonce ledger must allow insert-only access to service_role and deny client access';
  end if;
end;
$nonce_ledger_privileges$;
