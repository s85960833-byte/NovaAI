-- Forward-only hardening for databases where the original rate-limit migration is already applied.
-- Keep this as a separate migration: editing an applied migration does not change live databases.
begin;

alter function public.nova_bi_consume_rate_limit(uuid, text, integer, integer)
  set search_path = '';

revoke all on function public.nova_bi_consume_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.nova_bi_consume_rate_limit(uuid, text, integer, integer)
  to service_role;

commit;
