-- NOVA Mission Engine persistence and append-only proof history.
-- Browser users can read only their own missions. Writes are reserved for the trusted
-- server-side execution layer using the service_role key; never expose that key to clients.

create table if not exists public.nova_missions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 10000),
  workspace text not null default 'agents'
    check (workspace in ('learn','build','agents','intelligence')),
  state text not null default 'draft'
    check (state in ('draft','planned','running','waiting_approval','verifying','completed','failed','cancelled')),
  version integer not null default 0 check (version >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  idempotency_key text check (idempotency_key is null or char_length(idempotency_key) between 1 and 160),
  plan_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(plan_json) = 'object' and octet_length(plan_json::text) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  unique (owner_id, idempotency_key)
);

create table if not exists public.nova_mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'planned'
    check (status in ('planned','running','waiting_approval','verifying','completed','failed','cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  input_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(input_json) = 'object' and octet_length(input_json::text) <= 50000),
  result_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(result_json) = 'object' and octet_length(result_json::text) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, sequence),
  unique (id, mission_id, owner_id),
  foreign key (mission_id, owner_id)
    references public.nova_missions(id, owner_id) on delete cascade
);

create table if not exists public.nova_mission_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sequence bigint not null check (sequence > 0),
  event_type text not null check (char_length(btrim(event_type)) between 1 and 120),
  from_state text,
  to_state text not null
    check (to_state in ('draft','planned','running','waiting_approval','verifying','completed','failed','cancelled')),
  actor_id uuid references auth.users(id) on delete set null,
  payload_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload_json) = 'object' and octet_length(payload_json::text) <= 20000),
  created_at timestamptz not null default now(),
  unique (mission_id, sequence),
  foreign key (mission_id, owner_id)
    references public.nova_missions(id, owner_id) on delete cascade
);

create table if not exists public.nova_mission_proofs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  task_id uuid,
  owner_id uuid not null references auth.users(id) on delete cascade,
  proof_type text not null check (char_length(btrim(proof_type)) between 1 and 80),
  summary text not null check (char_length(btrim(summary)) between 1 and 2000),
  verification_status text not null default 'pending'
    check (verification_status in ('pending','passed','failed','not_applicable')),
  evidence_json jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence_json) = 'object' and octet_length(evidence_json::text) <= 50000),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (mission_id, owner_id)
    references public.nova_missions(id, owner_id) on delete cascade,
  foreign key (task_id, mission_id, owner_id)
    references public.nova_mission_tasks(id, mission_id, owner_id) on delete cascade,
  check (
    (verification_status = 'passed' and verified_at is not null)
    or (verification_status <> 'passed' and verified_at is null)
  )
);

-- A mission cannot enter the completed state unless a passing proof record exists.
create or replace function public.nova_require_verified_mission_completion()
returns trigger
language plpgsql
as $
begin
  if new.state = 'completed' and old.state is distinct from 'completed'
     and not exists (
       select 1 from public.nova_mission_proofs p
       where p.mission_id = new.id
         and p.owner_id = new.owner_id
         and p.verification_status = 'passed'
         and p.verified_at is not null
     ) then
    raise exception 'Mission completion requires at least one passing proof record'
      using errcode = '23514';
  end if;
  return new;
end;
$;
revoke all on function public.nova_require_verified_mission_completion() from public, anon, authenticated;
drop trigger if exists nova_mission_completion_requires_proof on public.nova_missions;
create trigger nova_mission_completion_requires_proof
before update of state on public.nova_missions
for each row execute function public.nova_require_verified_mission_completion();

create index if not exists nova_missions_owner_updated_idx
  on public.nova_missions(owner_id, updated_at desc);
create index if not exists nova_mission_tasks_mission_status_idx
  on public.nova_mission_tasks(mission_id, status, sequence);
create index if not exists nova_mission_events_owner_created_idx
  on public.nova_mission_events(owner_id, created_at desc);
create index if not exists nova_mission_proofs_owner_created_idx
  on public.nova_mission_proofs(owner_id, created_at desc);

alter table public.nova_missions enable row level security;
alter table public.nova_mission_tasks enable row level security;
alter table public.nova_mission_events enable row level security;
alter table public.nova_mission_proofs enable row level security;

revoke all on public.nova_missions, public.nova_mission_tasks,
  public.nova_mission_events, public.nova_mission_proofs from anon, public, authenticated;
grant select on public.nova_missions, public.nova_mission_tasks,
  public.nova_mission_events, public.nova_mission_proofs to authenticated;
grant select, insert, update on public.nova_missions, public.nova_mission_tasks to service_role;
grant select, insert on public.nova_mission_events, public.nova_mission_proofs to service_role;

drop policy if exists nova_missions_select_own on public.nova_missions;
create policy nova_missions_select_own on public.nova_missions
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists nova_mission_tasks_select_own on public.nova_mission_tasks;
create policy nova_mission_tasks_select_own on public.nova_mission_tasks
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists nova_mission_events_select_own on public.nova_mission_events;
create policy nova_mission_events_select_own on public.nova_mission_events
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists nova_mission_proofs_select_own on public.nova_mission_proofs;
create policy nova_mission_proofs_select_own on public.nova_mission_proofs
for select to authenticated using (owner_id = (select auth.uid()));
