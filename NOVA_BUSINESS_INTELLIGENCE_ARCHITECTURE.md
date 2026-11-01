# NOVA Business Intelligence — Current Architecture

**Status:** Isolated feature branch; authenticated cloud metadata and analysis storage are implemented on the approved Supabase project. This is not yet a production release or enterprise certification.

## Deployment boundaries
- Application repository: `s85960833-byte/NovaAI`.
- Implementation branch: `feature/nova-business-intelligence`.
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
Nine NOVA BI tables are deployed with RLS enabled:
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
| Capability | Owner | Admin | Analyst | Viewer |
|---|---:|---:|---:|---:|
| Read tenant datasets, analyses, workflows and audit | Yes | Yes | Yes | Yes |
| Create dataset metadata and analyses | Yes | Yes | Yes | No |
| Delete datasets and analyses | Yes | Yes | No | No |
| Propose workflows | Yes | Yes | Yes | No |
| Approve/reject another member's proposal | Yes | Yes | No | No |
| Invite viewer/analyst | Yes | Yes | No | No |
| Invite another admin | Yes | No | No | No |
| Manage company branding | Yes | Yes | No | No |

Membership writes are not available directly to authenticated clients. Invitation acceptance can only activate the authenticated invitee's own pending membership. Owner/admin roster access is checked server-side.

## Deletion and audit
- Owners/admins can permanently delete saved analysis records and dataset metadata.
- Dataset deletion is blocked by the relational foreign key while analyses still reference it; the UI asks the user to remove linked analyses first.
- Database triggers append audit events for analysis/dataset deletion, invitation acceptance and workflow decisions.
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
- Deno type-check and deployed Edge Function unauthenticated/CORS smoke checks run in CI.
- Calculation, CSV validation, server/PWA smoke tests and a Playwright mobile-viewport Company Cloud flow run in CI.
- Before public release, complete real two-account browser testing (including invite email delivery), manual Android accessibility/touch checks, production regression/live smoke tests, backup/restore validation and a documented retention/incident-response policy.
- Do not merge or deploy without explicit owner approval.
