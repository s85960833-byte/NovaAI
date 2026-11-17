-- Isolated NOVA 2.0 synthetic staging schema. No production data.
create schema if not exists nova2_staging;

create table if not exists nova2_staging.wallet_accounts (
  synthetic_user_id text primary key check (synthetic_user_id ~ '^synthetic-[a-z0-9-]{1,40}$'),
  balance_credits bigint not null default 0 check (balance_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nova2_staging.wallet_orders (
  order_id text primary key,
  synthetic_user_id text not null references nova2_staging.wallet_accounts(synthetic_user_id),
  pack_id text not null check (pack_id in ('starter','standard','plus')),
  amount_paise bigint not null check (amount_paise > 0),
  credits bigint not null check (credits > 0),
  status text not null check (status in ('created','captured','failed','refunded')),
  created_at timestamptz not null default now()
);
create index if not exists wallet_orders_user_idx
  on nova2_staging.wallet_orders(synthetic_user_id, created_at desc);

create table if not exists nova2_staging.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  synthetic_user_id text not null references nova2_staging.wallet_accounts(synthetic_user_id),
  delta_credits bigint not null check (delta_credits <> 0),
  reason text not null check (reason in ('topup','spend','refund')),
  ref_type text not null,
  ref_id text not null,
  created_at timestamptz not null default now(),
  unique(synthetic_user_id, reason, ref_type, ref_id)
);
create index if not exists wallet_ledger_user_created_idx
  on nova2_staging.wallet_ledger(synthetic_user_id, created_at desc);

create table if not exists nova2_staging.wallet_events (
  event_id text primary key,
  order_id text not null references nova2_staging.wallet_orders(order_id),
  event_type text not null check (event_type in ('payment.captured','payment.failed','refund.processed')),
  payload_hash text not null,
  created_at timestamptz not null default now()
);

create or replace function nova2_staging.apply_wallet_ledger_delta()
returns trigger
language plpgsql
as 'BEGIN
  UPDATE nova2_staging.wallet_accounts
    SET balance_credits = balance_credits + NEW.delta_credits,
        updated_at = now()
    WHERE synthetic_user_id = NEW.synthetic_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION ''WALLET_ACCOUNT_NOT_FOUND'';
  END IF;
  RETURN NEW;
END;';

DROP TRIGGER IF EXISTS wallet_ledger_balance_trigger ON nova2_staging.wallet_ledger;
CREATE TRIGGER wallet_ledger_balance_trigger
  AFTER INSERT ON nova2_staging.wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION nova2_staging.apply_wallet_ledger_delta();

create or replace function nova2_staging.prevent_wallet_ledger_mutation()
returns trigger
language plpgsql
as 'BEGIN
  RAISE EXCEPTION ''WALLET_LEDGER_APPEND_ONLY'';
END;';

DROP TRIGGER IF EXISTS wallet_ledger_no_update ON nova2_staging.wallet_ledger;
CREATE TRIGGER wallet_ledger_no_update
  BEFORE UPDATE OR DELETE ON nova2_staging.wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION nova2_staging.prevent_wallet_ledger_mutation();

create table if not exists nova2_staging.ai_spend_events (
  id uuid primary key default gen_random_uuid(),
  actor_key text not null check (
    actor_key ~ '^synthetic-[a-z0-9-]{1,40}$'
    or actor_key ~ '^[0-9a-fA-F-]{36}$'
  ),
  cost_paise bigint not null check (cost_paise >= 0),
  status text not null check (status in ('reserved','settled','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_spend_daily_idx
  on nova2_staging.ai_spend_events(created_at, actor_key);
