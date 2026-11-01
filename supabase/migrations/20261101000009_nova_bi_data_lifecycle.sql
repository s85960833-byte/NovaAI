-- Audited, owner/admin-only deletion and correct branding timestamps.

grant delete on public.nova_bi_analyses to authenticated;
drop policy if exists nova_bi_analysis_delete_admin on public.nova_bi_analyses;
create policy nova_bi_analysis_delete_admin on public.nova_bi_analyses
for delete to authenticated
using (exists (
  select 1 from public.nova_bi_memberships m
  where m.organization_id = nova_bi_analyses.organization_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role in ('owner','admin')
));

create or replace function public.nova_bi_branding_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.nova_bi_branding_touch_updated_at() from public, anon, authenticated;
drop trigger if exists nova_bi_branding_touch_updated_at on public.nova_bi_branding;
create trigger nova_bi_branding_touch_updated_at
before update on public.nova_bi_branding
for each row execute function public.nova_bi_branding_touch_updated_at();

create or replace function public.nova_bi_audit_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_metadata jsonb;
  v_resource text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authenticated actor required for deletion';
  end if;
  if tg_table_name = 'nova_bi_analyses' then
    v_resource := 'analysis';
    v_metadata := jsonb_build_object('analysis_type', old.analysis_type);
  else
    v_resource := 'dataset';
    v_metadata := jsonb_build_object('name', old.name, 'row_count', old.row_count);
  end if;
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(old.organization_id,v_actor,v_resource||'.deleted',v_resource,old.id,v_metadata);
  return old;
end;
$$;
revoke all on function public.nova_bi_audit_delete() from public, anon, authenticated;

drop trigger if exists nova_bi_analysis_audit_delete on public.nova_bi_analyses;
create trigger nova_bi_analysis_audit_delete
before delete on public.nova_bi_analyses
for each row execute function public.nova_bi_audit_delete();

drop trigger if exists nova_bi_dataset_audit_delete on public.nova_bi_datasets;
create trigger nova_bi_dataset_audit_delete
before delete on public.nova_bi_datasets
for each row execute function public.nova_bi_audit_delete();
