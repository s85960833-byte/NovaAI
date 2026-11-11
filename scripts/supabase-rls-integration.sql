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
    '[{"title":"Confirm requirements","description":"Capture acceptance criteria","task_type":"build.requirements","input_schema_version":1,"input":{"description":"Capture acceptance criteria"}},{"title":"Run checks","description":"Verify the result","task_type":"build.quality_checks","input_schema_version":1,"input":{"description":"Verify the result"}}]'::jsonb
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
      '[{"title":"Duplicate plan","description":"Valid typed task fixture","task_type":"build.requirements","input_schema_version":1,"input":{"description":"Valid typed task fixture"}}]'::jsonb
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
    '[{"title":"Prepare approved action","description":"No external action is executed in this test","task_type":"agents.permissions","input_schema_version":1,"input":{"description":"No external action is executed in this test"}},{"title":"Second action","description":"Used to validate idempotency key binding","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Used to validate idempotency key binding"}}]'::jsonb
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
    '[{"title":"Action awaiting approval","description":"Must not execute after cancellation","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Must not execute after cancellation"}}]'::jsonb
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
select set_config('request.jwt.claim.role','service_role',false);
do $mission_worker_leases$
declare
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_new_token uuid;
  v_reconcile_token uuid;
  v_attempt integer;
  v_status text;
  v_expiry timestamptz;
  v_i integer;
  v_proof uuid;
  v_attestation uuid;
  v_envelope jsonb;
  v_action uuid;
  v_action_again uuid;
  v_uncertain_action uuid;
  v_reserved_action uuid;
  v_fail_action uuid;
  v_action_status text;
  v_replayed boolean;
begin
  v_mission := public.nova_create_mission(
    '11111111-1111-4111-8111-111111111111',
    'Worker lease fixture', 'Exercise safe server-side worker leases', 'agents',
    'mission-worker-lease-fixture-001', '{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    '11111111-1111-4111-8111-111111111111', v_mission,
    '{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Approved worker task","description":"No external side effect is performed","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"No external side effect is performed"}}]'::jsonb
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

  insert into public.nova_mission_proofs(
    mission_id, task_id, owner_id, proof_type, summary, verification_status,
    evidence_json, verified_at
  ) values (
    v_mission, v_task, '11111111-1111-4111-8111-111111111111',
    'browser-check', 'Verifier attestation integration fixture', 'passed',
    '{"checks":[{"id":"task-claimed","passed":true}]}'::jsonb, now()
  ) returning id into v_proof;
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1',
    'mission_id',v_mission,
    'task_id',v_task,
    'run_id',v_run,
    'verifier_id','nova.integration-verifier',
    'verifier_version','1.0.0',
    'observed_at',now(),
    'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','task-claimed','passed',true))
  );
  insert into public.nova_mission_proof_attestations(
    proof_id, mission_id, task_id, run_id, owner_id, verifier_id,
    verifier_version, evidence_digest, envelope_json, outcome, check_count, observed_at
  ) values (
    v_proof, v_mission, v_task, v_run, '11111111-1111-4111-8111-111111111111',
    'nova.integration-verifier', '1.0.0', repeat('a',64), v_envelope, 'passed', 1, now()
  ) returning id into v_attestation;
  if v_attestation is null or not exists (
    select 1 from public.nova_mission_proof_attestations
    where id=v_attestation and proof_id=v_proof and run_id=v_run
      and evidence_digest=repeat('a',64)
  ) then
    raise exception 'Task/run-bound proof attestation was not persisted';
  end if;

  begin
    insert into public.nova_mission_proof_attestations(
      proof_id, mission_id, task_id, run_id, owner_id, verifier_id,
      verifier_version, evidence_digest, envelope_json, outcome, check_count, observed_at
    ) values (
      v_proof, v_mission, v_task, v_run, '11111111-1111-4111-8111-111111111111',
      'nova.integration-verifier', '1.0.0', repeat('a',64), v_envelope, 'passed', 1, now()
    );
    raise exception 'Duplicate proof attestation was unexpectedly accepted';
  exception when unique_violation then null;
  end;

  begin
    insert into public.nova_mission_proof_attestations(
      proof_id, mission_id, task_id, run_id, owner_id, verifier_id,
      verifier_version, evidence_digest, envelope_json, outcome, check_count, observed_at
    ) values (
      v_proof, v_mission, v_task, '99999999-9999-4999-8999-999999999999',
      '11111111-1111-4111-8111-111111111111', 'nova.integration-verifier',
      '1.0.0', repeat('b',64),
      jsonb_set(v_envelope, '{run_id}', to_jsonb('99999999-9999-4999-8999-999999999999'::text)),
      'passed', 1, now()
    );
    raise exception 'Mismatched run binding was unexpectedly accepted';
  exception when check_violation then null;
  end;

  begin
    insert into public.nova_mission_proof_attestations(
      proof_id, mission_id, task_id, run_id, owner_id, verifier_id,
      verifier_version, evidence_digest, envelope_json, outcome, check_count, observed_at
    ) values (
      v_proof, v_mission, v_task, v_run, '11111111-1111-4111-8111-111111111111',
      'nova.integration-verifier', '1.0.0', repeat('c',64),
      jsonb_set(v_envelope, '{verifier_version}', to_jsonb('9.9.9'::text)),
      'passed', 1, now()
    );
    raise exception 'Mismatched verifier metadata was unexpectedly accepted';
  exception when check_violation then null;
  end;

  begin
    update public.nova_mission_proof_attestations set outcome='failed' where id=v_attestation;
    raise exception 'Proof attestation update was unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.nova_mission_proof_attestations where id=v_attestation;
    raise exception 'Proof attestation deletion was unexpectedly permitted';
  exception when insufficient_privilege then null;
  end;

  perform pg_catalog.set_config('request.jwt.claim.role','anon',false);
  begin
    perform * from public.nova_reserve_mission_action(v_run,v_token,'role-claim-denial-fixture',repeat('9',64));
    raise exception 'Action RPC accepted a non-service JWT role claim';
  exception when insufficient_privilege then null;
  end;
  perform pg_catalog.set_config('request.jwt.claim.role','service_role',false);

  select action_id,action_status,replayed
    into v_action,v_action_status,v_replayed
    from public.nova_reserve_mission_action(v_run,v_token,'action-complete-fixture-001',repeat('d',64));
  if v_action is null or v_action_status <> 'reserved' or v_replayed then
    raise exception 'First action reservation did not create a fresh reserved receipt';
  end if;
  select action_id,action_status,replayed
    into v_action_again,v_action_status,v_replayed
    from public.nova_reserve_mission_action(v_run,v_token,'action-complete-fixture-001',repeat('d',64));
  if v_action_again is distinct from v_action or v_action_status <> 'reserved' or not v_replayed then
    raise exception 'Same-key action reservation was not idempotent';
  end if;
  begin
    perform * from public.nova_reserve_mission_action(v_run,v_token,'action-complete-fixture-001',repeat('b',64));
    raise exception 'Action idempotency key accepted a different request digest';
  exception when unique_violation then null;
  end;
  v_action_status := public.nova_complete_mission_action(v_action,v_token,repeat('e',64),'internal-test-receipt-001');
  if v_action_status <> 'completed' then raise exception 'Reserved action did not complete'; end if;
  v_action_status := public.nova_complete_mission_action(v_action,v_token,repeat('e',64),'internal-test-receipt-001');
  if v_action_status <> 'completed' then raise exception 'Same-result action completion replay was not idempotent'; end if;
  begin
    perform public.nova_complete_mission_action(v_action,v_token,repeat('f',64),'different-result');
    raise exception 'Completed action accepted a conflicting result replay';
  exception when unique_violation then null;
  end;
  select action_id into v_uncertain_action
    from public.nova_reserve_mission_action(v_run,v_token,'action-uncertain-fixture-001',repeat('a',64));
  v_action_status := public.nova_mark_mission_action_uncertain(
    v_uncertain_action,v_token,'External operation timed out; outcome unknown'
  );
  if v_action_status <> 'uncertain' then raise exception 'Uncertain action marker was not stored'; end if;
  select action_id,action_status,replayed
    into v_action_again,v_action_status,v_replayed
    from public.nova_reserve_mission_action(v_run,v_token,'action-uncertain-fixture-001',repeat('a',64));
  if v_action_again is distinct from v_uncertain_action or v_action_status <> 'uncertain' or not v_replayed then
    raise exception 'Uncertain action was not safely returned without re-reserving';
  end if;
  begin
    perform public.nova_complete_mission_action(v_uncertain_action,v_token,repeat('b',64),'must-not-complete');
    raise exception 'Uncertain action was unexpectedly completed';
  exception when sqlstate '55000' then null;
  end;
  select action_id into v_reserved_action
    from public.nova_reserve_mission_action(v_run,v_token,'action-reserved-fixture-001',repeat('c',64));

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
  begin
    perform public.nova_complete_mission_action(v_action,v_token,repeat('e',64),'internal-test-receipt-001');
    raise exception 'Stale lease unexpectedly replayed action completion';
  exception when sqlstate '55000' then null;
  end;
  begin
    perform * from public.nova_reserve_mission_action(v_run,v_new_token,'action-reserved-fixture-001',repeat('c',64));
    raise exception 'New lease unexpectedly reused a reserved action from an expired lease';
  exception when sqlstate '55P03' then null;
  end;
  begin
    perform public.nova_reconcile_mission_action(
      v_reserved_action,v_token,'Stale lease cannot reconcile this action'
    );
    raise exception 'Expired worker token unexpectedly reconciled an abandoned action';
  exception when sqlstate '55000' then null;
  end;
  v_action_status := public.nova_reconcile_mission_action(
    v_reserved_action,v_new_token,'Previous lease expired; external outcome requires manual verification'
  );
  if v_action_status <> 'uncertain'
     or (select status from public.nova_mission_action_receipts where id=v_reserved_action) <> 'uncertain'
     or (select reconciled_by_lease_token from public.nova_mission_action_receipts where id=v_reserved_action) <> v_new_token then
    raise exception 'Abandoned reservation was not safely moved to uncertain reconciliation state';
  end if;
  v_action_status := public.nova_reconcile_mission_action(
    v_reserved_action,v_new_token,'Previous lease expired; external outcome requires manual verification'
  );
  if v_action_status <> 'uncertain' then
    raise exception 'Same-reason action reconciliation replay was not idempotent';
  end if;
  select action_id,action_status,replayed
    into v_action_again,v_action_status,v_replayed
    from public.nova_reserve_mission_action(v_run,v_new_token,'action-uncertain-fixture-001',repeat('a',64));
  if v_action_again is distinct from v_uncertain_action or v_action_status <> 'uncertain' or not v_replayed then
    raise exception 'Reclaimed worker did not receive the uncertain action reconciliation state';
  end if;

  select action_id into v_fail_action
    from public.nova_reserve_mission_action(v_run,v_new_token,'action-fail-transition-fixture-001',repeat('7',64));
  v_status := public.nova_fail_mission_task(v_run,v_new_token,'temporary','Retryable controlled failure',0);
  if (select status from public.nova_mission_action_receipts where id=v_fail_action) <> 'uncertain' then
    raise exception 'Ending a worker lease did not mark its unfinished action uncertain';
  end if;
  if v_status <> 'authorized'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'planned'
     or (select state from public.nova_missions where id=v_mission) <> 'planned'
     or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null then
    raise exception 'Retryable failure did not safely release lease and return work to planned';
  end if;

  -- A later lease may reconcile the action that the previous lease left uncertain.
  select c.lease_token,c.attempt into v_reconcile_token,v_attempt
    from public.nova_claim_mission_task(v_run,'worker-action-reconciler',120) c;
  if v_attempt <> 3 or v_reconcile_token is null then
    raise exception 'Expected attempt three for action reconciliation';
  end if;
  v_action_status := public.nova_reconcile_mission_action(
    v_fail_action,v_reconcile_token,'Independent review required after previous lease ended'
  );
  if v_action_status <> 'uncertain'
     or (select reconciled_by_lease_token from public.nova_mission_action_receipts where id=v_fail_action)
       <> v_reconcile_token
     or (select reconciliation_note from public.nova_mission_action_receipts where id=v_fail_action)
       <> 'Independent review required after previous lease ended' then
    raise exception 'Automatically uncertain action could not be safely reconciled by the next lease';
  end if;
  v_action_status := public.nova_reconcile_mission_action(
    v_fail_action,v_reconcile_token,'Independent review required after previous lease ended'
  );
  if v_action_status <> 'uncertain' then
    raise exception 'Automatic uncertainty reconciliation replay was not idempotent';
  end if;
  v_status := public.nova_fail_mission_task(
    v_run,v_reconcile_token,'manual-review','Reconciliation fixture safely releases attempt three',0
  );
  if v_status <> 'authorized'
     or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null then
    raise exception 'Reconciliation fixture did not safely release its active lease';
  end if;

  -- Consume the remaining bounded attempts; attempt five must become terminal.
  for v_i in 4..5 loop
    select c.lease_token,c.attempt into v_token,v_attempt
      from public.nova_claim_mission_task(v_run,'worker-retry-'||v_i,120) c;
    if v_attempt <> v_i then raise exception 'Unexpected attempt number: expected %, got %',v_i,v_attempt; end if;
    v_status := public.nova_fail_mission_task(v_run,v_token,'repeat','Bounded retry exhaustion',0);
    if v_i < 5 and (
      v_status <> 'authorized'
      or (select status from public.nova_mission_execution_runs where id=v_run) <> 'authorized'
      or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null
      or (select lease_expires_at from public.nova_mission_execution_runs where id=v_run) is not null
    ) then
      raise exception 'Retry attempt % did not release its lease before the next claim',v_i;
    end if;
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

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $mission_attestation_owner_read$
begin
  if (select count(*) from public.nova_mission_proof_attestations
      where verifier_id='nova.integration-verifier') <> 1 then
    raise exception 'Mission owner cannot read their proof attestation';
  end if;
  if has_table_privilege('authenticated','public.nova_mission_proof_attestations','insert') then
    raise exception 'Authenticated users must not insert proof attestations';
  end if;
  if (select count(*) from public.nova_mission_action_receipts
      where action_key like 'action-%-fixture-001') <> 4 then
    raise exception 'Mission owner cannot read their own action receipts';
  end if;
  if has_table_privilege('authenticated','public.nova_mission_action_receipts','insert')
     or has_table_privilege('authenticated','public.nova_mission_action_receipts','update')
     or has_table_privilege('authenticated','public.nova_mission_action_receipts','delete') then
    raise exception 'Authenticated users must have read-only action receipt access';
  end if;
end $mission_attestation_owner_read$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $mission_attestation_outsider_read$
begin
  if exists(select 1 from public.nova_mission_proof_attestations
      where verifier_id='nova.integration-verifier') then
    raise exception 'Cross-account proof attestation leak detected';
  end if;
  if exists(select 1 from public.nova_mission_action_receipts
      where action_key like 'action-%-fixture-001') then
    raise exception 'Cross-account action receipt leak detected';
  end if;
end $mission_attestation_outsider_read$;
reset role;

do $mission_worker_privileges$
begin
  if has_function_privilege('authenticated','public.nova_claim_mission_task(uuid,text,integer)','execute')
     or has_function_privilege('authenticated','public.nova_heartbeat_mission_task(uuid,uuid,integer)','execute')
     or has_function_privilege('authenticated','public.nova_fail_mission_task(uuid,uuid,text,text,integer)','execute') then
    raise exception 'Browser clients must not invoke worker lease RPCs';
  end if;
  if has_function_privilege('authenticated','public.nova_reserve_mission_action(uuid,uuid,text,text)','execute')
     or has_function_privilege('authenticated','public.nova_complete_mission_action(uuid,uuid,text,text)','execute')
     or has_function_privilege('authenticated','public.nova_mark_mission_action_uncertain(uuid,uuid,text)','execute')
     or has_function_privilege('authenticated','public.nova_reconcile_mission_action(uuid,uuid,text)','execute')
     or not has_function_privilege('service_role','public.nova_reserve_mission_action(uuid,uuid,text,text)','execute')
     or not has_function_privilege('service_role','public.nova_complete_mission_action(uuid,uuid,text,text)','execute')
     or not has_function_privilege('service_role','public.nova_mark_mission_action_uncertain(uuid,uuid,text)','execute')
     or not has_function_privilege('service_role','public.nova_reconcile_mission_action(uuid,uuid,text)','execute') then
    raise exception 'Action idempotency RPC permissions are not service-role-only';
  end if;
  if has_table_privilege('authenticated','public.nova_mission_proof_attestations','insert')
     or has_table_privilege('authenticated','public.nova_mission_proof_attestations','update')
     or has_table_privilege('authenticated','public.nova_mission_proof_attestations','delete')
     or has_table_privilege('service_role','public.nova_mission_proof_attestations','update')
     or has_table_privilege('service_role','public.nova_mission_proof_attestations','delete')
     or has_table_privilege('service_role','public.nova_mission_proof_attestations','truncate') then
    raise exception 'Proof attestations must remain insert-only for the trusted server and read-only for clients';
  end if;
  if has_table_privilege('authenticated','public.nova_mission_action_receipts','insert')
     or has_table_privilege('authenticated','public.nova_mission_action_receipts','update')
     or has_table_privilege('authenticated','public.nova_mission_action_receipts','delete')
     or has_table_privilege('service_role','public.nova_mission_action_receipts','insert')
     or has_table_privilege('service_role','public.nova_mission_action_receipts','update')
     or has_table_privilege('service_role','public.nova_mission_action_receipts','delete')
     or has_table_privilege('service_role','public.nova_mission_action_receipts','truncate')
     or has_column_privilege('authenticated','public.nova_mission_action_receipts','lease_token','select')
     or has_column_privilege('authenticated','public.nova_mission_action_receipts','reconciled_by_lease_token','select')
     or not has_column_privilege('authenticated','public.nova_mission_action_receipts','reconciliation_note','select')
     or not has_column_privilege('authenticated','public.nova_mission_action_receipts','owner_id','select') then
    raise exception 'Action receipts must be browser-read-only, hide lease tokens and remain non-deletable';
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
    '[{"title":"Cancelable worker task","description":"Cancellation revokes its lease","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Cancellation revokes its lease"}}]'::jsonb
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


-- Lease-fenced completion requires a matching passing proof attestation and resolved actions.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $mission_lease_fenced_completion$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_old_token uuid;
  v_proof uuid;
  v_attestation uuid;
  v_envelope jsonb;
  v_action uuid;
  v_status text;
begin
  v_mission := public.nova_create_mission(
    v_owner,'Lease-fenced completion fixture',
    'Verify proof-bound completion and action reconciliation','agents',
    'mission-lease-fenced-completion-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Proof-attested task","description":"Controlled database-only fixture","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Controlled database-only fixture"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-lease-fenced-completion-001',
    'Run a controlled proof-attested completion fixture'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved fixture');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'completion-test-worker',120);

  insert into public.nova_mission_proofs(
    mission_id,task_id,owner_id,proof_type,summary,verification_status,evidence_json,verified_at
  ) values (
    v_mission,v_task,v_owner,'browser-check','Completion proof fixture','passed',
    '{"checks":[{"id":"task-verified","passed":true}]}'::jsonb,now()
  ) returning id into v_proof;
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','nova.completion-integration-verifier','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','task-verified','passed',true))
  );
  insert into public.nova_mission_proof_attestations(
    proof_id,mission_id,task_id,run_id,owner_id,verifier_id,verifier_version,
    evidence_digest,envelope_json,outcome,check_count,observed_at
  ) values (
    v_proof,v_mission,v_task,v_run,v_owner,'nova.completion-integration-verifier',
    '1.0.0',repeat('c',64),v_envelope,'passed',1,now()
  ) returning id into v_attestation;

  -- An expired lease cannot complete; reclaiming issues a fresh fencing token.
  v_old_token := v_token;
  update public.nova_mission_execution_runs
     set lease_expires_at=now()-interval '1 second' where id=v_run;
  begin
    perform public.nova_complete_mission_task(v_run,v_token,v_proof,v_attestation);
    raise exception 'Expired worker lease unexpectedly completed a task';
  exception when sqlstate '55000' then null;
  end;
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'completion-recovery-worker',120);
  if v_token is null or v_token=v_old_token then
    raise exception 'Expired completion lease was not replaced by a fresh fencing token';
  end if;

  begin
    perform public.nova_complete_mission_task(v_run,v_old_token,v_proof,v_attestation);
    raise exception 'Reclaimed worker accepted the stale fencing token';
  exception when sqlstate '55000' then null;
  end;

  select action_id into v_action
    from public.nova_reserve_mission_action(v_run,v_token,'completion-pending-action-001',repeat('d',64));
  begin
    perform public.nova_complete_mission_task(v_run,v_token,v_proof,v_attestation);
    raise exception 'Task completion bypassed an unresolved external action';
  exception when sqlstate '55000' then null;
  end;
  v_status := public.nova_complete_mission_action(v_action,v_token,repeat('e',64),'completion-fixture-receipt');
  if v_status <> 'completed' then
    raise exception 'Fixture external action did not reach completed receipt state';
  end if;

  begin
    perform public.nova_complete_mission_task(
      v_run,v_token,'99999999-9999-4999-8999-999999999999',v_attestation
    );
    raise exception 'Task completion accepted a proof belonging to another task';
  exception when check_violation then null;
  end;

  begin
    perform public.nova_complete_mission_task(
      v_run,v_token,v_proof,'99999999-9999-4999-8999-999999999998'
    );
    raise exception 'Task completion accepted a missing or mismatched attestation';
  exception when check_violation then null;
  end;

  v_status := public.nova_complete_mission_task(v_run,v_token,v_proof,v_attestation);
  if v_status <> 'succeeded'
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'succeeded'
     or (select lease_token from public.nova_mission_execution_runs where id=v_run) is not null
     or (select status from public.nova_mission_tasks where id=v_task) <> 'completed'
     or (select state from public.nova_missions where id=v_mission) <> 'completed' then
    raise exception 'Lease-fenced completion did not atomically finish task, run and mission';
  end if;

  begin
    perform public.nova_complete_mission_task(v_run,v_token,v_proof,v_attestation);
    raise exception 'Duplicate task completion unexpectedly succeeded';
  exception when sqlstate '55000' then null;
  end;
end $mission_lease_fenced_completion$;
reset role;

do $mission_completion_privileges$
begin
  if has_function_privilege('authenticated',
       'public.nova_complete_mission_task(uuid,uuid,uuid,uuid)','execute')
     or has_function_privilege('anon',
       'public.nova_complete_mission_task(uuid,uuid,uuid,uuid)','execute')
     or not has_function_privilege('service_role',
       'public.nova_complete_mission_task(uuid,uuid,uuid,uuid)','execute') then
    raise exception 'Lease-fenced completion RPC must be restricted to service_role';
  end if;
end $mission_completion_privileges$;

-- Typed task persistence: only allowlisted task types with schema v1 and strict input persist.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $mission_typed_task_persistence$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
begin
  v_mission := public.nova_create_mission(
    v_owner,'Typed task persistence fixture','Validate allowlisted task routing','build',
    'mission-typed-task-persistence-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"build"}'::jsonb,
    '[{"title":"Typed requirements task","description":"Persist strict input","task_type":"build.requirements","input_schema_version":1,"input":{"description":"Persist strict input"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks
   where mission_id=v_mission and owner_id=v_owner;
  if not exists (
    select 1 from public.nova_mission_tasks
     where id=v_task and task_type='build.requirements'
       and input_schema_version=1
       and input_json->'input'='{"description":"Persist strict input"}'::jsonb
  ) then
    raise exception 'Typed task route, schema version or structured input was not persisted';
  end if;

  v_mission := public.nova_create_mission(
    v_owner,'Unknown typed task fixture','Reject free-form task routes','build',
    'mission-typed-task-unknown-001','{}'::jsonb
  );
  begin
    perform public.nova_save_mission_plan(
      v_owner,v_mission,'{"kind":"starter_template","workspace":"build"}'::jsonb,
      '[{"title":"Unknown route","description":"Must reject","task_type":"build.execute_arbitrary","input_schema_version":1,"input":{"description":"Must reject"}}]'::jsonb
    );
    raise exception 'Unknown task type was unexpectedly accepted';
  exception when check_violation then null;
  end;

  v_mission := public.nova_create_mission(
    v_owner,'Workspace mismatch fixture','Reject cross-workspace task types','build',
    'mission-typed-task-workspace-001','{}'::jsonb
  );
  begin
    perform public.nova_save_mission_plan(
      v_owner,v_mission,'{"kind":"starter_template","workspace":"build"}'::jsonb,
      '[{"title":"Wrong workspace route","description":"Must reject","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Must reject"}}]'::jsonb
    );
    raise exception 'Task type from another workspace was unexpectedly accepted';
  exception when check_violation then null;
  end;

  v_mission := public.nova_create_mission(
    v_owner,'Invalid schema version fixture','Reject malformed schema versions','build',
    'mission-typed-task-version-001','{}'::jsonb
  );
  begin
    perform public.nova_save_mission_plan(
      v_owner,v_mission,'{"kind":"starter_template","workspace":"build"}'::jsonb,
      '[{"title":"Invalid schema","description":"Must reject","task_type":"build.requirements","input_schema_version":"not-a-number","input":{"description":"Must reject"}}]'::jsonb
    );
    raise exception 'Malformed task schema version was unexpectedly accepted';
  exception when check_violation then null;
  end;

  v_mission := public.nova_create_mission(
    v_owner,'Invalid task input fixture','Reject unknown input fields','build',
    'mission-typed-task-input-001','{}'::jsonb
  );
  begin
    perform public.nova_save_mission_plan(
      v_owner,v_mission,'{"kind":"starter_template","workspace":"build"}'::jsonb,
      '[{"title":"Invalid input","description":"Must reject","task_type":"build.requirements","input_schema_version":1,"input":{"description":"Must reject","extra":true}}]'::jsonb
    );
    raise exception 'Task input with unknown fields was unexpectedly accepted';
  exception when check_violation then null;
  end;
end $mission_typed_task_persistence$;
reset role;



-- Trusted proof persistence: signed-verifier RPC binds the active lease, persists
-- proof + attestation and completes the task in one transaction.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $mission_trusted_proof_persistence$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_proof uuid;
  v_attestation uuid;
  v_envelope jsonb;
  v_action uuid;
  v_status text;
begin
  -- Positive case plus worker mismatch, envelope scope mismatch and replay rejection.
  v_mission := public.nova_create_mission(
    v_owner,'Trusted proof persistence fixture','Atomic proof persistence','agents',
    'mission-trusted-proof-success-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Verified task","description":"Atomic proof test","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Atomic proof test"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-trusted-proof-success-001','Run trusted proof test'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved test');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'proof-persist-worker',120);

  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','nova.integration-verifier','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','evidence-reviewed','passed',true))
  );

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'wrong-worker',v_token,v_envelope,repeat('a',64),'Must reject wrong worker'
    );
    raise exception 'Proof persistence accepted a worker identity not bound to the lease';
  exception when sqlstate '55000' then null;
  end;
  if exists(select 1 from public.nova_mission_proof_attestations where run_id=v_run) then
    raise exception 'Wrong worker attempt persisted an attestation';
  end if;

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker','77777777-7777-4777-8777-777777777777',
      v_envelope,repeat('a',64),'Must reject stale lease token'
    );
    raise exception 'Proof persistence accepted a stale lease token';
  exception when sqlstate '55000' then null;
  end;

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,'not-a-sha256-digest','Must reject malformed digest'
    );
    raise exception 'Proof persistence accepted a malformed digest';
  exception when check_violation then null;
  end;

  update public.nova_mission_execution_runs
     set lease_expires_at=now()-interval '1 second'
   where id=v_run;
  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,repeat('a',64),'Must reject expired lease'
    );
    raise exception 'Proof persistence accepted an expired lease';
  exception when sqlstate '55000' then null;
  end;
  update public.nova_mission_execution_runs
     set lease_expires_at=now()+interval '90 seconds'
   where id=v_run;

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,
      jsonb_set(v_envelope,'{outcome}','"failed"'::jsonb),
      repeat('a',64),'Must reject failed proof'
    );
    raise exception 'Proof persistence accepted a failed proof as completion';
  exception when check_violation then null;
  end;

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,
      jsonb_set(v_envelope,'{task_id}','"99999999-9999-4999-8999-999999999999"'::jsonb),
      repeat('a',64),'Must reject mismatched task'
    );
    raise exception 'Proof persistence accepted a mismatched task binding';
  exception when check_violation then null;
  end;
  if exists(select 1 from public.nova_mission_proof_attestations where run_id=v_run) then
    raise exception 'Mismatched task attempt persisted an attestation';
  end if;

  select proof_id,attestation_id into v_proof,v_attestation
    from public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,repeat('a',64),'Verified by integration verifier'
    );
  if v_proof is null or v_attestation is null
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'succeeded'
     or (select status from public.nova_mission_tasks where id=v_task) <> 'completed'
     or (select state from public.nova_missions where id=v_mission) <> 'completed'
     or not exists(select 1 from public.nova_mission_proofs where id=v_proof and verification_status='passed')
     or not exists(select 1 from public.nova_mission_proof_attestations
       where id=v_attestation and proof_id=v_proof and run_id=v_run and evidence_digest=repeat('a',64)) then
    raise exception 'Atomic trusted proof persistence did not complete all bound records';
  end if;

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,repeat('a',64),'Duplicate proof replay'
    );
    raise exception 'Completed run accepted a duplicate proof replay';
  exception when sqlstate '55000' then null;
  end;

  -- A failure in lease-fenced completion must roll back both proof and attestation.
  v_mission := public.nova_create_mission(
    v_owner,'Trusted proof rollback fixture','Rollback partial proof writes','agents',
    'mission-trusted-proof-rollback-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Receipt-blocked task","description":"Atomic rollback test","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Atomic rollback test"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-trusted-proof-rollback-001','Run rollback test'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved test');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'proof-persist-worker',120);
  select action_id into v_action
    from public.nova_reserve_mission_action(v_run,v_token,'proof-rollback-action-001',repeat('b',64));
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','nova.integration-verifier','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','evidence-reviewed','passed',true))
  );
  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,repeat('b',64),'Must roll back'
    );
    raise exception 'Proof persistence bypassed an unresolved action receipt';
  exception when sqlstate '55000' then null;
  end;
  if exists(select 1 from public.nova_mission_proof_attestations where run_id=v_run)
     or exists(select 1 from public.nova_mission_proofs where mission_id=v_mission and task_id=v_task) then
    raise exception 'Failed completion left a partial proof or attestation row';
  end if;

  v_status := public.nova_complete_mission_action(v_action,v_token,repeat('c',64),'proof-rollback-fixture-receipt');
  if v_status <> 'completed' then
    raise exception 'Could not resolve the blocking action receipt';
  end if;
  select proof_id,attestation_id into v_proof,v_attestation
    from public.nova_persist_mission_proof_and_complete(
      v_run,'proof-persist-worker',v_token,v_envelope,repeat('b',64),'Verified after receipt resolution'
    );
  if v_proof is null or v_attestation is null
     or (select status from public.nova_mission_execution_runs where id=v_run) <> 'succeeded' then
    raise exception 'Proof persistence did not recover after action reconciliation';
  end if;
end $mission_trusted_proof_persistence$;
reset role;

-- Tool-gates policy snapshots are accepted only on a trusted agents.tool_gates proof.
set role service_role;
select set_config('request.jwt.claim.role','service_role',false);
do $mission_tool_policy_persistence$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_mission uuid;
  v_task uuid;
  v_approval uuid;
  v_run uuid;
  v_token uuid;
  v_proof uuid;
  v_attestation uuid;
  v_envelope jsonb;
begin
  v_mission := public.nova_create_mission(
    v_owner,'Tool policy persistence fixture','Bind tool policy to trusted proof','agents',
    'mission-tool-policy-proof-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Define tool gates","description":"Persist an approved tool policy","task_type":"agents.tool_gates","input_schema_version":1,"input":{"description":"Persist an approved tool policy"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-tool-policy-proof-001','Run trusted tool policy verifier'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved tool policy verifier');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'tool-policy-proof-worker',120);

  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','agents.tool-gates-policy','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','tool-policy-reviewed','passed',true))
  );

  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'tool-policy-proof-worker',v_token,v_envelope,repeat('e',64),'Must reject missing tool policy'
    );
    raise exception 'Tool-gates proof accepted without a persisted policy snapshot';
  exception when check_violation then
    null;
  end;
  if exists(select 1 from public.nova_mission_proof_attestations where run_id=v_run)
     or exists(select 1 from public.nova_mission_proofs where mission_id=v_mission and task_id=v_task) then
    raise exception 'Rejected tool policy proof left partial proof records';
  end if;

  v_envelope := v_envelope || jsonb_build_object(
    'tool_policy',jsonb_build_object(
      'version',1,
      'gates',jsonb_build_array(jsonb_build_object(
        'id','read-project-files','tool','files.read','operation','read',
        'scope',jsonb_build_object('kind','project','ref','nova-project'),
        'risk','low','approvalRequired',false,'credentialBoundary','user_session',
        'reason','Read only files explicitly attached to this project.',
        'sourceRefIds',jsonb_build_array('mission-input')
      ))
    )
  );

  select proof_id,attestation_id into v_proof,v_attestation
    from public.nova_persist_mission_proof_and_complete(
      v_run,'tool-policy-proof-worker',v_token,v_envelope,repeat('e',64),'Persisted signed tool policy'
    );
  if v_proof is null or v_attestation is null
     or not exists (
       select 1 from public.nova_mission_proof_attestations
        where id=v_attestation and verifier_id='agents.tool-gates-policy'
          and envelope_json->'tool_policy' = v_envelope->'tool_policy'
     ) then
    raise exception 'Valid tool policy snapshot was not persisted with its trusted attestation';
  end if;
  -- A tool-policy snapshot must not be smuggled through an unrelated task.
  v_mission := public.nova_create_mission(
    v_owner,'Wrong task policy fixture','Reject cross-task policy snapshot','agents',
    'mission-tool-policy-wrong-task-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Generic checklist","description":"Must not carry tool policy","task_type":"agents.checklist","input_schema_version":1,"input":{"description":"Must not carry tool policy"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-tool-policy-wrong-task-001','Run generic checklist'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved generic checklist');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'wrong-task-policy-worker',120);
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','agents.tool-gates-policy','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','tool-policy-reviewed','passed',true)),
    'tool_policy',jsonb_build_object('version',1,'gates',jsonb_build_array())
  );
  begin
    perform public.nova_persist_mission_proof_and_complete(
      v_run,'wrong-task-policy-worker',v_token,v_envelope,repeat('f',64),'Must reject cross-task policy'
    );
    raise exception 'A non-tool-gates task accepted a tool-policy proof snapshot';
  exception when check_violation then
    null;
  end;
  if exists(select 1 from public.nova_mission_proof_attestations where run_id=v_run)
     or exists(select 1 from public.nova_mission_proofs where mission_id=v_mission and task_id=v_task) then
    raise exception 'Rejected cross-task policy proof left partial proof records';
  end if;

  -- Permission snapshots must be persisted only for the matching permissions task.
  v_mission := public.nova_create_mission(
    v_owner,'Permission policy persistence fixture','Bind permission policy to trusted proof','agents',
    'mission-permission-policy-proof-001','{}'::jsonb
  );
  perform public.nova_save_mission_plan(
    v_owner,v_mission,'{"kind":"starter_template","workspace":"agents"}'::jsonb,
    '[{"title":"Define permissions","description":"Persist least-privilege permissions","task_type":"agents.permissions","input_schema_version":1,"input":{"description":"Persist least-privilege permissions"}}]'::jsonb
  );
  select id into v_task from public.nova_mission_tasks where mission_id=v_mission;
  v_approval := public.nova_request_task_approval(
    v_owner,v_mission,v_task,'approval-permission-policy-proof-001','Run trusted permission verifier'
  );
  select id into v_run from public.nova_mission_execution_runs where approval_id=v_approval;
  perform public.nova_decide_task_approval(v_owner,v_approval,'approve',v_owner,'Approved permission verifier');
  select lease_token into v_token
    from public.nova_claim_mission_task(v_run,'permission-policy-proof-worker',120);
  v_envelope := jsonb_build_object(
    'schema_version','nova.proof.v1','mission_id',v_mission,'task_id',v_task,'run_id',v_run,
    'verifier_id','agents.permissions-least-privilege','verifier_version','1.0.0',
    'observed_at',now(),'outcome','passed',
    'checks',jsonb_build_array(jsonb_build_object('id','permission-policy-reviewed','passed',true)),
    'permission_policy',jsonb_build_object(
      'permissions',jsonb_build_array(jsonb_build_object(
        'id','123e4567-e89b-42d3-a456-426614174000',
        'scope',jsonb_build_object('kind','project','ref','nova-project'),
        'actions',jsonb_build_array('read'),
        'approvalRequired',false,
        'reason','Read only resources explicitly within this named project.',
        'sourceRefIds',jsonb_build_array('mission-input')
      ))
    )
  );
  select proof_id,attestation_id into v_proof,v_attestation
    from public.nova_persist_mission_proof_and_complete(
      v_run,'permission-policy-proof-worker',v_token,v_envelope,repeat('d',64),'Persisted signed permission policy'
    );
  if v_proof is null or v_attestation is null
     or not exists (
       select 1 from public.nova_mission_proof_attestations
        where id=v_attestation and verifier_id='agents.permissions-least-privilege'
          and envelope_json->'permission_policy' = v_envelope->'permission_policy'
     ) then
    raise exception 'Valid permission policy snapshot was not persisted with its trusted attestation';
  end if;
end $mission_tool_policy_persistence$;
reset role;

do $mission_trusted_proof_privileges$
begin
  if has_function_privilege('anon',
       'public.nova_persist_mission_proof_and_complete(uuid,text,uuid,jsonb,text,text)','execute')
     or has_function_privilege('authenticated',
       'public.nova_persist_mission_proof_and_complete(uuid,text,uuid,jsonb,text,text)','execute')
     or not has_function_privilege('service_role',
       'public.nova_persist_mission_proof_and_complete(uuid,text,uuid,jsonb,text,text)','execute') then
    raise exception 'Trusted proof persistence RPC must be restricted to service_role';
  end if;
  if not exists (
    select 1 from pg_indexes
     where schemaname='public'
       and indexname='nova_mission_proof_attestations_run_uidx'
  ) then
    raise exception 'Proof attestations must enforce one attestation per execution run';
  end if;
end $mission_trusted_proof_privileges$;
