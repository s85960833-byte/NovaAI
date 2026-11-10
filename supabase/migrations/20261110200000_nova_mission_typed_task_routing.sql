-- Persist explicit, allowlisted task routing and a versioned input contract.
-- Existing rows remain readable as legacy rows but are never executable by the empty registry.
alter table public.nova_mission_tasks
  add column if not exists task_type text,
  add column if not exists input_schema_version integer;

alter table public.nova_mission_tasks
  drop constraint if exists nova_mission_tasks_typed_input_consistency;
alter table public.nova_mission_tasks
  add constraint nova_mission_tasks_typed_input_consistency check (
    (task_type is null and input_schema_version is null)
    or (
      task_type is not null
      and task_type in (
        'learn.goal_clarification',
        'learn.topic_sequence',
        'learn.practice_material',
        'learn.assessment',
        'learn.progress_summary',
        'build.requirements',
        'build.design_flow',
        'build.implementation',
        'build.quality_checks',
        'build.review_proof',
        'agents.permissions',
        'agents.tool_gates',
        'agents.checklist',
        'agents.approved_steps',
        'agents.verify_outcomes',
        'intelligence.define_metrics',
        'intelligence.inspect_data',
        'intelligence.analyze_drivers',
        'intelligence.recommend_actions',
        'intelligence.verify_evidence'
      )
      and input_schema_version between 1 and 1000
    )
  );

create index if not exists nova_mission_tasks_typed_route_idx
  on public.nova_mission_tasks(task_type, input_schema_version, status)
  where task_type is not null;

create or replace function public.nova_save_mission_plan(
  p_owner_id uuid,
  p_mission_id uuid,
  p_plan_json jsonb,
  p_tasks jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_state text;
  v_task_count integer;
  v_next_event_sequence bigint;
begin
  if current_user <> 'service_role' then
    raise exception 'Mission planning is restricted to the trusted server role'
      using errcode = '42501';
  end if;
  if p_plan_json is null or pg_catalog.jsonb_typeof(p_plan_json) <> 'object'
     or pg_catalog.octet_length(p_plan_json::text) > 100000 then
    raise exception 'Mission plan must be a JSON object up to 100 KB'
      using errcode = '23514';
  end if;
  if p_tasks is null or pg_catalog.jsonb_typeof(p_tasks) <> 'array' then
    raise exception 'Mission tasks must be a JSON array' using errcode = '23514';
  end if;
  v_task_count := pg_catalog.jsonb_array_length(p_tasks);
  if v_task_count < 1 or v_task_count > 20 then
    raise exception 'Mission plan must contain between 1 and 20 tasks' using errcode = '23514';
  end if;

  -- Reject free-form task types, schema versions, and non-object input before writing.
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_tasks) as item(value)
    where pg_catalog.jsonb_typeof(item.value) <> 'object'
       or pg_catalog.char_length(pg_catalog.btrim(coalesce(item.value->>'title',''))) not between 1 and 200
       or (item.value ? 'description' and pg_catalog.jsonb_typeof(item.value->'description') <> 'string')
       or pg_catalog.char_length(coalesce(item.value->>'description','')) > 2000
       or coalesce(item.value->>'task_type','') not in (
         'learn.goal_clarification','learn.topic_sequence','learn.practice_material','learn.assessment','learn.progress_summary',
         'build.requirements','build.design_flow','build.implementation','build.quality_checks','build.review_proof',
         'agents.permissions','agents.tool_gates','agents.checklist','agents.approved_steps','agents.verify_outcomes',
         'intelligence.define_metrics','intelligence.inspect_data','intelligence.analyze_drivers',
         'intelligence.recommend_actions','intelligence.verify_evidence'
       )
       or coalesce(item.value->>'input_schema_version','') !~ '^[1-9][0-9]{0,2}
  ) then
    raise exception 'Mission task type, schema version, title, description or input is invalid'
      using errcode = '23514';
  end if;

  select state into v_state
  from public.nova_missions
  where id = p_mission_id and owner_id = p_owner_id
  for update;
  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;
  if v_state <> 'draft' then
    raise exception 'Only draft missions can receive a starter plan' using errcode = '55000';
  end if;
  if exists (select 1 from public.nova_mission_tasks where mission_id = p_mission_id and owner_id = p_owner_id) then
    raise exception 'Mission already contains tasks' using errcode = '55000';
  end if;

  insert into public.nova_mission_tasks(
    mission_id, owner_id, sequence, title, status, task_type, input_schema_version, input_json
  )
  select p_mission_id, p_owner_id, item.ordinality::integer,
         pg_catalog.btrim(item.value->>'title'), 'planned',
         item.value->>'task_type', (item.value->>'input_schema_version')::integer,
         pg_catalog.jsonb_build_object(
           'description', coalesce(item.value->>'description',''),
           'input', item.value->'input'
         )
  from pg_catalog.jsonb_array_elements(p_tasks) with ordinality as item(value, ordinality);

  update public.nova_missions
  set state = 'planned', plan_json = p_plan_json, version = version + 1, updated_at = pg_catalog.now()
  where id = p_mission_id and owner_id = p_owner_id;

  select coalesce(max(sequence), 0) + 1 into v_next_event_sequence
  from public.nova_mission_events where mission_id = p_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    p_mission_id, p_owner_id, v_next_event_sequence, 'mission.planned', 'draft', 'planned',
    p_owner_id, pg_catalog.jsonb_build_object('task_count', v_task_count, 'plan_type', p_plan_json->>'kind')
  );
  return p_mission_id;
end;
$$;
revoke all on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) to service_role;

       or case
            when coalesce(item.value->>'input_schema_version','') ~ '^[1-9][0-9]{0,2}
  ) then
    raise exception 'Mission task type, schema version, title, description or input is invalid'
      using errcode = '23514';
  end if;

  select state into v_state
  from public.nova_missions
  where id = p_mission_id and owner_id = p_owner_id
  for update;
  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;
  if v_state <> 'draft' then
    raise exception 'Only draft missions can receive a starter plan' using errcode = '55000';
  end if;
  if exists (select 1 from public.nova_mission_tasks where mission_id = p_mission_id and owner_id = p_owner_id) then
    raise exception 'Mission already contains tasks' using errcode = '55000';
  end if;

  insert into public.nova_mission_tasks(
    mission_id, owner_id, sequence, title, status, task_type, input_schema_version, input_json
  )
  select p_mission_id, p_owner_id, item.ordinality::integer,
         pg_catalog.btrim(item.value->>'title'), 'planned',
         item.value->>'task_type', (item.value->>'input_schema_version')::integer,
         pg_catalog.jsonb_build_object(
           'description', coalesce(item.value->>'description',''),
           'input', item.value->'input'
         )
  from pg_catalog.jsonb_array_elements(p_tasks) with ordinality as item(value, ordinality);

  update public.nova_missions
  set state = 'planned', plan_json = p_plan_json, version = version + 1, updated_at = pg_catalog.now()
  where id = p_mission_id and owner_id = p_owner_id;

  select coalesce(max(sequence), 0) + 1 into v_next_event_sequence
  from public.nova_mission_events where mission_id = p_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    p_mission_id, p_owner_id, v_next_event_sequence, 'mission.planned', 'draft', 'planned',
    p_owner_id, pg_catalog.jsonb_build_object('task_count', v_task_count, 'plan_type', p_plan_json->>'kind')
  );
  return p_mission_id;
end;
$$;
revoke all on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) to service_role;

              then (item.value->>'input_schema_version')::integer not between 1 and 1000
            else true
          end
       or pg_catalog.jsonb_typeof(item.value->'input') is distinct from 'object'
       or pg_catalog.jsonb_object_length(item.value->'input') <> 1
       or pg_catalog.jsonb_typeof(item.value->'input'->'description') is distinct from 'string'
       or pg_catalog.char_length(coalesce(item.value->'input'->>'description','')) > 2000
       or pg_catalog.octet_length(coalesce(item.value->'input','{}'::jsonb)::text) > 10000
  ) then
    raise exception 'Mission task type, schema version, title, description or input is invalid'
      using errcode = '23514';
  end if;

  select state into v_state
  from public.nova_missions
  where id = p_mission_id and owner_id = p_owner_id
  for update;
  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;
  if v_state <> 'draft' then
    raise exception 'Only draft missions can receive a starter plan' using errcode = '55000';
  end if;
  if exists (select 1 from public.nova_mission_tasks where mission_id = p_mission_id and owner_id = p_owner_id) then
    raise exception 'Mission already contains tasks' using errcode = '55000';
  end if;

  insert into public.nova_mission_tasks(
    mission_id, owner_id, sequence, title, status, task_type, input_schema_version, input_json
  )
  select p_mission_id, p_owner_id, item.ordinality::integer,
         pg_catalog.btrim(item.value->>'title'), 'planned',
         item.value->>'task_type', (item.value->>'input_schema_version')::integer,
         pg_catalog.jsonb_build_object(
           'description', coalesce(item.value->>'description',''),
           'input', item.value->'input'
         )
  from pg_catalog.jsonb_array_elements(p_tasks) with ordinality as item(value, ordinality);

  update public.nova_missions
  set state = 'planned', plan_json = p_plan_json, version = version + 1, updated_at = pg_catalog.now()
  where id = p_mission_id and owner_id = p_owner_id;

  select coalesce(max(sequence), 0) + 1 into v_next_event_sequence
  from public.nova_mission_events where mission_id = p_mission_id;
  insert into public.nova_mission_events(
    mission_id, owner_id, sequence, event_type, from_state, to_state, actor_id, payload_json
  ) values (
    p_mission_id, p_owner_id, v_next_event_sequence, 'mission.planned', 'draft', 'planned',
    p_owner_id, pg_catalog.jsonb_build_object('task_count', v_task_count, 'plan_type', p_plan_json->>'kind')
  );
  return p_mission_id;
end;
$$;
revoke all on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.nova_save_mission_plan(uuid,uuid,jsonb,jsonb) to service_role;
