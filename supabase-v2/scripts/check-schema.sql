do $$
declare
  table_name text;
  expected_tables text[] := array[
    'profiles','chats','messages','files','wallets','ledger_entries',
    'mock_payments','usage_events','diwan_jobs','schemes','audit_log','feature_flags','payment_events'
  ];
  enabled_count integer;
begin
  foreach table_name in array expected_tables loop
    select count(*) into enabled_count
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = table_name and c.relkind = 'r' and c.relrowsecurity;
    if enabled_count <> 1 then raise exception 'RLS_NOT_ENABLED: public.%', table_name; end if;
  end loop;
  if (select count(*) from pg_policies where schemaname = 'public') < 10 then
    raise exception 'RLS_POLICIES_MISSING';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'wallet_ledger_no_update' and not tgisinternal) then
    raise exception 'WALLET_APPEND_ONLY_TRIGGER_MISSING';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'wallet_ledger_balance_trigger' and not tgisinternal) then
    raise exception 'WALLET_BALANCE_TRIGGER_MISSING';
  end if;
  if (select count(*) from information_schema.tables where table_schema = 'nova2_staging') < 5 then
    raise exception 'SYNTHETIC_WALLET_SCHEMA_INCOMPLETE';
  end if;
end $$;
select 'RLS_AND_SCHEMA_CHECK_PASS' as result;
