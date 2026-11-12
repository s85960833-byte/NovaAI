-- Defense-in-depth: an approval row cannot be marked approved/rejected
-- unless the recorded decision actor is the same owner who owns the mission.
-- The API/RPC already checks this; the trigger protects all trusted write paths.

create or replace function public.nova_guard_mission_approval_actor()
returns trigger
language plpgsql
set search_path = ''
as $approval_actor$
begin
  if new.status in ('approved', 'rejected')
     and (new.decided_by is distinct from new.owner_id or new.decided_at is null) then
    raise exception 'Mission approval decision must be recorded by its owner'
      using errcode = '23514';
  end if;
  return new;
end;
$approval_actor$;

revoke all on function public.nova_guard_mission_approval_actor()
  from public, anon, authenticated, service_role;

drop trigger if exists nova_mission_approval_actor_guard
  on public.nova_mission_approvals;
create trigger nova_mission_approval_actor_guard
before insert or update of status, owner_id, decided_by, decided_at
on public.nova_mission_approvals
for each row execute function public.nova_guard_mission_approval_actor();
