# Database Migration Policy

- NOVA 2.0 schema, migrations and Edge Functions live only under supabase-v2/.
- Existing supabase/ migrations belong to NOVA 1.0 / NOVA Business Intelligence. Do not edit, copy, replay, reset or deploy them as part of this rebuild.
- Apply SQL only to the new isolated Supabase test project, never production.
- Reconcile the three NOVA 1.0 migration timestamp discrepancies from the Phase 0 report separately; do not copy or replay legacy migrations blindly.
- Use the Supabase CLI to create each timestamped migration. Never invent migration filenames or edit an already-applied migration.
- Use additive expand migrations first. Do not drop/rename legacy columns or tables in Phases 1–6.
- Every migration must be tested against a disposable local synthetic database and reviewed before staging application.
- Capture the schema version before and after each staging migration.
- No production schema diff, migration, backup or data copy is authorised in this phase.
