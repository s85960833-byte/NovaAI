-- Make the intentionally server-only boundary explicit to the security linter and future reviewers.
create policy nova_bi_rate_limits_deny_client_access
on public.nova_bi_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
