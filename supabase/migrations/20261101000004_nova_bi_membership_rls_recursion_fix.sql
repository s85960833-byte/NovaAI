-- Avoid recursive RLS evaluation when organization admins inspect membership rows.
create or replace function public.nova_bi_is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.nova_bi_memberships m
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner','admin')
  );
$$;

revoke all on function public.nova_bi_is_org_admin(uuid) from public, anon;
grant execute on function public.nova_bi_is_org_admin(uuid) to authenticated;

drop policy if exists nova_bi_membership_read_self on public.nova_bi_memberships;
drop policy if exists nova_bi_membership_read_org_admin on public.nova_bi_memberships;
create policy nova_bi_membership_read_self_or_admin on public.nova_bi_memberships
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.nova_bi_is_org_admin(organization_id)
);
