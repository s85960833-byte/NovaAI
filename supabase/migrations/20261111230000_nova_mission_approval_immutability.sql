-- Freeze the exact owner-approved action summary and decision after it is recorded.
-- Service-role access is still server-only; this trigger protects against accidental
-- or compromised trusted-code paths rewriting the authorization record later.

create or replace function public.nova_guard_mission_approval_immutability()
returns trigger
language plpgsql
set search_path = ''
as $approval_immutability$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.decided_at is not null or new.decided_by is not null then
      raise exception 'Mission approval must be created in pending state'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.mission_id is distinct from old.mission_id
     or new.task_id is distinct from old.task_id
     or new.owner_id is distinct from old.owner_id
     or new.request_key is distinct from old.request_key
     or new.action_summary is distinct from old.action_summary
     or new.requested_at is distinct from old.requested_at then
    raise exception 'Mission approval identity and action summary are immutable'
      using errcode = '23514';
  end if;

  if old.status <> 'pending' then
    if new.status is distinct from old.status
       or new.decided_at is distinct from old.decided_at
       or new.decided_by is distinct from old.decided_by
       or new.decision_note is distinct from old.decision_note then
      raise exception 'A recorded mission approval decision is immutable'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if new.status = 'pending' then
    if new.decided_at is not null or new.decided_by is not null
       or new.decision_note is distinct from old.decision_note then
      raise exception 'Pending mission approval cannot contain a decision'
        using errcode = '23514';
    end if;
  elsif new.status not in ('approved', 'rejected', 'expired')
     or new.decided_at is null or new.decided_by is distinct from new.owner_id then
    raise exception 'Mission approval decision must be final and recorded by its owner'
      using errcode = '23514';
  end if;
  return new;
end;
$approval_immutability$;

revoke all on function public.nova_guard_mission_approval_immutability()
  from public, anon, authenticated, service_role;

drop trigger if exists nova_mission_approval_immutability_guard
  on public.nova_mission_approvals;
create trigger nova_mission_approval_immutability_guard
before insert or update on public.nova_mission_approvals
for each row execute function public.nova_guard_mission_approval_immutability();
