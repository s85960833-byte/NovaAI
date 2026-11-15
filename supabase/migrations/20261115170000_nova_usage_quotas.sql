-- NOVA consumer usage ledger and atomic monthly credit reservations.
-- Migration artifact only. Do not apply to any Supabase project without owner approval and backup.

create table if not exists public.nova_user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','ultra')),
  updated_at timestamptz not null default now()
);

create table if not exists public.nova_usage_monthly (
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  plan text not null check (plan in ('free','pro','ultra')),
  limit_credits integer not null check (limit_credits > 0),
  used_credits integer not null default 0 check (used_credits >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  plan text not null check (plan in ('free','pro','ultra')),
  mode text not null check (mode in ('quick','standard','detailed')),
  provider text not null check (char_length(provider) between 1 and 80),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  credits integer not null default 1 check (credits > 0),
  status text not null default 'reserved' check (status in ('reserved','completed','provider_failed','released')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists nova_usage_ledger_user_period_created_idx
  on public.usage_ledger(user_id, period, created_at desc);

alter table public.nova_user_entitlements enable row level security;
alter table public.nova_usage_monthly enable row level security;
alter table public.usage_ledger enable row level security;

revoke all on public.nova_user_entitlements, public.nova_usage_monthly, public.usage_ledger from public, anon, authenticated;
grant select, insert, update, delete on public.nova_user_entitlements, public.nova_usage_monthly, public.usage_ledger to service_role;

create or replace function public.nova_reserve_usage(
  p_user_id uuid,
  p_period text,
  p_plan text,
  p_limit integer,
  p_mode text,
  p_provider text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_reservation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
  v_limit integer;
begin
  if p_user_id is null
     or p_period is null or p_period !~ '^[0-9]{4}-[0-9]{2}$'
     or p_plan not in ('free','pro','ultra')
     or p_limit is null or p_limit < 1 or p_limit > 10000000
     or p_mode not in ('quick','standard','detailed')
     or p_provider is null or length(p_provider) < 1 or length(p_provider) > 80
     or p_input_tokens is null or p_input_tokens < 0
     or p_output_tokens is null or p_output_tokens < 0
     or p_reservation_id is null then
    raise exception 'Invalid usage reservation parameters' using errcode = '22023';
  end if;

  -- Serialize reservations for one user and billing month so parallel requests
  -- cannot both consume the final credit.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_period, 0));

  if exists(select 1 from public.usage_ledger where reservation_id = p_reservation_id) then
    return true;
  end if;

  insert into public.nova_usage_monthly(user_id, period, plan, limit_credits, used_credits)
  values (p_user_id, p_period, p_plan, p_limit, 0)
  on conflict (user_id, period) do nothing;

  select used_credits, limit_credits
    into v_used, v_limit
    from public.nova_usage_monthly
   where user_id = p_user_id and period = p_period
   for update;

  -- Never silently increase an existing monthly limit from an API request.
  if v_limit <> p_limit then
    raise exception 'Monthly credit limit changed; reconcile entitlement first' using errcode = '22023';
  end if;

  if v_used >= v_limit then
    return false;
  end if;

  update public.nova_usage_monthly
     set used_credits = used_credits + 1, plan = p_plan, updated_at = clock_timestamp()
   where user_id = p_user_id and period = p_period;

  insert into public.usage_ledger(
    reservation_id, user_id, period, plan, mode, provider,
    input_tokens, output_tokens, credits, status
  ) values (
    p_reservation_id, p_user_id, p_period, p_plan, p_mode, p_provider,
    p_input_tokens, p_output_tokens, 1, 'reserved'
  );

  return true;
end;
$$;

revoke all on function public.nova_reserve_usage(uuid,text,text,integer,text,text,integer,integer,uuid) from public, anon, authenticated;
grant execute on function public.nova_reserve_usage(uuid,text,text,integer,text,text,integer,integer,uuid) to service_role;
