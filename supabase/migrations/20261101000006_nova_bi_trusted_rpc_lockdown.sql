-- Lock down earlier client-callable SECURITY DEFINER overloads.
revoke all on function public.nova_bi_create_organization(text) from public, anon, authenticated;
revoke all on function public.nova_bi_decide_workflow(uuid, text, text) from public, anon, authenticated;

-- Trusted server-only organization bootstrap.
create or replace function public.nova_bi_create_organization(p_name text, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if p_actor_id is null or not exists (select 1 from auth.users u where u.id = p_actor_id) then
    raise exception using errcode = '42501', message = 'A valid authenticated actor is required';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 160 then
    raise exception using errcode = '22023', message = 'Organization name must be 2 to 160 characters';
  end if;
  insert into public.nova_bi_organizations(name, created_by) values (v_name, p_actor_id) returning id into v_org_id;
  insert into public.nova_bi_memberships(organization_id, user_id, role, status) values (v_org_id, p_actor_id, 'owner', 'active');
  insert into public.nova_bi_audit_events(organization_id, actor_id, event_type, resource_type, resource_id, metadata_json)
  values (v_org_id, p_actor_id, 'organization.created', 'organization', v_org_id, jsonb_build_object('name', v_name));
  return v_org_id;
end;
$$;
revoke all on function public.nova_bi_create_organization(text, uuid) from public, anon, authenticated;
grant execute on function public.nova_bi_create_organization(text, uuid) to service_role;

-- Trusted server-only workflow decision with separation-of-duties checks.
create or replace function public.nova_bi_decide_workflow(p_proposal_id uuid,p_decision text,p_note text,p_actor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_org_id uuid; v_creator uuid; v_status text; v_role text;
begin
  if p_actor_id is null or not exists (select 1 from auth.users u where u.id = p_actor_id) then
    raise exception using errcode = '42501', message = 'A valid authenticated actor is required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception using errcode = '22023', message = 'Decision must be approved or rejected'; end if;
  if p_note is not null and char_length(p_note) > 2000 then raise exception using errcode = '22023', message = 'Approval note is too long'; end if;
  select organization_id,created_by,status into v_org_id,v_creator,v_status
    from public.nova_bi_workflow_proposals where id=p_proposal_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Workflow proposal not found'; end if;
  select role into v_role from public.nova_bi_memberships
    where organization_id=v_org_id and user_id=p_actor_id and status='active';
  if v_role is null or v_role not in ('owner','admin') then raise exception using errcode = '42501', message = 'Active organization owner or admin role required'; end if;
  if v_creator=p_actor_id then raise exception using errcode = '42501', message = 'Proposal creator cannot approve their own proposal'; end if;
  if v_status<>'proposed' then raise exception using errcode = '55000', message = 'Only proposed workflows can receive a decision'; end if;
  insert into public.nova_bi_workflow_approvals(organization_id,proposal_id,actor_id,decision,note)
  values(v_org_id,p_proposal_id,p_actor_id,p_decision,nullif(btrim(p_note),''));
  update public.nova_bi_workflow_proposals set status=p_decision,updated_at=now() where id=p_proposal_id;
  insert into public.nova_bi_audit_events(organization_id,actor_id,event_type,resource_type,resource_id,metadata_json)
  values(v_org_id,p_actor_id,'workflow.'||p_decision,'workflow_proposal',p_proposal_id,
         jsonb_build_object('decision',p_decision,'note',nullif(btrim(p_note),'')));
  return true;
end;
$$;
revoke all on function public.nova_bi_decide_workflow(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.nova_bi_decide_workflow(uuid,text,text,uuid) to service_role;
