-- Invite acceptance is self-service but cannot change the invited user's role or tenant.
grant update(status) on public.nova_bi_memberships to authenticated;

drop policy if exists nova_bi_membership_accept_invite on public.nova_bi_memberships;
create policy nova_bi_membership_accept_invite on public.nova_bi_memberships
for update to authenticated
using (user_id = (select auth.uid()) and status = 'invited')
with check (user_id = (select auth.uid()) and status = 'active');

drop policy if exists nova_bi_org_read_member on public.nova_bi_organizations;
create policy nova_bi_org_read_member on public.nova_bi_organizations
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_organizations.id
    and m.user_id = (select auth.uid())
    and m.status in ('active','invited')
));

create or replace function public.nova_bi_invite_accept_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = new.status then return new; end if;
  if old.status <> 'invited' or new.status <> 'active' then
    raise exception using errcode = '42501', message = 'Only pending invitations can be accepted';
  end if;
  if auth.uid() is null or old.user_id <> auth.uid() then
    raise exception using errcode = '42501', message = 'Only the invited user can accept this invitation';
  end if;
  new.updated_at := now();
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(old.organization_id,old.user_id,'membership.invitation.accepted','membership',old.id,
         jsonb_build_object('role',old.role));
  return new;
end;
$$;
revoke all on function public.nova_bi_invite_accept_guard() from public, anon, authenticated;
drop trigger if exists nova_bi_invite_accept_guard on public.nova_bi_memberships;
create trigger nova_bi_invite_accept_guard
before update of status on public.nova_bi_memberships
for each row execute function public.nova_bi_invite_accept_guard();
