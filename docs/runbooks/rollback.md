# Staging Rollback Runbook

## Scope and guardrails
This runbook targets only Render service \`nova-2-staging\` (\`srv-dbu3b63l550s739qet70\`). Never use it for Production service \`srv-dbidhpc9v7es73d6ia80\`, branch \`main\`, production Supabase or real user data.

## Last observed staging deploys
- Last confirmed Live: \`dep-dbu78el6e07s73c17b80\`, SHA \`5cf3ed56e92e239945ae476ca40537a8bedb1aab\`.
- Previous confirmed Live before that: \`dep-dbu760jrjlhs73af6190\`, SHA \`3098a4aa6d98105da930c513894089b949be10b2\`.
- Source tested by CI #513: \`5976ef98927977ebd93ae1a47b0f83ce4ab89e6b\`; Render did not confirm this SHA Live during this verification.

## Rehearsal procedure (manual Render Dashboard, staging only)
Target: under 5 minutes from selecting a previous deployment until that deployment reports Live.

1. Open Render Dashboard → \`nova-2-staging\` → Events / Deploys.
2. Record current deploy ID, SHA and start time.
3. Select the previous known-good staging deployment listed in Events / Deploys (at report time: \`dep-dbu760jrjlhs73af6190\`).
4. Use Render's Rollback action if available. Start a stopwatch at the click.
5. Wait for deployment state Live. Record elapsed time, resulting deploy ID and SHA.
6. Open \`https://nova-2-staging.onrender.com/api/health\`; verify HTTP 200 and ready status.
7. Run only synthetic smoke checks: Darbar home, Sakha mock, Diwan mock and mock wallet.
8. Record timestamps, elapsed time, health proof and screenshot/recording in PR #103.

## Actual rehearsal result

**NOT VERIFIED — no rollback was executed.** The Render connection available in this session can list services/deploys, read deploy status/logs and inspect configuration, but it does not expose rollback-to-specific-deploy or a service branch/commit selector. A manual Render Dashboard action is required; therefore no elapsed time, restored SHA or post-rollback health is fabricated.

CI #513's 24 read-only GET requests verified the staging health endpoint and homepage before any rollback. This is not a rollback rehearsal and does not satisfy the under-5-minute recovery target.

## Fallback
If the Dashboard has no rollback action, select the previous known-good commit only through a safe staging-only redeploy mechanism. Do not change `main`, production service or production database. For DB changes, use a fresh isolated test database and forward-only migrations; never restore over production.

Production rollback: NOT RUN and NOT AUTHORISED.
