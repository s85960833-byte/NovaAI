\set ON_ERROR_STOP on
-- CI-only fixture in the disposable PostgreSQL service created by GitHub Actions.
insert into auth.users(id,email)
values ('99999999-9999-4999-8999-999999999999','quota-test@example.invalid')
on conflict (id) do nothing;
set role service_role;
select public.nova_reserve_usage('99999999-9999-4999-8999-999999999999','2026-11','free',5,'standard','mock-provider',23,0,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select public.nova_settle_usage('99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',12,37,'completed');
select public.nova_settle_usage('99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',12,37,'completed');
reset role;
do $$
begin
  if not exists (
    select 1 from public.usage_ledger
     where user_id='99999999-9999-4999-8999-999999999999'
       and reservation_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       and input_tokens=12 and input_tokens_known=true
       and output_tokens=37 and output_tokens_known=true
       and status='completed' and settled_at is not null
  ) then raise exception 'Usage settlement did not persist provider token counts'; end if;
  if public.nova_settle_usage('99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',12,38,'completed') then
    raise exception 'Usage settlement accepted a conflicting retry';
  end if;
end $$;
