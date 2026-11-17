# NOVA 2.0 Staging Setup — Owner Handover

**Never use the production Supabase project or production Render service.**

## Supabase test project
A separate free project is required. The organization must be explicitly selected by the owner; do not guess.

1. Open the Supabase Dashboard.
2. Select the organization you choose for NOVA 2.0 staging.
3. Select New project.
4. Name it nova-2-staging.
5. Select the Free plan and an India-near region available to that organization.
6. Set a new strong database password. Keep it in your password manager; never paste it into chat or commit it.
7. Wait until the project is ready. Copy the project URL and anon/public key for staging only.
8. Open Storage → Buckets → New bucket. Create private-documents, keep it Private, set the file limit to 8 MB and allow PDF, JPEG, PNG, WebP and plain text.
9. Do not import production data or production migrations.

## Render staging
The branch includes a free-only render.yaml blueprint. Create only a new service named nova-2-staging, branch nova-2.0/rebuild, plan Free, build npm ci && npm run build, start npm run start --workspace @nova/api, health path /api/health. Do not select or edit the production service.

## Environment variables
Use only the new staging project:
- APP_BASE_URL: exact staging URL shown by Render.
- SUPABASE_URL: new staging project URL.
- SUPABASE_ANON_KEY: new staging project's anon/public key.
- DATABASE_URL: connection string for the new staging project's database, stored only in Render secret environment settings.
- MOCK_FEATURES_ENABLED=true; AI_PROVIDER=mock; AI_KILL_SWITCH=true.
- Edge Function secrets in the new Supabase project only: SUPABASE_SERVICE_ROLE_KEY, PRIVATE_FILE_BUCKET=private-documents, APP_BASE_URL and CRON_SECRET. Never put the service-role key in Render or browser variables.

## Deployment guard
Do not run supabase db push, supabase link or any command with --remote until the selected staging project ref has been verified. Current CI uses only local Supabase CLI commands. Production remains read-only.