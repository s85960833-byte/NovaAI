# NOVA Business Intelligence — Engineering Progress

Updated: 8 November 2026

## Current authoritative candidate

- Unified candidate: [Draft PR #74](https://github.com/s85960833-byte/NovaAI/pull/74), branch `feature/nova-integrated-release-clean-20261108`.
- Candidate head at this checkpoint: `f624efc97f05666a4aeabe810246bd2183f0a844`. Exact-head CI run [#42452844700](https://github.com/s85960833-byte/NovaAI/actions/runs/42452844700) is queued/running; do not treat it as passed until GitHub reports completed success.
- PR #74 remains Open, Draft, unmerged and undeployed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`.
- Superseded PR #73 remains historical only. PR #46 and BI-only PR #67 are predecessors, not release targets.

## Candidate functionality

- Browser-local CSV import, bounded at 5 MB / 20,000 rows / 100 columns, with source-row evidence and invalid-row accounting.
- Cost/spend review, client contribution analysis, team-level task indicators, heuristic project-risk scoring, assumption-based scenarios, workflow proposals and Action Proof export.
- Authenticated Company Cloud with organization membership, invitations, role checks, dataset/analysis metadata, workflow approval, audit reads, branding and export.
- Raw CSV rows remain in the browser; cloud persistence contains metadata, aggregates, assumptions and evidence only.
- Workflow items are approval-gated proposals; no external company system is changed or automated.
- Project risk is a heuristic, not a calibrated probability. Scenario outputs are assumptions, not forecasts or guaranteed savings. Productivity metrics are team-level, not individual employee rankings.

## Recent candidate fixes in this audit

- Existing-account invitations now fail closed when the account email is not confirmed; the UI cannot create an invitation that the invitee cannot accept through an unconfirmed account.
- Historical migration immutability was restored: branding backfill moved to `20261108120100_nova_bi_branding_backfill.sql`; rate-limit search_path hardening remains in its separate forward migration instead of modifying the already-applied base migration.
- PostgreSQL RLS integration now exercises the branding backfill repair; the static check asserts the historical rate-limit migration remains unchanged and the forward migration applies the hardening.
- Earlier fixes cover bounded request parsing, exact-origin candidate CORS, retryable invitation lookup errors, safe handling of stale resources, default branding bootstrap, missing-branding reads and CSV column limits.

## Automated verification

Candidate CI is configured to run syntax/security checks, PostgreSQL 17 migration/RLS integration, Deno type-check and CORS/invitation tests, BI calculations/CSV tests, dependency audit, local runtime/PWA smoke, Chromium Company Cloud browser flows and responsive viewport/drawer checks. CI does not establish live production behavior.

The most recent completed exact-head run before the current migration-immutability update is [#42452638922](https://github.com/s85960833-byte/NovaAI/actions/runs/42452638922) on `91bd7ca6f5234013b0369cc86c8810817b14d0ce`; it completed successfully. It included the existing-account email-confirmation guard. The current head's exact-head run is [#42452844700](https://github.com/s85960833-byte/NovaAI/actions/runs/42452844700), which must be checked before relying on the new migration changes.

## Live production findings — read-only

- Supabase project `qrfwsewppafhxibdboam`: 12 recorded migrations, 10 `nova_bi_*` tables, all with RLS enabled; current company/user/analysis tables are empty.
- Security Advisor and Health Advisor returned no findings at last inspection.
- Live `nova-bi-api` is ACTIVE v13 with JWT verification, but deployed source still has wildcard CORS. Candidate exact-origin CORS is not live.
- Live audit SELECT policy still permits all active members; candidate migration narrows it to owners/admins.
- Live `nova_bi_consume_rate_limit` still has `search_path=public, pg_temp`; its execute ACL is limited to postgres/service_role.
- Live migration timestamps differ from the local historical filenames. Source lineage has been traced and historical files restored, but remote migration repair has not been executed. See `SUPABASE_MIGRATION_RECONCILIATION.md`.
- No real Auth/SMTP signup, confirmation, reset or invitation delivery test has been completed.

## Remaining release blockers

1. Reconcile remote migration history safely; then apply only reviewed forward migrations with explicit project-owner approval.
2. Deploy the candidate Edge Function and verify exact-origin CORS/auth against the real NOVA origin.
3. Verify Auth Site URL/redirect allow-list, custom SMTP, signup/confirmation/resend/reset, invitations and two-real-account tenant isolation.
4. Complete physical Android touch, accessibility and performance checks; Chromium screenshots are not a physical-device test.
5. Complete backup/restore, retention/deletion, member/invitation revocation, account/organization deletion, privacy and incident-response procedures.
6. Review CSP tightening, Render health checks, hosting plan, region/latency and branch protection.
7. Complete live Render/provider/image smoke after an approved deployment.

**Release decision: NO-GO** for paid sales, production onboarding, confidential company data or SLA/availability promises. Only clearly disclosed, non-sensitive concept feedback is appropriate until every gate is verified and approved.
