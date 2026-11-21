# NOVA 2.0 Rollback Runbook

## Safety boundary

- Staging service: `nova-2-staging`, `srv-dbu3b63l550s739qet70`.
- Staging URL: https://nova-2-staging.onrender.com
- Production service: `NovaAI`, `srv-dbidhpc9v7es73d6ia80`, https://novaai-4auo.onrender.com
- Never change `main`, production environment variables, production Supabase, production data or payment credentials during a staging rehearsal.
- Never force-push. All rehearsal commits must be fast-forward commits on `nova-2.0/rebuild`.

## Staging rollback rehearsal — procedure

**Status: NOT YET PERFORMED.** The Render connector can deploy only the service's configured branch; it cannot select a historical deploy ID or a commit SHA directly. The staging service auto-deploys commits from `nova-2.0/rebuild`, so use a revert commit and then a revert-of-revert.

1. First require the ordinary PR CI and database job to be fully green on the exact branch head. Confirm the staging service is still attached to `nova-2.0/rebuild`.
2. Record the current branch head SHA, current Render Live deployment ID/SHA, and UTC start time. Identify the previous known-good source tree from the last confirmed Live deployment.
3. Create a new commit whose parent is the current branch head and whose file tree matches the previous known-good staging tree. Use commit message `revert: staging rollback rehearsal to previous known-good source`. Advance the branch with a normal fast-forward update; do not reset or force-push.
4. Start the timer at the branch update. Wait until Render reports the revert commit Live. Record deploy ID, source SHA/tree, startedAt, finishedAt and elapsed minutes.
5. Verify `https://nova-2-staging.onrender.com/api/health` returns HTTP 200 with `ok=true` and `ready=true`. Verify the homepage and `/perf` route; run only synthetic Sakha/Diwan/mock-wallet checks.
6. Create a second normal commit whose parent is the rollback commit and whose tree matches the exact pre-rehearsal branch head. Message: `revert: restore NOVA 2.0 staging head after rollback rehearsal`.
7. Wait for the second deployment to become Live. Verify the deployed source tree again matches the pre-rehearsal head; repeat health/homepage/`/perf` checks and record elapsed time.
8. Save actual deploy IDs, SHAs, UTC timestamps, elapsed timings and health response in this runbook. The target is under five minutes; never invent a result.

**Actual staging rehearsal result:** NOT VERIFIED. No rollback or revert-of-revert has yet been executed, so no elapsed time or restored SHA is claimed.

## Production rollback — NOT VERIFIED; owner/operator only

The production Render service currently uses branch `main`; its last observed Live deployment was `dep-dbom7bbm8hqs73ec2gi0`, source SHA `c3cee61906b88ff111b3a645db55c9c2503cd8f7` (9 November 2026). Production health-check path is currently unset.

When an authorised production operator is handling a real incident, the dashboard sequence is:

1. Open Render Dashboard → workspace → **NovaAI** service: https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80.
2. Open **Events** / **Deploys** and identify the last known-good production deployment by deploy ID and commit SHA. Do not guess from the deployment order.
3. Open that deployment's action menu and choose Render's **Rollback** action if it is offered; review the target service and SHA before confirming. If the dashboard presents only redeploy-by-commit, select the recorded known-good SHA instead.
4. Wait until Render reports the selected deployment **Live**. Record the new deploy ID, SHA, start/end UTC timestamps and elapsed time.
5. Verify the production homepage and the operator-approved production smoke checks; inspect Render request/application logs. Do not assume `/api/health` is configured: production health-check path is empty.
6. If the dashboard does not expose the rollback action, stop and use Render's current dashboard-supported deployment procedure with an authorised operator. Do not experiment with production commits or environment changes.

**Production rollback status: NOT VERIFIED and NOT PERFORMED.** It is listed as an owner-required release task in `docs/OWNER_TASKS.md`. No production action is authorised by this runbook.
