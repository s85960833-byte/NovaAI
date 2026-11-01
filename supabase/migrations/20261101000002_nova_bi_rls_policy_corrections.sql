-- Correct outer-row qualification and keep soft deletion admin-only.
drop policy if exists nova_bi_org_read_member on public.nova_bi_organizations;
create policy nova_bi_org_read_member on public.nova_bi_organizations
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_organizations.id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

revoke update (deleted_at) on public.nova_bi_datasets from authenticated;
revoke update (name, deleted_at) on public.nova_bi_datasets from authenticated;
grant update (name) on public.nova_bi_datasets to authenticated;
