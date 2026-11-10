# NOVA Mission Engine V1 — Foundation

**Implementation status:** Code and isolated CI verification complete on `feature/nova-mission-engine-v1`. This is not yet deployed or enabled in production.

## What is included

- Deterministic mission lifecycle core with explicit transitions:
  `draft → planned → running → waiting_approval → running → verifying → completed`.
- Failure, retry and cancellation paths.
- Immutable in-memory event/evidence snapshots in the domain core.
- Supabase persistence for missions, tasks, events and proof records.
- Atomic, idempotent mission creation RPC restricted to the trusted `service_role`.
- Authenticated read API for mission lists and details.
- Deterministic, no-cost starter planner templates for Learn, Build, Agents and Intelligence; plan persistence atomically creates tasks and advances draft missions to planned.
- Bilingual Mission Control panel inside NOVA Agents for mission creation, starter-plan generation, listing and inspection of tasks, events and proofs.
- Exact-origin CORS, bounded request bodies, input validation and server-enforced per-user rate limiting.
- Database-level rule that prevents `completed` unless at least one passing proof record exists.
- Browser-authenticated clients have read-only access; event and proof records are append-only from the browser's perspective.

## Data model

| Table | Purpose |
|---|---|
| `nova_missions` | Mission owner, title, workspace, state, version, plan and idempotency key |
| `nova_mission_tasks` | Ordered tasks and their execution status |
| `nova_mission_events` | Ordered mission lifecycle audit events |
| `nova_mission_proofs` | Evidence records and verification outcomes |

All four tables have RLS enabled. Each row carries `owner_id`; the database enforces mission/child ownership consistency with composite foreign keys. Authenticated clients can select only their own rows. Writes are reserved for trusted server-side code.

## API contract

The Edge Function is named `nova-mission-api`. It requires an authenticated Supabase user session.

| Method | Path | Purpose |
|---|---|---|
| POST | `/functions/v1/nova-mission-api/missions` | Create a mission |
| GET | `/functions/v1/nova-mission-api/missions` | List up to 50 of the user's missions |
| GET | `/functions/v1/nova-mission-api/missions/{id}` | Read one mission, tasks, events and proofs |

Mission creation accepts `title` (1–200 chars), optional `description` (up to 10,000 chars), one of `learn`, `build`, `agents`, `intelligence`, optional `idempotency_key` (up to 160 chars), and an optional JSON-object `plan` (up to 100 KB). An `Idempotency-Key` header is also accepted; if both header and body specify a key, they must match.

The API derives `owner_id` from the verified JWT. It never trusts a caller-supplied owner ID. It uses the service-role client only for the atomic creation RPC; all reads use the authenticated user's client and owner filter.

## Verification

The CI workflow now runs:

- `npm run test:mission-core`
- `node scripts/mission-ui-smoke.mjs` with a mocked Mission API, covering create/list/detail, Hindi labels and a 390px mobile viewport
- PostgreSQL migration and RLS integration tests, including cross-account isolation
- Atomic creation/idempotency and RPC privilege tests
- Deno type-check for `nova-mission-api`
- Deno input-validation tests
- Existing backend, security, local runtime and browser regression suites

The CI run on the current PR head completed successfully. Live Supabase deployment and live Edge Function invocation were intentionally not performed.

## Not yet implemented

This foundation does **not** yet provide:

- LLM-powered adaptive mission planning or task decomposition (the current starter planner is deterministic and template-based)
- Task execution workers or agent/tool adapters
- Approval UI and execution controls
- Retry/resume worker orchestration and idempotent external tool calls
- Live production Supabase migration or Edge Function deployment

The starter planner creates a checklist only; it does not execute tasks or call paid AI providers. Do not label a mission as executed or verified until a real executor has produced inspectable evidence and the verification checks have passed.

## Release gates

Before production use:

1. Review the migration and run a remote dry-run against the intended Supabase project.
2. Obtain explicit project-owner approval before applying the migration.
3. Deploy the Edge Function only after its environment, JWT verification and exact-origin CORS are checked.
4. Deploy the Edge Function only after the migration and environment have been approved.
5. Add end-to-end authenticated API tests with two distinct live user accounts.
6. Implement execution workers with per-user permissions, bounded retries, idempotency, approvals and recovery.
7. Keep service-role credentials server-side; never expose them to the browser.

No production branch merge, Render deployment, live Supabase schema change or paid provider spend is part of this PR.
