-- Proof Ledger hardening: completion must be backed by task-scoped passing evidence.
-- This does not claim that evidence is independently verified by a worker; only the
-- trusted server role can write proof rows, and no worker endpoint is enabled yet.

create or replace function public.nova_require_verified_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $proof_task$
begin
  if new.status = 'completed' and old.status is distinct from 'completed'
     and not exists (
       select 1
         from public.nova_mission_proofs p
        where p.task_id = new.id
          and p.mission_id = new.mission_id
          and p.owner_id = new.owner_id
          and p.verification_status = 'passed'
          and p.verified_at is not null
     ) then
    raise exception 'Task completion requires task-scoped passing proof'
      using errcode = '23514';
  end if;
  return new;
end;
$proof_task$;

revoke all on function public.nova_require_verified_task_completion()
  from public, anon, authenticated;

drop trigger if exists nova_task_completion_requires_proof on public.nova_mission_tasks;
create trigger nova_task_completion_requires_proof
before update of status on public.nova_mission_tasks
for each row execute function public.nova_require_verified_task_completion();

create or replace function public.nova_require_verified_mission_completion()
returns trigger
language plpgsql
set search_path = ''
as $proof_mission$
begin
  if new.state = 'completed' and old.state is distinct from 'completed' then
    if not exists (
      select 1 from public.nova_mission_tasks t
       where t.mission_id = new.id and t.owner_id = new.owner_id
    ) then
      raise exception 'Mission completion requires at least one completed task'
        using errcode = '23514';
    end if;

    if exists (
      select 1
        from public.nova_mission_tasks t
       where t.mission_id = new.id
         and t.owner_id = new.owner_id
         and (
           t.status <> 'completed'
           or not exists (
             select 1
               from public.nova_mission_proofs p
              where p.task_id = t.id
                and p.mission_id = t.mission_id
                and p.owner_id = t.owner_id
                and p.verification_status = 'passed'
                and p.verified_at is not null
           )
         )
    ) then
      raise exception 'Mission completion requires every task to be completed with passing proof'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$proof_mission$;

revoke all on function public.nova_require_verified_mission_completion()
  from public, anon, authenticated;

drop trigger if exists nova_mission_completion_requires_proof on public.nova_missions;
create trigger nova_mission_completion_requires_proof
before update of state on public.nova_missions
for each row execute function public.nova_require_verified_mission_completion();
