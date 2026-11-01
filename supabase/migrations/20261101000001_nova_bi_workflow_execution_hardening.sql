-- Follow-up hardening for NOVA BI tenant schema.
-- Execution records are visible to tenant members but writable only by trusted server code.

create table if not exists public.nova_bi_workflow_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  proposal_id uuid not null,
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  status text not null check (status in ('queued','running','succeeded','failed','cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(result_summary) = 'object'),
  error_code text check (error_code is null or char_length(error_code) <= 100),
  created_at timestamptz not null default now(),
  foreign key (organization_id, proposal_id)
    references public.nova_bi_workflow_proposals(organization_id, id) on delete restrict,
  unique (organization_id, idempotency_key)
);

create index if not exists nova_bi_execution_org_created_idx
  on public.nova_bi_workflow_executions(organization_id, created_at desc);

alter table public.nova_bi_workflow_executions enable row level security;
revoke all on public.nova_bi_workflow_executions from anon, authenticated;
grant select on public.nova_bi_workflow_executions to authenticated;

create policy nova_bi_execution_read_member on public.nova_bi_workflow_executions
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_workflow_executions.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

-- Do not allow authenticated clients to rewrite the original dataset owner.
revoke update on public.nova_bi_datasets from authenticated;
grant update (name, deleted_at) on public.nova_bi_datasets to authenticated;

drop policy if exists nova_bi_dataset_update_analyst on public.nova_bi_datasets;
create policy nova_bi_dataset_update_analyst on public.nova_bi_datasets
for update to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
))
with check (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
));
