-- Do not let a reclaimed worker reserve a different action while a prior
-- lease still has an unresolved reserved receipt for the same execution run.
-- Same-key retries remain subject to the existing digest and lease-token checks.
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
     where receipt.run_id = new.run_id
       and receipt.status = 'reserved'
       and receipt.action_key <> new.action_key
  ) then
    raise exception 'An earlier action reservation must be reconciled before another action is reserved'
      using errcode = '55P03';
  end if;
  return new;
end;
$guard$;

revoke all on function public.nova_guard_unresolved_mission_action()
  from public, anon, authenticated, service_role;

drop trigger if exists nova_mission_action_unresolved_guard
  on public.nova_mission_action_receipts;
create trigger nova_mission_action_unresolved_guard
before insert on public.nova_mission_action_receipts
for each row execute function public.nova_guard_unresolved_mission_action();
