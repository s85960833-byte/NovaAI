# Nova AI — Central feedback storage (free setup)

Nova keeps a local copy of feedback on the device. Central storage is optional and remains disabled until both server-only Render variables are configured.

## Supabase free-plan check (31 Oct 2026)

The current official Supabase documentation lists two active free projects, 500 MB database size per project, 50,000 monthly active users, 1 GB storage, 500,000 Edge Function invocations, and 5 GB cached plus 5 GB uncached egress. This small feedback table should fit comfortably at low volume, but check the dashboard usage page and keep the project on Free. Free projects can be paused when inactive; do not upgrade or enable paid add-ons for this feature.

## 1. Create the table

In your Supabase project, open **SQL Editor → New query** and run:

```sql
create table if not exists public.nova_feedback (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('up', 'down', 'report')),
  message text not null check (char_length(message) <= 1600),
  created_at timestamptz not null default now(),
  source text not null default 'nova-ai'
);

alter table public.nova_feedback enable row level security;
revoke all on table public.nova_feedback from anon, authenticated;
grant insert on table public.nova_feedback to service_role;
```

Do not create a public SELECT policy. Feedback is inserted only by Nova's server using the service-role secret.

## 2. Add server-only variables in Render

Open the Nova AI web service → **Environment** → add:

- `SUPABASE_URL`: Project URL from Supabase → Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`: the service_role secret from the same API page.

Save changes and let Render redeploy. Never paste the service-role secret into the browser, GitHub files, or chat.

## 3. Verify

Submit a thumbs-up/down or report from Nova. The device keeps its local fallback regardless. When Supabase is configured, the server writes to `public.nova_feedback`; otherwise it safely returns to local-only storage. Check the table in Supabase Table Editor.

**No payment method, paid plan, or Supabase client key is needed for this server-side insert.**
