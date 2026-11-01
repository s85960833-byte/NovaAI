# NOVA Business Intelligence — Shared-Data Architecture Contract

**Status:** Provider-neutral design + isolated policy primitives only. Not a deployed authentication system.

## Security boundary
The current NOVA Business Intelligence workspace remains browser-local. The policy module in `nova-business-security.js` is a deny-by-default authorization helper for future server routes. It does not verify JWTs, authenticate users, load memberships, persist records, or provide tenant isolation by itself. No protected business-data route may be enabled until a concrete server-side auth adapter and trusted membership repository are implemented.

## Required request pipeline
1. Verify bearer token signature, issuer, audience, expiry and revocation/session policy using the selected provider's server SDK.
2. Resolve the authenticated user from verified token claims only.
3. Load active organization membership from the database using both user ID and organization ID.
4. Call the shared authorization policy with the verified principal and trusted membership.
5. Query or mutate records with organization ID included in every database predicate; enforce database row-level policies independently.
6. Emit an append-only audit event for sensitive operations.
7. Return generic 404 for cross-tenant resource IDs; never reveal whether another tenant's record exists.

Never trust organization IDs, role names, user IDs, approval state, or permissions supplied in a request body, query string, local storage, or unsigned token.

## Initial relational model
- `organizations(id, name, created_at, created_by)`
- `organization_memberships(id, organization_id, user_id, role, status, created_at, updated_at)`; unique (organization_id, user_id)
- `business_datasets(id, organization_id, created_by, name, schema_version, fingerprint, created_at, deleted_at)`
- `business_analyses(id, organization_id, dataset_id, created_by, calculation_version, result_json, created_at)`
- `workflow_proposals(id, organization_id, created_by, status, proposal_json, created_at)`
- `workflow_approvals(id, organization_id, proposal_id, actor_id, decision, decided_at)`
- `audit_events(id, organization_id, actor_id, event_type, resource_type, resource_id, metadata_json, created_at)`

Every child record must have a tenant-scoped foreign key or equivalent constraint. Do not persist raw CSV rows by default; store only the minimum approved fields. Define deletion and retention before enabling persistence.

## Role matrix
| Capability | Owner | Admin | Analyst | Viewer |
|---|---:|---:|---:|---:|
| Read datasets / analyses | Yes | Yes | Yes | Yes |
| Import or update datasets | Yes | Yes | Yes | No |
| Export datasets / reports | Yes | Yes | Yes | No |
| Delete datasets | Yes | Yes | No | No |
| Run analysis | Yes | Yes | Yes | Read only |
| Propose workflows | Yes | Yes | Yes | No |
| Approve workflow proposals | Yes | Yes | No | No |
| Invite / change member roles | Yes | Yes | No | No |
| Read audit events | Yes | Yes | Yes | Yes |
| Manage organization settings | Yes | Yes | No | No |

Role assignment, invitations, owner transfer, and removal of the final owner require dedicated server-side workflows and audit events. This matrix is a proposed baseline, not an implemented account feature.

## Required release tests
- Unauthenticated: 401.
- Authenticated but not a member / insufficient role: 403.
- Cross-tenant resource IDs: generic 404.
- Verify every read, update, delete, export, approval and background task is tenant-scoped.
- Test role downgrade, membership removal, session revocation and organization deletion.
- Test database row-level policies independently of API checks.
- Confirm no provider service key or raw company row is exposed in browser bundles, logs, analytics or error responses.
- Verify append-only audit semantics, data export/deletion, retention expiry and backup restore.

## Provider selection gate
No auth/database provider is selected or connected. Before selecting one, compare free-tier limits, pause/sleep behavior, data region, backups, row-level security, auth session handling, export/deletion, and expected growth. Do not create a project, enter credentials, or enable paid billing without explicit user approval.

## Explicit non-claims
These files do not mean NOVA has login, cloud sync, shared accounts, role enforcement on live APIs, audit logging, tenant-isolated storage, or enterprise readiness. Those remain blocked until implemented with a selected provider and tested end to end.
