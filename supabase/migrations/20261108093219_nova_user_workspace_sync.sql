-- Per-user NOVA workspace sync. No organization-wide sharing.
create table if not exists public.nova_user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version = 1),
  updated_at timestamptz not null default now(),
  constraint nova_user_workspaces_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint nova_user_workspaces_payload_size check (octet_length(payload::text) <= 750000)
);
alter table public.nova_user_workspaces enable row level security;
revoke all on public.nova_user_workspaces from anon, public;
grant select, insert, update, delete on public.nova_user_workspaces to authenticated;
drop policy if exists nova_user_workspace_select_own on public.nova_user_workspaces;
create policy nova_user_workspace_select_own on public.nova_user_workspaces
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists nova_user_workspace_insert_own on public.nova_user_workspaces;
create policy nova_user_workspace_insert_own on public.nova_user_workspaces
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists nova_user_workspace_update_own on public.nova_user_workspaces;
create policy nova_user_workspace_update_own on public.nova_user_workspaces
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists nova_user_workspace_delete_own on public.nova_user_workspaces;
create policy nova_user_workspace_delete_own on public.nova_user_workspaces
for delete to authenticated using (user_id = (select auth.uid()));
