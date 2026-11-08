-- Limit browser-authenticated clients to the CRUD operations required by optional workspace sync.
-- TRUNCATE bypasses row-level security, so it must not be granted to authenticated clients.
revoke references, trigger, truncate on table public.nova_user_workspaces from authenticated;
grant select, insert, update, delete on table public.nova_user_workspaces to authenticated;
