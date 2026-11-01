-- Organization-level white-label branding settings. These customize the workspace UI only;
-- custom domains and replacement of NOVA identity are not configured by this table.

create table if not exists public.nova_bi_branding (
  organization_id uuid primary key references public.nova_bi_organizations(id) on delete cascade,
  brand_name text not null check (char_length(btrim(brand_name)) between 2 and 160),
  tagline text not null default '' check (char_length(tagline) <= 160),
  logo_url text not null default '' check (logo_url = '' or (logo_url ~ '^https://[^[:space:]]+$' and char_length(logo_url) <= 500)),
  primary_color text not null default '#2563EB' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#14B8A6' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nova_bi_branding enable row level security;
revoke all on public.nova_bi_branding from anon, authenticated;
grant select on public.nova_bi_branding to authenticated;
grant update (brand_name, tagline, logo_url, primary_color, accent_color) on public.nova_bi_branding to authenticated;

create policy nova_bi_branding_read_member on public.nova_bi_branding
for select to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_branding.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy nova_bi_branding_update_admin on public.nova_bi_branding
for update to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_branding.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin')
))
with check (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_branding.organization_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
    and m.role in ('owner','admin')
));

create or replace function public.nova_bi_organization_bootstrap_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.created_by <> auth.uid() then
    raise exception using errcode = '42501', message = 'Organization creator must match the authenticated user';
  end if;
  insert into public.nova_bi_memberships(organization_id,user_id,role,status)
  values(new.id,new.created_by,'owner','active');
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(new.id,new.created_by,'organization.created','organization',new.id,jsonb_build_object('name',new.name));
  insert into public.nova_bi_branding(organization_id,brand_name)
  values(new.id,new.name);
  return new;
end;
$$;
revoke all on function public.nova_bi_organization_bootstrap_guard() from public, anon, authenticated;

create index if not exists nova_bi_branding_updated_idx
  on public.nova_bi_branding(updated_at desc);
