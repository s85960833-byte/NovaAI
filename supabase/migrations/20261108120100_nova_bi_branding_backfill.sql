-- Forward-only repair for organizations created before branding was introduced.
-- Keep this separate from the already-applied nova_bi_white_label_branding migration.
begin;

insert into public.nova_bi_branding(organization_id,brand_name)
select id,name
from public.nova_bi_organizations
on conflict (organization_id) do nothing;

commit;
