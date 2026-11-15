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


-- A provider that omits usage must not turn the reservation estimate into
-- an authoritative count, and retrying that unknown settlement is idempotent.
set role service_role;
select public.nova_reserve_usage(
  '99999999-9999-4999-8999-999999999999',
  '2026-11','free',5,'quick','mock-provider',23,0,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);
select public.nova_settle_usage(
  '99999999-9999-4999-8999-999999999999',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',null,null,'completed'
);
select public.nova_settle_usage(
  '99999999-9999-4999-8999-999999999999',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',null,null,'completed'
);
reset role;

do $$
begin
  if not exists (
    select 1 from public.usage_ledger
     where user_id='99999999-9999-4999-8999-999999999999'
       and reservation_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
       and input_tokens=23 and input_tokens_known=false
       and output_tokens=0 and output_tokens_known=false
       and status='completed'
  ) then
    raise exception 'Unknown provider usage must remain explicitly unknown';
  end if;
  if public.nova_settle_usage(
    '99999999-9999-4999-8999-999999999999',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',24,null,'completed'
  ) then
    raise exception 'Conflicting input usage settlement must be rejected';
  end if;
end $$;
