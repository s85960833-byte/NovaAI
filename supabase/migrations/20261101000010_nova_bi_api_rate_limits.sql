-- Per-user API throttling. The rate-limit table is server-only; clients cannot inspect or mutate counters.
create table if not exists public.nova_bi_rate_limits (
  user_id uuid not null,
  bucket text not null check (length(bucket) between 1 and 64),
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, bucket)
);

alter table public.nova_bi_rate_limits enable row level security;
revoke all on table public.nova_bi_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.nova_bi_rate_limits to service_role;

create or replace function public.nova_bi_consume_rate_limit(
  p_user_id uuid,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null
     or p_bucket is null or length(p_bucket) < 1 or length(p_bucket) > 64
     or p_limit is null or p_limit < 1 or p_limit > 1000
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit parameters' using errcode = '22023';
  end if;

  insert into public.nova_bi_rate_limits(user_id, bucket, window_started_at, request_count)
  values (p_user_id, p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
  set window_started_at = case
        when public.nova_bi_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then v_now
        else public.nova_bi_rate_limits.window_started_at
      end,
      request_count = case
        when public.nova_bi_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then 1
        else public.nova_bi_rate_limits.request_count + 1
      end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.nova_bi_consume_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.nova_bi_consume_rate_limit(uuid, text, integer, integer) to service_role;
