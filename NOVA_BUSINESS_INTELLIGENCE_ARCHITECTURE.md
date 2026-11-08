## Authoritative production re-audit — 8 November 2026

This status block supersedes older release checkpoints below. Historical entries are retained as audit history only.

- Integrated NOVA UI + Business Intelligence candidate PR #74 and the live-smoke-check correction PR #75 are **merged**. Production `main` is `25de14c7b9c5e44b7a716eaa9ea22ffe63f40c1a`.
- Supabase project `qrfwsewppafhxibdboam` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1`. All 15 migration versions are present, including the three forward migrations: rate-limit search_path hardening, owner/admin-only audit reads and branding backfill.
- Deployed `nova-bi-api` is **ACTIVE v14**, with JWT verification enabled. Direct SQL confirms `nova_bi_consume_rate_limit` has an empty search_path; EXECUTE is denied to `anon` and `authenticated`, and allowed to `service_role`. All 10 NOVA BI tables have RLS enabled; audit SELECT is restricted to active owners/admins.
- Supabase Security and Health Advisors report zero findings. Performance Advisor reports 13 INFO-level unused-index notices; do not drop indexes without workload evidence.
- **Render has not deployed the merged main commit.** Service `srv-dbidhpc9v7es73d6ia80` is configured for branch `main` with auto-deploy enabled, but its newest deployment remains the old production baseline `48e12a68af656b471853ac2a4509da0e3df7ab24`. The main CI run [#42457722518](https://github.com/s85960833-byte/NovaAI/actions/runs/42457722518) failed only at its live-deployment wait: the current site returned HTTP 404 for `/nova-app.js`. Do not claim the merged frontend is live until a new Render deploy is confirmed and the live smoke passes.
- Render remains on the Free plan in Singapore with no configured health-check path. No plan, region, environment-variable or health-check change is authorized by this status update.
- Still unverified: real signup/confirmation/reset and invitation email delivery, Auth Site URL/redirect allow-list and custom SMTP, two-real-account tenant isolation on live Auth, physical Android touch/accessibility/performance, backup/restore drill, privacy/retention/account deletion and incident response, full membership/invitation revocation, CSP tightening, and GitHub branch protection (`main.protected=false`, no rulesets).
- The app's general chat/settings/history remain browser-local; general NOVA account-backed chat sync and paid billing/entitlement enforcement are not established. BI CSV raw rows remain browser-local; workflow items are proposals, not external action execution; risk scores are heuristics; exports are capped at 100 latest records.
- **Release decision: NO-GO for paid customer onboarding, confidential company data, SLA/availability promises or production-readiness claims.** Automated browser tests are not a physical Android test. Do not describe the new UI as live until Render deploy and production smoke pass.

---

# NOVA Business Intelligence — Current Architecture

**Status:** Isolated feature branch; authenticated cloud metadata and analysis storage are implemented on the approved Supabase project. This is not yet a production release or enterprise certification.

## Deployment boundaries
- Application repository: `s85960833-byte/NovaAI`.
- Unified implementation candidate: clean `feature/nova-integrated-release-clean-20261108` (Draft PR [#74](https://github.com/s85960833-byte/NovaAI/pull/74); PR #73 is a superseded historical candidate).
- Production branch: `main` (unchanged).
- Supabase project: `qrfwsewppafhxibdboam` (approved NOVA BI project; separate from Research-to-Code).
- Supabase Edge Function: `nova-bi-api`, JWT verification enabled.
- Render production service remains unchanged until a separately approved release.

## Runtime request flow
1. Browser uses the Supabase publishable key only; no service-role key is shipped to the browser.
2. Supabase Auth creates/signs in users and supplies the bearer access token.
3. The `nova-bi-api` Edge Function runs with user authentication and derives the user ID from verified JWT claims.
4. Normal database reads/writes use the user-scoped Supabase client so Postgres RLS applies.
5. Privileged invitation and roster operations use the server-side admin client only after an explicit active owner/admin membership check.
6. Database triggers enforce organization bootstrap, invited-user acceptance, workflow approval separation and audit writes.
7. Every tenant-owned API query includes the requested organization ID and relies on RLS as an independent boundary. The Edge Function also applies 120 requests/user/minute and 5 invitations/user/hour; the rate-limit table and function are server-only.

## Persisted data
Ten NOVA BI tables are deployed with RLS enabled (nine tenant tables plus one server-only rate-limit table):
- `nova_bi_organizations`
- `nova_bi_memberships`
- `nova_bi_datasets`
- `nova_bi_analyses`
- `nova_bi_workflow_proposals`
- `nova_bi_workflow_approvals`
- `nova_bi_audit_events`
- `nova_bi_workflow_executions`
- `nova_bi_branding`
- `nova_bi_rate_limits` (server-only counters; not tenant-visible)

The browser parses CSV files locally. Cloud save persists dataset metadata, aggregate analysis outputs, source-row evidence, assumptions and calculation version; raw CSV contents are not uploaded. Workflow proposals are plans only; no external workflow action is executed.

## Authorization model

The table below describes the intended candidate authorization model. **Live-state exception:** the last direct inspection found that the deployed audit-read policy still allows all active organization members to read audit events. The candidate migration `20261108120000_nova_bi_audit_admin_read_only.sql` narrows this to active owners/admins, but it has not been applied to production. Do not assume the narrower audit rule is live until an owner-approved migration and post-migration verification are complete.

| Capability | Owner | Admin | Analyst | Viewer |
|---|---:|---:|---:|---:|
| Read tenant datasets, analyses and workflows | Yes | Yes | Yes | Yes |
| Read company audit log (may contain member/invitee details) | Yes | Yes | No | No |
| Create dataset metadata and analyses | Yes | Yes | Yes | No |
| Delete datasets and analyses | Yes | Yes | No | No |
| Propose workflows | Yes | Yes | Yes | No |
| Approve/reject another member's proposal | Yes | Yes | No | No |
| Invite viewer/analyst | Yes | Yes | No | No |
| Invite another admin | Yes | No | No | No |
| Manage company branding | Yes | Yes | No | No |

Authenticated clients have no general membership write access. Invitation acceptance is the sole narrow exception: only the `status` column is granted for update, and RLS/trigger checks restrict it to the authenticated invitee's own pending membership. Role, organization and user identity columns remain non-updatable. Owner/admin roster access is checked server-side.

## Deletion and audit
- Owners/admins can permanently delete saved analysis records and dataset metadata.
- Dataset deletion is blocked by the relational foreign key while analyses still reference it; the UI asks the user to remove linked analyses first.
- Database triggers append audit events for analysis/dataset deletion, invitation acceptance and workflow decisions.
- Candidate audit-log SELECT is restricted by RLS to active owners/admins. Live production still has the broader active-member policy until the pending owner/admin-only migration is approved, applied and verified.
- Original CSV files are browser-local and are not stored by NOVA; deleting cloud metadata cannot delete a local file.

## Truthful feature boundaries
- Project risk is an explainable heuristic, not a trained or calibrated prediction.
- Digital Twin scenarios use user-entered assumptions and deterministic arithmetic; they are not guaranteed savings or forecasts.
- Productivity analysis is aggregate/team-level, not individual surveillance or performance ranking.
- Workflow automation is an approval-gated proposal/checklist, not a connected executor.
- White-label settings change workspace appearance only. Custom domains and full NOVA brand removal are not implemented.
- External accounting, HR, CRM, project-management and payment integrations are not implemented.
- Action Proof records calculation/test evidence; it does not prove real-world business outcomes.

## Verification and release gates
- GitHub Actions applies all migrations to a fresh PostgreSQL 17 instance and runs RLS integration scenarios.
- Candidate CI runs Deno type-check plus local invitation/CORS unit tests. The deployed Edge Function unauthenticated/CORS smoke is conditional on `main` and is skipped for this unmerged feature branch.
- Calculation, CSV validation, server/PWA smoke tests and a Playwright mobile-viewport Company Cloud flow run in CI.
- Before public release, complete real two-account browser testing (including invite email delivery), manual Android accessibility/touch checks, production regression/live smoke tests, backup/restore validation and a documented retention/incident-response policy.
- Do not merge or deploy without explicit owner approval.
