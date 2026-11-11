-- An uncertain external action stays blocked until its owner records an
-- explicit outcome after checking the external system. Worker reconciliation
-- notes alone are deliberately not treated as a resolution.
create table if not exists public.nova_mission_action_resolutions (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null unique
    references public.nova_mission_action_receipts(id) on delete cascade,
  mission_id uuid not null,
  task_id uuid not null,
  run_id uuid not null,
  owner_id uuid not null,
  outcome text not null check (outcome in ('confirmed_executed','confirmed_not_executed')),
  evidence_reference text not null
    check (char_length(btrim(evidence_reference)) between 8 and 300),
  resolution_note text not null
    check (char_length(btrim(resolution_note)) between 30 and 1000),
  resolved_at timestamptz not null default pg_catalog.now(),
  foreign key (run_id, mission_id, task_id, owner_id)
    references public.nova_mission_execution_runs(id, mission_id, task_id, owner_id)
    on delete cascade
);

create index if not exists nova_mission_action_resolutions_owner_idx
  on public.nova_mission_action_resolutions(owner_id, resolved_at desc);

alter table public.nova_mission_action_resolutions enable row level security;
revoke all on public.nova_mission_action_resolutions from public, anon, authenticated, service_role;
grant select on public.nova_mission_action_resolutions to authenticated, service_role;
create policy nova_mission_action_resolutions_select_own
  on public.nova_mission_action_resolutions
  for select to authenticated using (owner_id = (select auth.uid()));

create or replace function public.nova_resolve_uncertain_mission_action(
  p_action_id uuid,
  p_outcome text,
  p_evidence_reference text,
  p_resolution_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $resolve$
declare
  v_mission_id uuid;
  v_approval_id uuid;
  v_task_id uuid;
  v_run_id uuid;
  v_owner_id uuid;
  v_mission_state text;
  v_approval_status text;
  v_run_status text;
  v_task_status text;
  v_action_status text;
  v_resolution_id uuid;
begin
  if auth.uid() is null then
    raise exception 'An authenticated mission owner must resolve uncertain actions'
      using errcode = '42501';
  end if;
  if p_action_id is null
     or p_outcome not in ('confirmed_executed','confirmed_not_executed')
     or p_evidence_reference is null
     or pg_catalog.char_length(pg_catalog.btrim(p_evidence_reference)) not between 8 and 300
     or p_resolution_note is null
     or pg_catalog.char_length(pg_catalog.btrim(p_resolution_note)) not between 30 and 1000 then
    raise exception 'Action resolution requires an outcome, evidence reference and detailed note'
      using errcode = '23514';
  end if;

  select a.mission_id, a.task_id, a.run_id, a.owner_id
    into v_mission_id, v_task_id, v_run_id, v_owner_id
    from public.nova_mission_action_receipts a where a.id = p_action_id;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;
  if v_owner_id is distinct from auth.uid() then
    raise exception 'Only the mission owner can resolve this action'
      using errcode = '42501';
  end if;

  -- Preserve the global mission -> approval -> run -> task -> receipt lock order.
  select state into v_mission_state from public.nova_missions
   where id = v_mission_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Mission not found' using errcode = 'P0002'; end if;
  select a.id, a.status into v_approval_id, v_approval_status
    from public.nova_mission_approvals a
    join public.nova_mission_execution_runs r on r.approval_id = a.id
   where r.id = v_run_id and a.owner_id = v_owner_id for update of a;
  if not found then raise exception 'Approval not found' using errcode = 'P0002'; end if;
  select status into v_run_status from public.nova_mission_execution_runs
   where id = v_run_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Execution run not found' using errcode = 'P0002'; end if;
  if v_run_status = 'running' then
    raise exception 'An uncertain action can only be owner-resolved after its worker lease has been released'
      using errcode = '55P03';
  end if;
  select status into v_task_status from public.nova_mission_tasks
   where id = v_task_id and mission_id = v_mission_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Task not found' using errcode = 'P0002'; end if;

  select status into v_action_status from public.nova_mission_action_receipts
   where id = p_action_id and owner_id = v_owner_id for update;
  if not found then raise exception 'Action receipt not found' using errcode = 'P0002'; end if;
  if v_action_status <> 'uncertain' then
    raise exception 'Only uncertain actions can receive an owner resolution'
      using errcode = '55000';
  end if;
  if exists (select 1 from public.nova_mission_action_resolutions where action_id = p_action_id) then
    raise exception 'This uncertain action already has an immutable owner resolution'
      using errcode = '23505';
  end if;

  insert into public.nova_mission_action_resolutions(
    action_id, mission_id, task_id, run_id, owner_id,
    outcome, evidence_reference, resolution_note
  ) values (
    p_action_id, v_mission_id, v_task_id, v_run_id, v_owner_id,
    p_outcome, pg_catalog.btrim(p_evidence_reference), pg_catalog.btrim(p_resolution_note)
  ) returning id into v_resolution_id;
  return v_resolution_id;
end;
$resolve$;

revoke all on function public.nova_resolve_uncertain_mission_action(uuid,text,text,text)
  from public, anon, service_role;
grant execute on function public.nova_resolve_uncertain_mission_action(uuid,text,text,text)
  to authenticated;

create or replace function public.nova_guard_unresolved_mission_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $guard$
begin
  if exists (
    select 1
      from public.nova_mission_action_receipts receipt
     where receipt.mission_id = new.mission_id
       and receipt.action_key <> new.action_key
       and (
         receipt.status = 'reserved'
         or (
           receipt.status = 'uncertain'
           and not exists (
             select 1 from public.nova_mission_action_resolutions resolution
              where resolution.action_id = receipt.id
           )
         )
       )
  ) then
    raise exception 'An earlier mission action must be completed or explicitly resolved by its owner before another action is reserved'
      using errcode = '55P03';
  end if;
  return new;
end;
$guard$;

revoke all on function public.nova_guard_unresolved_mission_action()
  from public, anon, authenticated, service_role;

-- Attach the mission-wide guard to every new reservation receipt. The reserve
-- RPC locks the mission row before INSERT, serializing this check with owner
-- resolutions and other reservations for the same mission.
drop trigger if exists nova_guard_unresolved_mission_action
  on public.nova_mission_action_receipts;
create trigger nova_guard_unresolved_mission_action
  before insert on public.nova_mission_action_receipts
  for each row execute function public.nova_guard_unresolved_mission_action();


