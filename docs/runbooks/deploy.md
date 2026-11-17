# Staging Deploy Runbook

1. Confirm the target branch is `nova-2.0/rebuild`.
2. Confirm the Render resource is named NOVA 2.0 staging and uses the Free plan only.
3. Confirm its environment contains no production secrets or production URLs.
4. Confirm the database URL belongs only to the synthetic test project.
5. Deploy only after CI is green.
6. The Free plan does not support Render pre-deploy commands. The service start command therefore runs the idempotent `db:migrate:staging` step before the API process starts; if it fails, the service must remain unhealthy and the last successful deploy should be retained.
7. Verify `/api/health` returns HTTP 200 and shows database as configured only after the isolated test DB is connected.
8. Test Hindi/English shell and mobile widths.
9. If any check fails, leave the deployment as staging-only and do not promote or merge to `main`.

Free Render services can sleep and free Render Postgres expires; they are temporary test infrastructure, not production hosting.
