-- Append-only records of trusted verifier attestations for inspectable mission proof.
-- These records do not themselves complete tasks or start execution.

create unique index if not exists nova_mission_proofs_attestation_identity_uidx
  on public.nova_mission_proofs(id, mission_id, task_id, owner_id);
create unique index if not exists nova_mission_runs_attestation_identity_uidx
  on public.nova_mission_execution_runs(id, mission_id, task_id, owner_id);

create table if not exists public.nova_mission_proof_attestations (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null,
  mission_id uuid not null,
  task_id uuid not null,
  run_id uuid not null,
  owner_id uuid not null,
  verifier_id text not null
    check (char_length(btrim(verifier_id)) between 1 and 80),
  verifier_version text not null
    check (char_length(btrim(verifier_version)) between 1 and 40),
  canonicalization_version text not null default 'nova.cjson.v1'
    check (canonicalization_version = 'nova.cjson.v1'),
  evidence_digest text not null
    check (evidence_digest ~ '^[0-9a-f]{64}$'),
  envelope_json jsonb not null
    check (jsonb_typeof(envelope_json) = 'object'
      and octet_length(envelope_json::text) <= 50000),
  outcome text not null check (outcome in ('passed','failed')),
  check_count integer not null check (check_count between 1 and 50),
  observed_at timestamptz not null,
  attested_at timestamptz not null default now(),
  unique (proof_id, verifier_id, verifier_version, evidence_digest),
  foreign key (proof_id, mission_id, task_id, owner_id)
    references public.nova_mission_proofs(id, mission_id, task_id, owner_id)
    on delete cascade,
  foreign key (run_id, mission_id, task_id, owner_id)
    references public.nova_mission_execution_runs(id, mission_id, task_id, owner_id)
    on delete cascade,
  check (envelope_json->>'schema_version' = 'nova.proof.v1'),
  check (envelope_json->>'mission_id' = mission_id::text),
  check (envelope_json->>'task_id' = task_id::text),
  check (envelope_json->>'run_id' = run_id::text),
  check (envelope_json->>'verifier_id' = verifier_id),
  check (envelope_json->>'verifier_version' = verifier_version),
  check (envelope_json->>'outcome' = outcome),
  check (jsonb_typeof(envelope_json->'checks') = 'array'
    and jsonb_array_length(envelope_json->'checks') = check_count)
);

create index if not exists nova_mission_proof_attestations_owner_idx
  on public.nova_mission_proof_attestations(owner_id, attested_at desc);
create index if not exists nova_mission_proof_attestations_mission_idx
  on public.nova_mission_proof_attestations(mission_id, task_id, attested_at desc);

alter table public.nova_mission_proof_attestations enable row level security;
revoke all on public.nova_mission_proof_attestations from public, anon, authenticated;
grant select on public.nova_mission_proof_attestations to authenticated;
grant select, insert on public.nova_mission_proof_attestations to service_role;

drop policy if exists nova_mission_proof_attestations_select_own
  on public.nova_mission_proof_attestations;
create policy nova_mission_proof_attestations_select_own
  on public.nova_mission_proof_attestations
  for select to authenticated using (owner_id = (select auth.uid()));

-- A trusted verifier may attest only a matching proof for a task/run that has
-- actually been claimed. The envelope's digest is re-computable by offline auditors.
create or replace function public.nova_validate_mission_proof_attestation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_proof_status text;
  v_proof_verified_at timestamptz;
  v_run_status text;
begin
  select p.verification_status, p.verified_at
    into v_proof_status, v_proof_verified_at
    from public.nova_mission_proofs p
   where p.id = new.proof_id
     and p.mission_id = new.mission_id
     and p.task_id = new.task_id
     and p.owner_id = new.owner_id;
  if not found then
    raise exception 'Attestation proof binding is invalid' using errcode = '23503';
  end if;

  select r.status into v_run_status
    from public.nova_mission_execution_runs r
   where r.id = new.run_id
     and r.mission_id = new.mission_id
     and r.task_id = new.task_id
     and r.owner_id = new.owner_id;
  if not found or v_run_status not in ('running','succeeded') then
    raise exception 'Attestation requires the matching claimed execution run'
      using errcode = '23514';
  end if;

  if v_proof_status is distinct from new.outcome
     or (new.outcome = 'passed' and v_proof_verified_at is null)
     or (new.outcome = 'failed' and v_proof_verified_at is not null) then
    raise exception 'Attestation outcome does not match the task proof record'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.nova_validate_mission_proof_attestation()
  from public, anon, authenticated;
drop trigger if exists nova_mission_proof_attestation_validate
  on public.nova_mission_proof_attestations;
create trigger nova_mission_proof_attestation_validate
  before insert on public.nova_mission_proof_attestations
  for each row execute function public.nova_validate_mission_proof_attestation();

-- App-facing roles have no UPDATE/DELETE/TRUNCATE grants: attestations are append-only.
