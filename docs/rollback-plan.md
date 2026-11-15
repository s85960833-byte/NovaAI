# NOVA AI — Release Rollback Plan (Draft)

> Draft only. Production rollback requires explicit owner approval. No rollback or deployment is performed by this document.

## Pre-release safeguards

- Keep Production on its current main deployment until the owner approves the candidate.
- Keep Staging separate; record its commit SHA, deployment id, environment values and Health Check Path before a change.
- Keep a known-good deployment and verified backup/restore path available.
- Apply database migrations only after backup, review and owner approval. Prefer forward-only, backward-compatible migrations; never assume a downgrade is safe.
- Keep risky flags default OFF: account deletion, paid image spend, community providers and billing.

## Rollback triggers

- Health check remains unhealthy after the recovery window.
- Startup failures, elevated 5xx/429 responses, data leakage, RLS regression, authentication bypass or secrets exposed.
- Unexpected provider spend, quota bypass or uncontrolled request volume.
- Broken Android/mobile navigation, legacy chat loss or user-facing data corruption.

## Rollback sequence

1. Declare the incident and stop the release; do not merge or promote further commits.
2. If a feature flag caused the issue, an authorised operator disables only that flag, then confirms the feature fails closed.
3. For application-only regressions, an authorised operator uses Render deployment history to redeploy the last known-good commit after confirming the exact service and environment.
4. For a database issue, stop application writes and use the approved backup/restore plan. Do not blindly reverse a migration or delete data.
5. Verify /health, /version, auth rejection/acceptance, RLS isolation, key routes, mobile behavior and logs.
6. Record old/new SHA, Render deployment id, error evidence, data impact, operator and approval.
7. Keep release NO-GO until an independent review confirms the cause is fixed and all gates pass.

## Post-rollback review

- [ ] Production remained on approved branch and owner-approved deployment.
- [ ] Health, auth and data isolation verified.
- [ ] No account deletion or quota data was lost.
- [ ] Provider spend and alerts reviewed.
- [ ] User impact and privacy escalation assessed by the operator.
- [ ] Follow-up patch is made in a new branch and verified on Staging.
