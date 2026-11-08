-- Audit events can contain invitee email addresses and internal membership details.
-- Keep the audit trail visible only to active owners and admins.
drop policy if exists nova_bi_audit_read_member on public.nova_bi_audit_events;
drop policy if exists nova_bi_audit_read_admin on public.nova_bi_audit_events;
create policy nova_bi_audit_read_admin on public.nova_bi_audit_events
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_audit_events.organization_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role in ('owner','admin')
));
