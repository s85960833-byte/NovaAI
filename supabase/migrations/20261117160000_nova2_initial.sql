-- NOVA 2.0 initial schema. Apply ONLY to a separate synthetic staging project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'hi' check (language in ('hi','en')),
  theme text not null default 'midnight' check (theme in ('midnight','ivory')),
  legacy_nova1_id text unique,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  minister text not null default 'sakha' check (minister in ('sakha','diwan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_created_idx on public.messages(chat_id,created_at);
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  mime text not null,
  size_bytes bigint not null check (size_bytes between 0 and 8000000),
  storage_key text not null,
  consent_at timestamptz not null,
  expires_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_credits bigint not null default 0 check (balance_credits >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_credits bigint not null check (delta_credits <> 0),
  reason text not null check (reason in ('topup','spend','refund','gift','adjustment')),
  ref_type text not null,
  ref_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id,reason,ref_type,ref_id)
);
create table if not exists public.mock_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_order_id text not null unique,
  amount_paise bigint not null check (amount_paise > 0),
  status text not null check (status in ('created','captured','failed','refunded')),
  event_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  input_units bigint not null default 0,
  output_units bigint not null default 0,
  cost_paise bigint not null default 0 check (cost_paise >= 0),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.diwan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('paper_reader','scam_check','rti','complaint','scheme_match')),
  status text not null default 'queued' check (status in ('queued','processing','complete','failed','expired')),
  input_ref text,
  output_json jsonb,
  pdf_key text,
  credits_charged integer not null default 0 check (credits_charged >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create table if not exists public.schemes (
  id text primary key,
  name_en text not null,
  name_hi text not null,
  level text not null check (level in ('central','state')),
  state text,
  tags text[] not null default '{}',
  eligibility_json jsonb not null default '{}',
  benefits text not null,
  how_to_apply text[] not null default '{}',
  documents_required text[] not null default '{}',
  official_url text not null check (official_url like 'https://%'),
  last_verified date not null,
  status text not null check (status in ('active','closed','unknown'))
);
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rollout_pct integer not null default 0 check (rollout_pct between 0 and 100),
  updated_at timestamptz not null default now()
);

-- User-owned tables: enable RLS and restrict reads to the authenticated owner.
do $$
declare t text;
begin
  foreach t in array array['profiles','chats','messages','files','wallets','ledger_entries','mock_payments','usage_events','diwan_jobs'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "chats_owner_all" on public.chats for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages_owner_all" on public.messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "files_owner_select" on public.files for select to authenticated using (user_id = auth.uid());
create policy "wallet_owner_select" on public.wallets for select to authenticated using (user_id = auth.uid());
create policy "ledger_owner_select" on public.ledger_entries for select to authenticated using (user_id = auth.uid());
create policy "payments_owner_select" on public.mock_payments for select to authenticated using (user_id = auth.uid());
create policy "usage_owner_select" on public.usage_events for select to authenticated using (user_id = auth.uid());
create policy "diwan_jobs_owner_select" on public.diwan_jobs for select to authenticated using (user_id = auth.uid());

-- Ledger rows are append-only: clients receive no UPDATE/DELETE policy.
revoke update,delete on public.ledger_entries from authenticated;
revoke insert,update,delete on public.wallets from authenticated;
-- Global reference tables are readable but writable only by privileged server-side tooling.
alter table public.schemes enable row level security;
create policy "schemes_public_read" on public.schemes for select to anon,authenticated using (true);
alter table public.audit_log enable row level security;
alter table public.feature_flags enable row level security;
