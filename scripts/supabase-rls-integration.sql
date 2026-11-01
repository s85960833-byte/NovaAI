-- Runs against an isolated PostgreSQL database with Supabase-compatible auth roles/functions.
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','bi-owner@example.invalid'),
 ('22222222-2222-4222-8222-222222222222','bi-outsider@example.invalid'),
 ('33333333-3333-4333-8333-333333333333','bi-admin@example.invalid'),
 ('44444444-4444-4444-8444-444444444444','bi-invitee@example.invalid'),
 ('55555555-5555-4555-8555-555555555555','bi-analyst@example.invalid');

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
insert into public.nova_bi_organizations(id,name,created_by)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Acme Test','11111111-1111-4111-8111-111111111111');

reset role;
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

do $$
begin
  if (select count(*) from public.nova_bi_organizations) <> 1 then
    raise exception 'Tenant isolation failed: owner should see exactly one organization';
  end if;
  if (select count(*) from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') <> 1 then
    raise exception 'Owner cannot read own dataset';
  end if;
  begin
    update public.nova_bi_workflow_proposals set status='approved'
    where id='ffffffff-ffff-4fff-8fff-ffffffffffff';
    raise exception 'Creator unexpectedly approved own proposal';
  exception when insufficient_privilege then
    null;
  end;
end $$;

reset role;
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','admin','active');
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','viewer','invited');
insert into public.nova_bi_memberships(organization_id,user_id,role,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','55555555-5555-4555-8555-555555555555','analyst','active');
insert into public.nova_bi_workflow_proposals(id,organization_id,created_by,title,status,proposal_json,idempotency_key)
values('abababab-abab-4bab-8bab-abababababab','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
'11111111-1111-4111-8111-111111111111','Analyst role approval test','proposed',
'{"steps":["review"]}'::jsonb,'idempotency-acme-analyst-001');

set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$
begin
  if (select count(*) from public.nova_bi_organizations) <> 1 then
    raise exception 'Tenant isolation failed: outsider should only see their own organization';
  end if;
  if exists(select 1 from public.nova_bi_datasets where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') then
    raise exception 'Cross-tenant dataset leak detected';
  end if;
  if exists(select 1 from public.nova_bi_audit_events where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then
    raise exception 'Cross-tenant audit leak detected';
  end if;
  if has_table_privilege('authenticated','public.nova_bi_memberships','insert') then
    raise exception 'Authenticated clients must not insert membership rows directly';
  end if;
end $$;
update public.nova_bi_datasets set name='Hacked' where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
update public.nova_bi_workflow_proposals set status='approved'
where id='ffffffff-ffff-4fff-8fff-ffffffffffff';
do $$
begin
  if not exists(select 1 from public.nova_bi_workflow_approvals where proposal_id='ffffffff-ffff-4fff-8fff-ffffffffffff' and actor_id='33333333-3333-4333-8333-333333333333' and decision='approved') then
    raise exception 'Admin approval record was not created';
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
end $$;

select 'PASS: migrations, RLS isolation, invitation acceptance, approval separation, branding, and audited deletion' as result;
