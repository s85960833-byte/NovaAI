-- Runs against an isolated PostgreSQL database with Supabase-compatible auth roles/functions.
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','bi-owner@example.invalid'),
 ('22222222-2222-4222-8222-222222222222','bi-outsider@example.invalid'),
 ('33333333-3333-4333-8333-333333333333','bi-admin@example.invalid'),
 ('44444444-4444-4444-8444-444444444444','bi-invitee@example.invalid'),
 ('55555555-5555-4555-8555-555555555555','bi-analyst@example.invalid');

-- Exercise the standalone NOVA account workspace table independently of NOVA BI tenants.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.nova_user_workspaces(user_id,payload)
values('11111111-1111-4111-8111-111111111111','{"chats":[{"id":"owner-chat"}]}'::jsonb);
do $workspace_owner$
begin
  if (select count(*) from public.nova_user_workspaces) <> 1 then
    raise exception 'NOVA account owner cannot read their own workspace backup';
  end if;
end $workspace_owner$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $workspace_outsider$
begin
  if exists(select 1 from public.nova_user_workspaces where user_id='11111111-1111-4111-8111-111111111111') then
    raise exception 'Cross-account NOVA workspace backup leak detected';
  end if;
  begin
    insert into public.nova_user_workspaces(user_id,payload)
    values('11111111-1111-4111-8111-111111111111','{"chats":[{"id":"attacker-chat"}]}'::jsonb);
    raise exception 'NOVA account user unexpectedly inserted a backup for another account';
  exception when insufficient_privilege then
    null;
  end;
end $workspace_outsider$;
insert into public.nova_user_workspaces(user_id,payload)
values('22222222-2222-4222-8222-222222222222','{"chats":[{"id":"outsider-own-chat"}]}'::jsonb);
do $workspace_own$
begin
  if (select count(*) from public.nova_user_workspaces) <> 1 then
    raise exception 'NOVA account user cannot read only their own workspace backup';
  end if;
end $workspace_own$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.nova_bi_organizations(id,name,created_by)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Acme Test','11111111-1111-4111-8111-111111111111');

reset role;
-- Simulate an organization that predates the branding row, then verify the forward-only backfill.
delete from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
insert into public.nova_bi_branding(organization_id,brand_name)
select id,name from public.nova_bi_organizations
on conflict (organization_id) do nothing;
do $branding_backfill$
begin
  if not exists(select 1 from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and brand_name='Acme Test') then
    raise exception 'Forward branding backfill did not restore the missing organization branding row';
  end if;
end $branding_backfill$;
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
insert into public.nova_bi_organizations(id,name,created_by)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Other Test','22222222-2222-4222-8222-222222222222');

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.nova_bi_datasets(id,organization_id,created_by,name,source_type,fingerprint,row_count,column_names)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111','Finance CSV','csv','fingerprint-acme-001',10,'["client","amount"]'::jsonb);
insert into public.nova_bi_analyses(id,organization_id,dataset_id,created_by,analysis_type,calculation_version,result_json,evidence_json,assumptions_json)
values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111',
'cost_leaks','test-v1','{"total":100}'::jsonb,'{"rows":[2,3]}'::jsonb,'{"currency":"INR"}'::jsonb);
insert into public.nova_bi_workflow_proposals(id,organization_id,created_by,title,status,proposal_json,idempotency_key)
values('ffffffff-ffff-4fff-8fff-ffffffffffff','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111','Review supplier spend','proposed',
'{"steps":["review"]}'::jsonb,'idempotency-acme-001');

do $rls_owner_seed$
begin
  if not exists (select 1 from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and brand_name='Acme Test') then
    raise exception 'Organization bootstrap must create default branding';
  end if;
  if (select count(*) from public.nova_bi_organizations) <> 1 then
    raise exception 'Tenant isolation failed: owner should see exactly one organization';
  end if;
  if (select count(*) from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') <> 1 then
    raise exception 'Owner cannot read own dataset';
  end if;
  if not exists(select 1 from public.nova_bi_audit_events where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Owner cannot read the company audit log';
  end if;
  begin
    update public.nova_bi_workflow_proposals set status='approved'
    where id='ffffffff-ffff-4fff-8fff-ffffffffffff';
    raise exception 'Creator unexpectedly approved own proposal';
  exception when insufficient_privilege then
    null;
  end;
end $rls_owner_seed$;

reset role;
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','admin','active');
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','viewer','invited');
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','55555555-5555-4555-8555-555555555555','analyst','active');

-- Seed cross-tenant-readable child resources so every tenant-scoped RLS surface is exercised.
insert into public.nova_bi_workflow_proposals(id,organization_id,created_by,title,status,proposal_json,idempotency_key)
values('acacacac-acac-4cac-8cac-acacacacacac','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111','Approved workflow fixture','approved',
'{"steps":["approved"]}'::jsonb,'idempotency-acme-approved-001');
insert into public.nova_bi_workflow_approvals(id,organization_id,proposal_id,actor_id,decision)
values('adadadad-adad-4dad-8dad-adadadadadad','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'acacacac-acac-4cac-8cac-acacacacacac','33333333-3333-4333-8333-333333333333','approved');
insert into public.nova_bi_workflow_executions(id,organization_id,proposal_id,idempotency_key,status,result_summary)
values('aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'acacacac-acac-4cac-8cac-acacacacacac','idempotency-acme-execution-001','succeeded','{"verified":true}'::jsonb);
insert into public.nova_bi_workflow_proposals(id,organization_id,created_by,title,status,proposal_json,idempotency_key)
values('abababab-abab-4bab-8bab-abababababab','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111','Analyst role approval test','proposed',
'{"steps":["review"]}'::jsonb,'idempotency-acme-analyst-001');

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $rls_outsider$
begin
  if (select count(*) from public.nova_bi_organizations) <> 1 then
    raise exception 'Tenant isolation failed: outsider should only see their own organization';
  end if;
  if exists(select 1 from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') then
    raise exception 'Cross-tenant dataset leak detected';
  end if;
  if exists(select 1 from public.nova_bi_analyses where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Cross-tenant analysis leak detected';
  end if;
  if exists(select 1 from public.nova_bi_workflow_proposals where id='acacacac-acac-4cac-8cac-acacacacacac') then
    raise exception 'Cross-tenant workflow proposal leak detected';
  end if;
  if exists(select 1 from public.nova_bi_workflow_approvals where id='adadadad-adad-4dad-8dad-adadadadadad') then
    raise exception 'Cross-tenant workflow approval leak detected';
  end if;
  if exists(select 1 from public.nova_bi_workflow_executions where id='aeaeaeae-aeae-4eae-8eae-aeaeaeaeaeae') then
    raise exception 'Cross-tenant workflow execution leak detected';
  end if;
  if exists(select 1 from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Cross-tenant branding leak detected';
  end if;
  if exists(select 1 from public.nova_bi_audit_events where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Cross-tenant audit leak detected';
  end if;
  if has_table_privilege('authenticated','public.nova_bi_memberships','insert') then
    raise exception 'Authenticated clients must not insert membership rows directly';
  end if;
  <<cross_tenant_insert>>
  begin
    insert into public.nova_bi_datasets(organization_id,created_by,name,source_type,fingerprint,row_count,column_names)
    values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',
      'Outsider cross-tenant write','csv','outsider-write-denied-001',1,'["amount"]'::jsonb);
    raise exception 'Outsider unexpectedly inserted a dataset into another tenant';
  exception when insufficient_privilege then
    null;
  end cross_tenant_insert;
end $rls_outsider$;
update public.nova_bi_datasets set name='Hacked' where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
delete from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
delete from public.nova_bi_analyses where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
update public.nova_bi_workflow_proposals set status='rejected'
where id='acacacac-acac-4cac-8cac-acacacacacac';
update public.nova_bi_branding set brand_name='Outsider Must Not Rebrand'
where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
reset role;
do $rls_outsider_write_check$
begin
  if (select name from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') is distinct from 'Finance CSV' then
    raise exception 'Outsider unexpectedly modified or deleted another tenant dataset';
  end if;
  if not exists(select 1 from public.nova_bi_analyses where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Outsider unexpectedly deleted another tenant analysis';
  end if;
  if (select status from public.nova_bi_workflow_proposals where id='acacacac-acac-4cac-8cac-acacacacacac') is distinct from 'approved' then
    raise exception 'Outsider unexpectedly changed another tenant workflow';
  end if;
  if (select brand_name from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is distinct from 'Acme Test' then
    raise exception 'Outsider unexpectedly changed another tenant branding';
  end if;
end $rls_outsider_write_check$;

set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
update public.nova_bi_workflow_proposals set status='approved'
where id='ffffffff-ffff-4fff-8fff-ffffffffffff';
do $$
begin
  if not exists(select 1 from public.nova_bi_workflow_approvals where proposal_id='ffffffff-ffff-4fff-8fff-ffffffffffff' and actor_id='33333333-3333-4333-8333-333333333333' and decision='approved') then
    raise exception 'Admin approval record was not created';
  end if;
  if not exists(select 1 from public.nova_bi_audit_events where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Active admin cannot read the company audit log';
  end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
update public.nova_bi_workflow_proposals set status='approved'
where id='abababab-abab-4bab-8bab-abababababab';
update public.nova_bi_branding set brand_name='Analyst Must Not Rebrand'
where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$
begin
  if (select status from public.nova_bi_workflow_proposals where id='abababab-abab-4bab-8bab-abababababab') <> 'proposed' then
    raise exception 'Analyst unexpectedly approved a workflow';
  end if;
  if (select brand_name from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') = 'Analyst Must Not Rebrand' then
    raise exception 'Analyst unexpectedly changed company branding';
  end if;
  if exists(select 1 from public.nova_bi_audit_events where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Analyst unexpectedly read the company audit log';
  end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
do $$
begin
  if (select count(*) from public.nova_bi_organizations where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 1 then
    raise exception 'Invited user should see the organization invitation target';
  end if;
  if exists(select 1 from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') then
    raise exception 'Invited but inactive user must not read company datasets';
  end if;
end $$;
update public.nova_bi_memberships set status='active'
where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id='44444444-4444-4444-8444-444444444444' and status='invited';
do $$
begin
  if (select count(*) from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') <> 1 then
    raise exception 'Accepted member should now read tenant datasets';
  end if;
end $$;
do $$
begin
  begin
    insert into public.nova_bi_datasets(organization_id,created_by,name,source_type,fingerprint,row_count,column_names)
    values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',
      'Viewer write must fail','csv','viewer-write-denied-001',1,'["amount"]'::jsonb);
    raise exception 'Viewer unexpectedly created a dataset';
  exception when insufficient_privilege then null;
  end;
end $$;
delete from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
do $$
begin
  if (select count(*) from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') <> 1 then
    raise exception 'Viewer unexpectedly deleted a dataset';
  end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
update public.nova_bi_branding set brand_name='Acme International'
where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$
begin
  if (select brand_name from public.nova_bi_branding where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 'Acme International' then
    raise exception 'Owner branding update failed';
  end if;
end $$;
delete from public.nova_bi_analyses where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
do $$
begin
  if not exists(select 1 from public.nova_bi_audit_events where event_type='analysis.deleted' and resource_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') then
    raise exception 'Analysis deletion audit record missing';
  end if;
  if not exists(select 1 from public.nova_bi_audit_events where event_type='dataset.deleted' and resource_id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') then
    raise exception 'Dataset deletion audit record missing';
  end if;
end $$;
reset role;

-- Static privilege checks are run as the database owner after all RLS scenarios.
do $workspace_privileges$
begin
  if has_table_privilege('authenticated','public.nova_user_workspaces','TRUNCATE') then
    raise exception 'Authenticated clients must not have TRUNCATE on account workspace backups';
  end if;
  if has_table_privilege('anon','public.nova_user_workspaces','SELECT') then
    raise exception 'Anonymous clients must not read account workspace backups';
  end if;
  if not has_table_privilege('authenticated','public.nova_user_workspaces','SELECT')
     or not has_table_privilege('authenticated','public.nova_user_workspaces','INSERT')
     or not has_table_privilege('authenticated','public.nova_user_workspaces','UPDATE')
     or not has_table_privilege('authenticated','public.nova_user_workspaces','DELETE') then
    raise exception 'Authenticated clients must retain the required account workspace CRUD grants';
  end if;
end $workspace_privileges$;

-- Static privilege checks are run as the database owner after all RLS scenarios.
do $$
begin
  if has_function_privilege('authenticated','public.nova_bi_organization_bootstrap_guard()','execute') then
    raise exception 'Authenticated clients must not execute organization trigger functions directly';
  end if;
  if has_column_privilege('authenticated','public.nova_bi_datasets','deleted_at','update') then
    raise exception 'Authenticated clients must not alter dataset soft-delete metadata';
  end if;
  if not has_column_privilege('authenticated','public.nova_bi_workflow_proposals','status','update') then
    raise exception 'Authenticated role must have the narrow workflow status update grant';
  end if;
  if not has_column_privilege('authenticated','public.nova_bi_memberships','status','update') then
    raise exception 'Authenticated role must have the narrow invitation status update grant';
  end if;
  if has_column_privilege('authenticated','public.nova_bi_memberships','role','update')
     or has_column_privilege('authenticated','public.nova_bi_memberships','organization_id','update')
     or has_column_privilege('authenticated','public.nova_bi_memberships','user_id','update') then
    raise exception 'Authenticated invitees must not change membership role, tenant or user identity';
  end if;
end $$;


do $bi_block$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not coalesce(p.proconfig, array[]::text[]) @> array['search_path=""']
  ) then
    raise exception 'Every public SECURITY DEFINER function must pin an empty search_path';
  end if;
end $bi_block$;

do $bi_block$
begin
  if has_table_privilege('authenticated','public.nova_bi_rate_limits','select') then
    raise exception 'Authenticated clients must not read API rate-limit counters';
  end if;
  if has_function_privilege('authenticated','public.nova_bi_consume_rate_limit(uuid,text,integer,integer)','execute') then
    raise exception 'Authenticated clients must not execute the server rate-limit function';
  end if;
  if not has_function_privilege('service_role','public.nova_bi_consume_rate_limit(uuid,text,integer,integer)','execute') then
    raise exception 'Service role must be able to execute the rate-limit function';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='nova_bi_rate_limits'
      and policyname='nova_bi_rate_limits_deny_client_access'
      and qual='false' and with_check='false'
  ) then
    raise exception 'Rate-limit counters must have an explicit deny-all client policy';
  end if;
end $bi_block$;

begin;
set local role service_role;
do $$
declare
  v_user uuid := 'd1111111-1111-4111-8111-111111111111';
begin
  if public.nova_bi_consume_rate_limit(v_user,'integration-test',2,1) is not true then raise exception 'first rate-limit request should pass'; end if;
  if public.nova_bi_consume_rate_limit(v_user,'integration-test',2,1) is not true then raise exception 'second rate-limit request should pass'; end if;
  if public.nova_bi_consume_rate_limit(v_user,'integration-test',2,1) is not false then raise exception 'third rate-limit request should be denied'; end if;
  perform pg_sleep(1.1);
  if public.nova_bi_consume_rate_limit(v_user,'integration-test',2,1) is not true then raise exception 'rate-limit window did not reset'; end if;
end $$;
reset role;
rollback;

select 'PASS: migrations, tenant RLS, invitation, approval, branding, audited deletion and server-only rate limiting' as result;

-- NOVA Mission Engine persistence: trusted server writes, owner-only reads, immutable browser surface.
set role service_role;
insert into public.nova_missions(
  id, owner_id, title, description, workspace, state, idempotency_key, plan_json
) values (
  '10101010-1010-4010-8010-101010101010',
  '11111111-1111-4111-8111-111111111111',
  'Mission isolation fixture', 'Verify mission storage isolation', 'build', 'planned',
  'mission-isolation-fixture-001', '{"steps":["build","verify"]}'::jsonb
);
do $mission_insert_completion_guard$
begin
  begin
    insert into public.nova_missions(
      id, owner_id, title, description, workspace, state, idempotency_key, plan_json
    ) values (
      '40404040-4040-4040-8040-404040404040',
      '11111111-1111-4111-8111-111111111111',
      'Invalid completed mission insert', '', 'build', 'completed',
      'mission-completed-insert-invalid', '{}'::jsonb
    );
    raise exception 'Completed mission insert bypassed proof guard';
  exception when check_violation then
    null;
  end;
end $mission_insert_completion_guard$;
insert into public.nova_mission_tasks(
  id, mission_id, owner_id, sequence, title, status
) values (
  '20202020-2020-4020-8020-202020202020',
  '10101010-1010-4010-8010-101010101010',
  '11111111-1111-4111-8111-111111111111', 1, 'Build page', 'planned'
);
insert into public.nova_mission_tasks(
  id, mission_id, owner_id, sequence, title, status
) values (
  '30303030-3030-4030-8030-303030303030',
  '10101010-1010-4010-8010-101010101010',
  '11111111-1111-4111-8111-111111111111', 2, 'Verify page', 'planned'
);
do $task_insert_completion_guard$
begin
  begin
    insert into public.nova_mission_tasks(
      id, mission_id, owner_id, sequence, title, status
    ) values (
      '50505050-5050-4050-8050-505050505050',
      '10101010-1010-4010-8010-101010101010',
      '11111111-1111-4111-8111-111111111111', 3, 'Invalid completed task insert', 'completed'
    );
    raise exception 'Completed task insert bypassed task-scoped proof guard';
  exception when check_violation then
    null;
  end;
end $task_insert_completion_guard$;
insert into public.nova_mission_events(
  mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
) values (
  '10101010-1010-4010-8010-101010101010',
  '11111111-1111-4111-8111-111111111111', 1, 'mission.planned', 'draft', 'planned',
  '11111111-1111-4111-8111-111111111111', '{}'::jsonb
);
insert into public.nova_mission_proofs(
  mission_id, task_id, owner_id, proof_type, summary, verification_status, evidence_json
) values (
  '10101010-1010-4010-8010-101010101010',
  '20202020-2020-4020-8020-202020202020',
  '11111111-1111-4111-8111-111111111111',
  'browser-test', 'Homepage loaded in the test browser', 'pending', '{"test":"homepage"}'::jsonb
);
do $mission_completion_guard$
begin
  begin
    update public.nova_mission_tasks set status='completed'
    where id='20202020-2020-4020-8020-202020202020';
    raise exception 'Task unexpectedly completed without task-scoped passing proof';
  exception when check_violation then
    null;
  end;
  begin
    update public.nova_missions set state='completed'
    where id='10101010-1010-4010-8010-101010101010';
    raise exception 'Mission unexpectedly completed without passing proof';
  exception when check_violation then
    null;
  end;
end $mission_completion_guard$;
insert into public.nova_mission_proofs(
  mission_id, task_id, owner_id, proof_type, summary, verification_status, evidence_json, verified_at
) values (
  '10101010-1010-4010-8010-101010101010',
  '20202020-2020-4020-8020-202020202020',
  '11111111-1111-4111-8111-111111111111',
  'browser-test', 'Homepage test passed', 'passed', '{"checks":[{"name":"homepage-load","passed":true}]}'::jsonb, now()
);
update public.nova_mission_tasks set status='completed', updated_at=now()
where id='20202020-2020-4020-8020-202020202020';
do $task_scoped_proof_guard$
begin
  begin
    update public.nova_mission_tasks set status='completed'
    where id='30303030-3030-4030-8030-303030303030';
    raise exception 'Task accepted proof belonging to a different task';
  exception when check_violation then
    null;
  end;
  begin
    update public.nova_missions set state='completed'
    where id='10101010-1010-4010-8010-101010101010';
    raise exception 'Mission completed while one task lacked its own proof';
  exception when check_violation then
    null;
  end;
end $task_scoped_proof_guard$;
insert into public.nova_mission_proofs(
  mission_id, task_id, owner_id, proof_type, summary, verification_status, evidence_json, verified_at
) values (
  '10101010-1010-4010-8010-101010101010',
  '30303030-3030-4030-8030-303030303030',
  '11111111-1111-4111-8111-111111111111',
  'browser-test', 'Second task test passed', 'passed', '{"checks":[{"name":"verification","passed":true}]}'::jsonb, now()
);
update public.nova_mission_tasks set status='completed', updated_at=now()
where id='30303030-3030-4030-8030-303030303030';
update public.nova_missions set state='completed', version=version+1, updated_at=now()
where id='10101010-1010-4010-8010-101010101010';
do $completed_mission_terminal_guard$
begin
  begin
    update public.nova_mission_tasks set status='planned'
    where id='20202020-2020-4020-8020-202020202020';
    raise exception 'Completed task was allowed to leave its terminal state';
  exception when check_violation then
    null;
  end;
  begin
    insert into public.nova_mission_tasks(
      id, mission_id, owner_id, sequence, title, status
    ) values (
      '60606060-6060-4060-8060-606060606060',
      '10101010-1010-4010-8010-101010101010',
      '11111111-1111-4111-8111-111111111111', 3, 'Late task', 'planned'
    );
    raise exception 'Task was added to a completed mission';
  exception when check_violation then
    null;
  end;
  begin
    update public.nova_missions set state='planned'
    where id='10101010-1010-4010-8010-101010101010';
    raise exception 'Completed mission was allowed to leave its terminal state';
  exception when check_violation then
    null;
  end;
end $completed_mission_terminal_guard$;
insert into public.nova_mission_events(
  mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
) values (
  '10101010-1010-4010-8010-101010101010',
  '11111111-1111-4111-8111-111111111111', 2, 'mission.complete', 'verifying', 'completed',
  '11111111-1111-4111-8111-111111111111', '{"proof":"passed"}'::jsonb
);
reset role;

set role service_role;
do $mission_idempotency$
declare
  v_first uuid;
  v_second uuid;
begin
  v_first := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Idempotent mission fixture', '', 'build',
    'mission-idempotency-fixture-001', '{}'::jsonb
  );
  v_second := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Idempotent mission fixture', '', 'build',
    'mission-idempotency-fixture-001', '{}'::jsonb
  );
  if v_first is distinct from v_second then
    raise exception 'Repeated idempotency key created different missions';
  end if;
  begin
    perform public.nova_create_mission(
      '11111111-1111-4111-8111-111111111111',
      'Different payload', '', 'build',
      'mission-idempotency-fixture-001', '{}'::jsonb
    );
    raise exception 'Mission idempotency key was reused with different request content';
  exception when unique_violation then null;
  end;
  if (select count(*) from public.nova_missions
      where owner_id='11111111-1111-4111-8111-111111111111'
        and idempotency_key='mission-idempotency-fixture-001') <> 1 then
    raise exception 'Idempotency key created duplicate mission rows';
  end if;
  if (select count(*) from public.nova_mission_events where mission_id=v_first) <> 1 then
    raise exception 'Idempotent mission creation must create exactly one initial event';
  end if;
end $mission_idempotency$;

do $mission_plan_rpc$
declare
  v_mission_id uuid;
  v_invalid_mission_id uuid;
begin
  v_mission_id := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Starter plan fixture', 'Validate the workspace starter planner', 'build',
    'mission-starter-plan-fixture-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111',
    v_mission_id,
    '{"kind":"starter_template","version":1,"workspace":"build"}'::jsonb,
    '[{"title":"Confirm requirements","description":"Capture acceptance criteria"},{"title":"Run checks","description":"Verify the result"}]'::jsonb
  );
  if (select state from public.nova_missions where id=v_mission_id) <> 'planned' then
    raise exception 'Starter plan did not move mission to planned';
  end if;
  if (select version from public.nova_missions where id=v_mission_id) <> 1 then
    raise exception 'Starter plan did not increment mission version';
  end if;
  if (select count(*) from public.nova_mission_tasks where mission_id=v_mission_id) <> 2 then
    raise exception 'Starter plan did not persist both tasks';
  end if;
  if (select count(*) from public.nova_mission_events where mission_id=v_mission_id) <> 2 then
    raise exception 'Starter plan did not append a planning event';
  end if;

  begin
    perform public.nova_save_mission_plan(
      '11111111-1111-4111-8111-111111111111', v_mission_id,
      '{"kind":"starter_template"}'::jsonb,
      '[{"title":"Duplicate plan"}]'::jsonb
    );
    raise exception 'A second plan was unexpectedly accepted';
  exception when sqlstate '55000' then
    null;
  end;

  v_invalid_mission_id := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Invalid starter plan fixture', '', 'learn',
    'mission-invalid-starter-plan-fixture-001', '{}'::jsonb
  );
  begin
    perform public.nova_save_mission_plan(
      '11111111-1111-4111-8111-111111111111', v_invalid_mission_id,
      '{"kind":"starter_template"}'::jsonb,
      '[{"title":" "}]'::jsonb
    );
    raise exception 'Invalid task title was unexpectedly accepted';
  exception when check_violation then
    null;
  end;
  if (select state from public.nova_missions where id=v_invalid_mission_id) <> 'draft'
     or exists(select 1 from public.nova_mission_tasks where mission_id=v_invalid_mission_id) then
    raise exception 'Rejected starter plan partially changed mission state';
  end if;
end $mission_plan_rpc$;
reset role;

do $mission_rpc_privileges$
begin
  if has_function_privilege('authenticated',
    'public.nova_create_mission(uuid,text,text,text,text,jsonb)','execute') then
    raise exception 'Browser-authenticated users must not execute the trusted mission creation RPC';
  end if;
  if not has_function_privilege('service_role',
    'public.nova_create_mission(uuid,text,text,text,text,jsonb)','execute') then
    raise exception 'Trusted service role must execute the mission creation RPC';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='nova_create_mission' and p.prosecdef
  ) then
    raise exception 'Mission creation RPC must remain SECURITY INVOKER';
  end if;
  if has_function_privilege('authenticated',
    'public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb)','execute')
    or not has_function_privilege('service_role',
    'public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb)','execute') then
    raise exception 'Mission plan RPC permissions are not restricted to service_role';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='nova_save_mission_plan' and p.prosecdef
  ) then
    raise exception 'Mission plan RPC must remain SECURITY INVOKER';
  end if;
end $mission_rpc_privileges$;

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $mission_owner_read$
begin
  if (select count(*) from public.nova_missions where id='10101010-1010-4010-8010-101010101010') <> 1 then
    raise exception 'Mission owner cannot read their own mission';
  end if;
  if (select count(*) from public.nova_mission_tasks where mission_id='10101010-1010-4010-8010-101010101010') <> 2 then
    raise exception 'Mission owner cannot read their own tasks';
  end if;
  if (select count(*) from public.nova_mission_events where mission_id='10101010-1010-4010-8010-101010101010') <> 2 then
    raise exception 'Mission owner cannot read their own event history';
  end if;
  if (select count(*) from public.nova_mission_proofs where mission_id='10101010-1010-4010-8010-101010101010') <> 3 then
    raise exception 'Mission owner cannot read their own proof records';
  end if;
  if has_table_privilege('authenticated','public.nova_missions','insert')
    or has_table_privilege('authenticated','public.nova_missions','update')
    or has_table_privilege('authenticated','public.nova_missions','delete')
    or has_table_privilege('authenticated','public.nova_mission_events','update')
    or has_table_privilege('authenticated','public.nova_mission_events','delete')
    or has_table_privilege('authenticated','public.nova_mission_proofs','update')
    or has_table_privilege('authenticated','public.nova_mission_proofs','delete') then
    raise exception 'Authenticated browser role has unexpected mission/proof write privileges';
  end if;
end $mission_owner_read$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $mission_outsider_read$
begin
  if exists(select 1 from public.nova_missions where id='10101010-1010-4010-8010-101010101010') then
    raise exception 'Cross-account mission leak detected';
  end if;
  if exists(select 1 from public.nova_mission_tasks where mission_id='10101010-1010-4010-8010-101010101010') then
    raise exception 'Cross-account mission task leak detected';
  end if;
  if exists(select 1 from public.nova_mission_events where mission_id='10101010-1010-4010-8010-101010101010') then
    raise exception 'Cross-account mission event leak detected';
  end if;
  if exists(select 1 from public.nova_mission_proofs where mission_id='10101010-1010-4010-8010-101010101010') then
    raise exception 'Cross-account mission proof leak detected';
  end if;
end $mission_outsider_read$;
reset role;


-- NOVA approval queue: idempotent requests, owner-only decisions and no execution before approval.
set role service_role;
do $mission_approval_queue$
declare
  v_mission uuid;
  v_task uuid;
  v_other_task uuid;
  v_approval uuid;
  v_duplicate uuid;
begin
  v_mission := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Approval queue fixture', 'A gated internal task', 'agents',
    'mission-approval-fixture-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111', v_mission,
    '{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Prepare approved action","description":"No external action is executed in this test"},{"title":"Second action","description":"Used to validate idempotency key binding"}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks
   where mission_id=v_mission and owner_id='11111111-1111-4111-8111-111111111111';
  v_approval := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111', v_mission, v_task,
    'approval-request-fixture-001', 'Review a proposed internal action'
  );
  v_duplicate := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111', v_mission, v_task,
    'approval-request-fixture-001', 'Review a proposed internal action'
  );
  if v_approval is distinct from v_duplicate then
    raise exception 'Repeated approval request key created a second approval';
  end if;
  begin
    perform public.nova_request_task_approval(
      '11111111-1111-4111-8111-111111111111', v_mission, v_task,
      'approval-request-fixture-001', 'Changed action summary must not reuse the original key'
    );
    raise exception 'An approval idempotency key was reused for a different action summary';
  exception when unique_violation then null;
  end;
  select id into v_other_task from public.nova_mission_tasks
   where mission_id=v_mission and owner_id='11111111-1111-4111-8111-111111111111'
     and id <> v_task;
  begin
    perform public.nova_request_task_approval(
      '11111111-1111-4111-8111-111111111111', v_mission, v_other_task,
      'approval-request-fixture-001', 'Attempt to reuse key for another task'
    );
    raise exception 'An approval idempotency key was reused for a different task';
  exception when unique_violation then null;
  end;
  if (select status from public.nova_mission_approvals where id=v_approval) <> 'pending'
     or (select status from public.nova_mission_execution_runs where approval_id=v_approval) <> 'awaiting_approval'
     or (select state from public.nova_missions where id=v_mission) <> 'waiting_approval'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'waiting_approval' then
    raise exception 'Approval request did not atomically gate mission, task and execution run';
  end if;
  perform public.nova_decide_task_approval(
    '11111111-1111-4111-8111-111111111111', v_approval, 'approve',
    '11111111-1111-4111-8111-111111111111', 'Reviewed and approved'
  );
  if (select status from public.nova_mission_approvals where id=v_approval) <> 'approved'
     or (select status from public.nova_mission_execution_runs where approval_id=v_approval) <> 'authorized'
     or (select state from public.nova_missions where id=v_mission) <> 'planned'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'planned' then
    raise exception 'Approval decision state mismatch: approval=%, run=%, mission=%, task=%',
      (select status from public.nova_mission_approvals where id=v_approval),
      (select status from public.nova_mission_execution_runs where approval_id=v_approval),
      (select state from public.nova_missions where id=v_mission),
      (select status from public.nova_mission_tasks where id=v_task);
  end if;
  begin
    perform public.nova_decide_task_approval(
      '11111111-1111-4111-8111-111111111111', v_approval, 'approve',
      '11111111-1111-4111-8111-111111111111', ''
    );
    raise exception 'A second decision was unexpectedly accepted';
  exception when sqlstate '55000' then null;
  end;

  v_duplicate := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111', v_mission, v_other_task,
    'approval-request-reject-fixture-001', 'Review a second proposed action'
  );
  perform public.nova_decide_task_approval(
    '11111111-1111-4111-8111-111111111111', v_duplicate, 'reject',
    '11111111-1111-4111-8111-111111111111', 'Rejected in integration test'
  );
  if (select status from public.nova_mission_approvals where id=v_duplicate) <> 'rejected'
     or (select status from public.nova_mission_execution_runs where approval_id=v_duplicate) <> 'blocked'
     or (select status from public.nova_mission_tasks where id=v_other_task) <> 'failed'
     or (select state from public.nova_missions where id=v_mission) <> 'failed' then
    raise exception 'Approval rejection did not atomically block the run and fail its task';
  end if;
end $mission_approval_queue$;
reset role;

do $mission_approval_privileges$
begin
  if has_table_privilege('authenticated','public.nova_mission_approvals','insert')
     or has_table_privilege('authenticated','public.nova_mission_approvals','update')
     or has_table_privilege('authenticated','public.nova_mission_execution_runs','insert')
     or has_table_privilege('authenticated','public.nova_mission_execution_runs','update') then
    raise exception 'Browser clients must not mutate approvals or execution runs';
  end if;
  if has_function_privilege('authenticated',
    'public.nova_request_task_approval(uuid,uuid,uuid,text,text)','execute')
     or has_function_privilege('authenticated',
    'public.nova_decide_task_approval(uuid,uuid,text,uuid,text)','execute') then
    raise exception 'Browser clients must not invoke trusted approval RPCs';
  end if;
  if not has_function_privilege('service_role',
    'public.nova_request_task_approval(uuid,uuid,uuid,text,text)','execute')
     or not has_function_privilege('service_role',
    'public.nova_decide_task_approval(uuid,uuid,text,uuid,text)','execute') then
    raise exception 'Trusted server role must execute approval RPCs';
  end if;
end $mission_approval_privileges$;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $mission_approval_isolation$
begin
  if exists(select 1 from public.nova_mission_approvals
    where request_key='approval-request-fixture-001') then
    raise exception 'Cross-account approval leak detected';
  end if;
  if exists(select 1 from public.nova_mission_execution_runs
    where idempotency_key='approval-request-fixture-001') then
    raise exception 'Cross-account execution-run leak detected';
  end if;
end $mission_approval_isolation$;
reset role;


-- NOVA owner cancellation atomically expires pending approvals and blocks authorized runs.
set role service_role;
do $mission_cancellation$
declare
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_cancelled uuid;
begin
  v_mission := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Cancellation fixture', 'Cancel a mission with a pending approval', 'agents',
    'mission-cancel-fixture-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111', v_mission,
    '{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Action awaiting approval","description":"Must not execute after cancellation"}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks
   where mission_id=v_mission and owner_id='11111111-1111-4111-8111-111111111111';
  v_approval := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111', v_mission, v_task,
    'approval-cancel-fixture-001', 'A pending action that must be cancelled'
  );
  v_cancelled := public.nova_cancel_mission(
    '11111111-1111-4111-8111-111111111111', v_mission, 'Owner requested cancellation'
  );
  if v_cancelled is distinct from v_mission
     or (select state from public.nova_missions where id=v_mission) <> 'cancelled'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'cancelled'
     or (select status from public.nova_mission_approvals where id=v_approval) <> 'expired'
     or (select status from public.nova_mission_execution_runs where approval_id=v_approval) <> 'cancelled'
     or (select count(*) from public.nova_mission_events where mission_id=v_mission and event_type='mission.cancelled') <> 1 then
    raise exception 'Mission cancellation did not atomically cancel task and authorization state';
  end if;
  begin
    perform public.nova_cancel_mission(
      '11111111-1111-4111-8111-111111111111', v_mission, ''
    );
    raise exception 'A second cancellation was unexpectedly accepted';
  exception when sqlstate '55000' then null;
  end;
  begin
    perform public.nova_decide_task_approval(
      '11111111-1111-4111-8111-111111111111', v_approval, 'approve',
      '11111111-1111-4111-8111-111111111111', 'Late decision after cancellation'
    );
    raise exception 'An expired approval was unexpectedly accepted after cancellation';
  exception when sqlstate '55000' then null;
  end;
end $mission_cancellation$;
reset role;

do $mission_cancel_privileges$
begin
  if has_function_privilege('authenticated',
    'public.nova_cancel_mission(uuid,uuid,text)','execute')
     or not has_function_privilege('service_role',
    'public.nova_cancel_mission(uuid,uuid,text)','execute') then
    raise exception 'Mission cancellation RPC permissions are not restricted to service_role';
  end if;
end $mission_cancel_privileges$;


-- NOVA execution lease primitives: explicit approval, bounded attempts, stale-token rejection.
set role service_role;
do $mission_worker_leases$
declare
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_new_token uuid;
  v_attempt integer;
  v_status text;
  v_expiry timestamptz;
  v_i integer;
begin
  v_mission := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Worker lease fixture', 'Exercise safe server-side worker leases', 'agents',
    'mission-worker-lease-fixture-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111', v_mission,
    '{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Approved worker task","description":"No external side effect is performed"}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111',v_mission,v_task,
    'approval-worker-lease-fixture-001','Run a bounded internal verification task'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;

  begin
    perform * from public.nova_claim_mission_task(v_run,'worker-test',120);
    raise exception 'Unapproved task was unexpectedly claimable';
  exception when insufficient_privilege then null;
  end;

  perform public.nova_decide_task_approval(
    '11111111-1111-4111-8111-111111111111',v_approval,'approve',
    '11111111-1111-4111-8111-111111111111','Approved for controlled test'
  );
  select c.lease_token,c.attempt,c.lease_expires_at
    into v_token,v_attempt,v_expiry
    from public.nova_claim_mission_task(v_run,'worker-test',120) c;
  if v_attempt <> 1 or v_token is null or v_expiry <= now()
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'running'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'running'
     or (select state from public.nova_missions where id=v_mission) <> 'running' then
    raise exception 'Approved worker claim did not atomically establish running state and lease';
  end if;

  begin
    perform * from public.nova_claim_mission_task(v_run,'duplicate-worker',120);
    raise exception 'An active worker lease was unexpectedly double-claimed';
  exception when sqlstate '55P03' then null;
  end;

  v_expiry := public.nova_heartbeat_mission_task(v_run,v_token,90);
  if v_expiry <= now() then raise exception 'Heartbeat did not extend the lease'; end if;

  update public.nova_mission_execution_runs
     set lease_expires_at=now()-interval '1 second'
   where id=v_run;
  begin
    perform public.nova_heartbeat_mission_task(v_run,v_token,90);
    raise exception 'Expired lease token unexpectedly renewed';
  exception when sqlstate '55000' then null;
  end;

  select c.lease_token,c.attempt into v_new_token,v_attempt
    from public.nova_claim_mission_task(v_run,'worker-recovery',120) c;
  if v_attempt <> 2 or v_new_token is null or v_new_token = v_token then
    raise exception 'Stale lease was not safely reclaimed with a new token';
  end if;
  begin
    perform public.nova_fail_mission_task(v_run,v_token,'stale','Old worker must not fail reclaimed run',0);
    raise exception 'Stale worker token unexpectedly changed a reclaimed run';
  exception when sqlstate '55000' then null;
  end;

  v_status := public.nova_fail_mission_task(v_run,v_new_token,'temporary','Retryable controlled failure',0);
  if v_status <> 'authorized'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'planned'
     or (select state from public.nova_missions where id=v_mission) <> 'planned'
     or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null then
    raise exception 'Retryable failure did not safely release lease and return work to planned';
  end if;

  -- Consume the remaining bounded attempts; attempt five must become terminal.
  for v_i in 3..5 loop
    select c.lease_token,c.attempt into v_token,v_attempt
      from public.nova_claim_mission_task(v_run,'worker-retry-'||v_i,120) c;
    if v_attempt <> v_i then raise exception 'Unexpected attempt number: expected %, got %',v_i,v_attempt; end if;
    v_status := public.nova_fail_mission_task(v_run,v_token,'repeat','Bounded retry exhaustion',0);
  end loop;
  if v_status <> 'failed'
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'failed'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'failed'
     or (select state from public.nova_missions where id=v_mission) <> 'failed'
     or (select attempt from public.nova_mission_execution_runs where id=v_run) <> 5 then
    raise exception 'Worker retry budget did not stop at five attempts';
  end if;
end $mission_worker_leases$;
reset role;

do $mission_worker_privileges$
begin
  if has_function_privilege('authenticated','public.nova_claim_mission_task(uuid,text,integer)','execute')
     or has_function_privilege('authenticated','public.nova_heartbeat_mission_task(uuid,uuid,integer)','execute')
     or has_function_privilege('authenticated','public.nova_fail_mission_task(uuid,uuid,text,text,integer)','execute') then
    raise exception 'Browser clients must not invoke worker lease RPCs';
  end if;
  if not has_function_privilege('service_role','public.nova_claim_mission_task(uuid,text,integer)','execute')
     or not has_function_privilege('service_role','public.nova_heartbeat_mission_task(uuid,uuid,integer)','execute')
     or not has_function_privilege('service_role','public.nova_fail_mission_task(uuid,uuid,text,text,integer)','execute') then
    raise exception 'Trusted server role must execute worker lease RPCs';
  end if;
end $mission_worker_privileges$;


-- Cancelling an actively leased task invalidates its worker token and clears lease metadata.
set role service_role;
do $mission_cancel_active_worker$
declare
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
begin
  v_mission := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Active worker cancellation fixture', 'Cancel a claimed worker safely', 'agents',
    'mission-active-worker-cancel-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111',v_mission,
    '{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Cancelable worker task","description":"Cancellation revokes its lease"}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    '11111111-1111-4111-8111-111111111111',v_mission,v_task,
    'approval-active-worker-cancel-001','Run a cancellable internal task'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(
    '11111111-1111-4111-8111-111111111111',v_approval,'approve',
    '11111111-1111-4111-8111-111111111111','Approved for controlled test'
  );
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'cancel-test-worker',120);

  perform public.nova_cancel_mission(
    '11111111-1111-4111-8111-111111111111',v_mission,'Stop active worker fixture'
  );
  if (select state from public.nova_missions where id=v_mission) <> 'cancelled'
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'cancelled'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'cancelled'
     or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null
     or (select lease_expires_at from public.nova_mission_execution_runs where id=v_run) is not null then
    raise exception 'Cancellation did not revoke active worker lease and task';
  end if;
  begin
    perform public.nova_heartbeat_mission_task(v_run,v_token,90);
    raise exception 'Cancelled worker token unexpectedly remained valid';
  exception when sqlstate '55000' then null;
  end;
end $mission_cancel_active_worker$;
reset role;
