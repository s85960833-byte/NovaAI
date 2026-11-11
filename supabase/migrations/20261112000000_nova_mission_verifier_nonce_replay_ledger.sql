-- Persistent verifier nonce replay protection.
-- The nonce insert and proof persistence/completion run in one PostgreSQL transaction:
-- if proof validation or completion fails, the nonce reservation rolls back too.

create table if not exists public.nova_mission_verifier_nonce_ledger (
  verifier_id text not null
    check (char_length(btrim(verifier_id)) between 1 and 80),
  verifier_nonce uuid not null,
  run_id uuid not null,
  consumed_at timestamptz not null default now(),
  primary key (verifier_id, verifier_nonce)
);

comment on table public.nova_mission_verifier_nonce_ledger is
  'Append-only replay ledger for signed NOVA verifier requests; nonce uniqueness is scoped to verifier identity.';

alter table public.nova_mission_verifier_nonce_ledger enable row level security;
revoke all on public.nova_mission_verifier_nonce_ledger
  from public, anon, authenticated, service_role;
grant insert on public.nova_mission_verifier_nonce_ledger to service_role;

create or replace function public.nova_persist_mission_proof_and_complete_with_nonce(
  p_run_id uuid,
  p_worker_id text,
  p_lease_token uuid,
  p_envelope jsonb,
  p_evidence_digest text,
  p_summary text,
  p_verifier_id text,
  p_verifier_nonce uuid
)
returns table (proof_id uuid, attestation_id uuid, completion_status text)
language plpgsql
security invoker
set search_path = ''
as $nonce$
begin
  if current_user <> 'service_role'
     or coalesce(pg_catalog.current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Verifier nonce consumption is restricted to the trusted server role'
      using errcode = '42501';
  end if;

  if p_run_id is null or p_verifier_nonce is null
     or p_verifier_id is null
     or p_envelope->>'verifier_id' is distinct from p_verifier_id then
    raise exception 'Verifier nonce binding is invalid' using errcode = '23514';
  end if;

  -- The primary key makes nonce consumption atomic across concurrent requests.
  -- A duplicate nonce raises 23505. No nonce is consumed if the nested proof
  -- persistence/completion call fails, because the entire RPC transaction rolls back.
  insert into public.nova_mission_verifier_nonce_ledger(verifier_id, verifier_nonce, run_id)
  values (p_verifier_id, p_verifier_nonce, p_run_id);

  return query
    select persisted.proof_id, persisted.attestation_id, persisted.completion_status
      from public.nova_persist_mission_proof_and_complete(
        p_run_id, p_worker_id, p_lease_token, p_envelope, p_evidence_digest, p_summary
      ) as persisted;
end;
$nonce$;

revoke all on function public.nova_persist_mission_proof_and_complete_with_nonce(
  uuid,text,uuid,jsonb,text,text,text,uuid
) from public, anon, authenticated;
grant execute on function public.nova_persist_mission_proof_and_complete_with_nonce(
  uuid,text,uuid,jsonb,text,text,text,uuid
) to service_role;
