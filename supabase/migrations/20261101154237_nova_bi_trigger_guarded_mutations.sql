-- Replace client-callable SECURITY DEFINER RPCs with tightly scoped RLS writes and trigger-enforced invariants.

revoke all on function public.nova_bi_create_organization(text) from public, anon, authenticated;
revoke all on function public.nova_bi_decide_workflow(uuid, text, text) from public, anon, authenticated;
revoke all on function public.nova_bi_is_org_admin(uuid) from public, anon, authenticated;

drop policy if exists nova_bi_membership_read_self_or_admin on public.nova_bi_memberships;
drop policy if exists nova_bi_membership_read_org_admin on public.nova_bi_memberships;
drop policy if exists nova_bi_membership_read_self on public.nova_bi_memberships;
create policy nova_bi_membership_read_self on public.nova_bi_memberships
for select to authenticated using (user_id = (select auth.uid()));

grant insert on public.nova_bi_organizations to authenticated;
drop policy if exists nova_bi_org_insert_self on public.nova_bi_organizations;
create policy nova_bi_org_insert_self on public.nova_bi_organizations
for insert to authenticated
with check (created_by = (select auth.uid()));

create or replace function public.nova_bi_organization_bootstrap_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.created_by <> auth.uid() then
    raise exception using errcode = '42501', message = 'Organization creator must match the authenticated user';
  end if;
  insert into public.nova_bi_memberships(organization_id,user_id,role,status)
  values(new.id,new.created_by,'owner','active');
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(new.id,new.created_by,'organization.created','organization',new.id,jsonb_build_object('name',new.name));
  return new;
end;
$$;
revoke all on function public.nova_bi_organization_bootstrap_guard() from public, anon, authenticated;
drop trigger if exists nova_bi_organization_bootstrap on public.nova_bi_organizations;
create trigger nova_bi_organization_bootstrap
after insert on public.nova_bi_organizations
for each row execute function public.nova_bi_organization_bootstrap_guard();

grant update(status) on public.nova_bi_workflow_proposals to authenticated;
drop policy if exists nova_bi_workflow_decide_admin on public.nova_bi_workflow_proposals;
create policy nova_bi_workflow_decide_admin on public.nova_bi_workflow_proposals
for update to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_workflow_proposals.organization_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role in ('owner','admin')
))
with check (
  status in ('approved','rejected')
  and exists (
    select 1 from public.nova_bi_memberships m
    where m.organization_id = nova_bi_workflow_proposals.organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role in ('owner','admin')
  )
);

create or replace function public.nova_bi_workflow_decision_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if old.status <> 'proposed' or new.status not in ('approved','rejected') then
    raise exception using errcode = '55000', message = 'Only proposed workflows can be approved or rejected';
  end if;
  if old.created_by = v_actor then
    raise exception using errcode = '42501', message = 'Proposal creator cannot approve their own proposal';
  end if;
  select role into v_role from public.nova_bi_memberships
    where organization_id = old.organization_id and user_id = v_actor and status = 'active';
  if v_role is null or v_role not in ('owner','admin') then
    raise exception using errcode = '42501', message = 'Active organization owner or admin role required';
  end if;

  insert into public.nova_bi_workflow_approvals(organization_id,proposal_id,actor_id,decision)
  values(old.organization_id,old.id,v_actor,new.status);
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(old.organization_id,v_actor,'workflow.'||new.status,'workflow_proposal',old.id,
         jsonb_build_object('decision',new.status));
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.nova_bi_workflow_decision_guard() from public, anon, authenticated;
drop trigger if exists nova_bi_workflow_decision_guard on public.nova_bi_workflow_proposals;
create trigger nova_bi_workflow_decision_guard
before update of status on public.nova_bi_workflow_proposals
for each row execute function public.nova_bi_workflow_decision_guard();
