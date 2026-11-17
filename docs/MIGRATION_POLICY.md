# Database Migration Policy

- Apply SQL only to the new isolated Supabase test project, never to production.
- Reconcile the three NOVA 1.0 migration timestamp mismatches from the Phase 0 report separately; do not copy or replay legacy migrations blindly.
- Use additive expand migrations first. Do not drop/rename legacy columns or tables in Phases 1–6.
- Every migration must be idempotent where practical, reviewed, and tested against a disposable synthetic database.
- Capture the schema version before and after each staging migration.
- No production schema diff, migration, backup or data copy is authorised in this phase.
