-- NOVA Business Intelligence: tenant-isolated metadata and evidence schema.
-- This migration is intentionally not applied to any Supabase project yet.
-- Company CSV rows stay browser-local; only approved metadata and aggregates belong here.

create extension if not exists pgcrypto;

create table if not exists public.nova_bi_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nova_bi_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.nova_bi_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('owner','admin','analyst','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (organization_id, id)
);

create table if not exists public.nova_bi_datasets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.nova_bi_organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  source_type text not null check (source_type in ('csv','xlsx','manual','integration')),
  schema_version text not null default '1',
  fingerprint text not null check (char_length(fingerprint) between 8 and 160),
  row_count integer not null default 0 check (row_count >= 0 and row_count <= 20000),
  column_names jsonb not null default '[]'::jsonb check (jsonb_typeof(column_names) = 'array'),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, id)
);

create table if not exists public.nova_bi_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  dataset_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  analysis_type text not null check (analysis_type in ('cost_leaks','client_profitability','team_productivity','project_risk','scenario')),
  calculation_version text not null,
  result_json jsonb not null default '{}'::jsonb check (jsonb_typeof(result_json) = 'object'),
  evidence_json jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_json) = 'object'),
  assumptions_json jsonb not null default '{}'::jsonb check (jsonb_typeof(assumptions_json) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (organization_id, dataset_id)
    references public.nova_bi_datasets(organization_id, id) on delete restrict,
  unique (organization_id, id)
);

create table if not exists public.nova_bi_workflow_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.nova_bi_organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  status text not null default 'proposed'
    check (status in ('proposed','approved','rejected','executing','completed','failed','cancelled')),
  proposal_json jsonb not null check (jsonb_typeof(proposal_json) = 'object'),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, idempotency_key)
);

create table if not exists public.nova_bi_workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  proposal_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approved','rejected','revoked')),
  note text check (note is null or char_length(note) <= 2000),
  decided_at timestamptz not null default now(),
  foreign key (organization_id, proposal_id)
    references public.nova_bi_workflow_proposals(organization_id, id) on delete restrict
);

create table if not exists public.nova_bi_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.nova_bi_organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 100),
  resource_type text not null check (char_length(resource_type) between 1 and 80),
  resource_id uuid,
  metadata_json jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata_json) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists nova_bi_memberships_user_org_active_idx
  on public.nova_bi_memberships(user_id, organization_id) where status = 'active';
create index if not exists nova_bi_datasets_org_created_idx
  on public.nova_bi_datasets(organization_id, created_at desc) where deleted_at is null;
create index if not exists nova_bi_analyses_org_created_idx
  on public.nova_bi_analyses(organization_id, created_at desc);
create index if not exists nova_bi_workflows_org_status_idx
  on public.nova_bi_workflow_proposals(organization_id, status, created_at desc);
create index if not exists nova_bi_audit_org_created_idx
  on public.nova_bi_audit_events(organization_id, created_at desc);

alter table public.nova_bi_organizations enable row level security;
alter table public.nova_bi_memberships enable row level security;
alter table public.nova_bi_datasets enable row level security;
alter table public.nova_bi_analyses enable row level security;
alter table public.nova_bi_workflow_proposals enable row level security;
alter table public.nova_bi_workflow_approvals enable row level security;
alter table public.nova_bi_audit_events enable row level security;

-- Explicit grants are required for Data API access on newer Supabase projects.
-- RLS remains the tenant boundary; grants alone do not authorize row access.
revoke all on public.nova_bi_organizations, public.nova_bi_memberships,
  public.nova_bi_datasets, public.nova_bi_analyses,
  public.nova_bi_workflow_proposals, public.nova_bi_workflow_approvals,
  public.nova_bi_audit_events from anon, authenticated;

grant select on public.nova_bi_organizations, public.nova_bi_memberships,
  public.nova_bi_datasets, public.nova_bi_analyses,
  public.nova_bi_workflow_proposals, public.nova_bi_workflow_approvals,
  public.nova_bi_audit_events to authenticated;

grant insert, update, delete on public.nova_bi_datasets to authenticated;
grant insert on public.nova_bi_analyses, public.nova_bi_workflow_proposals to authenticated;

create policy nova_bi_org_read_member on public.nova_bi_organizations
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = id and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_membership_read_self on public.nova_bi_memberships
for select to authenticated
using (user_id = (select auth.uid()));

create policy nova_bi_dataset_read_member on public.nova_bi_datasets
for select to authenticated
using (deleted_at is null and exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_dataset_insert_analyst on public.nova_bi_datasets
for insert to authenticated
with check (created_by = (select auth.uid()) and exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
));

create policy nova_bi_dataset_update_analyst on public.nova_bi_datasets
for update to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
))
with check (created_by = (select auth.uid()) and exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
));

create policy nova_bi_dataset_delete_admin on public.nova_bi_datasets
for delete to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_datasets.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin')
));

create policy nova_bi_analysis_read_member on public.nova_bi_analyses
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_analyses.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_analysis_insert_analyst on public.nova_bi_analyses
for insert to authenticated
with check (created_by = (select auth.uid()) and exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_analyses.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
));

create policy nova_bi_workflow_read_member on public.nova_bi_workflow_proposals
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_workflow_proposals.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_workflow_propose_analyst on public.nova_bi_workflow_proposals
for insert to authenticated
with check (created_by = (select auth.uid()) and status = 'proposed' and exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_workflow_proposals.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin','analyst')
));

create policy nova_bi_approval_read_member on public.nova_bi_workflow_approvals
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_workflow_approvals.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_audit_read_member on public.nova_bi_audit_events
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_audit_events.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

-- Deliberately no client policies for membership writes, approvals, audit writes,
-- workflow state changes, or organization creation. Those require trusted server routes.
