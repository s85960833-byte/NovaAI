# Rollback Runbook (Staging Only)

## Triggers
- CI regression, failed health check, data isolation issue, unexpected secret exposure, failed migration, severe mobile layout break or unexpected provider spend.

## Staging rollback
1. Stop the current staging deploy from further testing.
2. In Render Dashboard, open the NOVA 2.0 staging service → Events/Deploys → select the last known-good staging deploy → Rollback.
3. Recheck the staging health endpoint and smoke tests.
4. Record the failing commit, deploy ID, evidence and fix in `docs/BUILD_STATE.md`.

## Production
Production is explicitly out of scope for Phases 1–6. Do not open or change the production service. A production rollback procedure will be reviewed in Phase 7 only; no live changes are permitted without exact `APPROVE RELEASE`.
