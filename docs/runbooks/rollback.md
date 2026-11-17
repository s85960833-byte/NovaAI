# Staging Rollback Runbook

## Scope
This runbook is for the isolated NOVA 2.0 staging service only. It must never target production or NOVA 1.0.

## Staging rollback steps
1. Record the failing staging deploy ID, deployed SHA, timestamp and failing health/log evidence.
2. Open Render Dashboard → \`nova-2-staging\` → Events / Deploys.
3. Select the last known-good staging deploy and use Render's rollback action if it is available for that deploy.
4. Confirm the rollback deploy reaches Live; verify \`/api/health\`, Sakha mock, Diwan mock and mock-wallet endpoints.
5. Compare the deployed SHA with the recorded last-known-good SHA.
6. If rollback is unavailable, redeploy the last known-good commit from \`nova-2.0/rebuild\`; do not alter \`main\`.
7. For database changes, use a fresh isolated test database and forward-only migration. Do not restore over production or attempt destructive schema rollback.
8. Record the rehearsal in \`docs/GATE_EVIDENCE.md\` with deploy IDs and command output.

## Rehearsal status
- Staging deploy: PASS — \`nova-2-staging\` is Live on candidate SHA \`3098a4aa6d98105da930c513894089b949be10b2\`.
- Staging health: PASS — Render logs show \`/api/health\` HTTP 200 after migration and API startup.
- Render hosted rollback: NOT VERIFIED — the available Render connection exposes no rollback action; no rollback was simulated or claimed.
- CI synthetic schema backup/restore: pending GitHub Actions run #421 database job.
- Production rollback: NOT RUN and NOT AUTHORISED.
