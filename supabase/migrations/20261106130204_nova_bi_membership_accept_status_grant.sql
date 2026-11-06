-- Reconcile the live invitation-acceptance permission boundary.
-- Members may update only their own invitation status; role, tenant and user identity remain immutable.
grant update (status) on table public.nova_bi_memberships to authenticated;
