# NOVA Mission Engine V1 — Foundation

**Implementation status:** Code and isolated CI verification complete on `feature/nova-mission-engine-v1`. This is not yet deployed or enabled in production.

## What is included

- Deterministic mission lifecycle core with explicit transitions:
  `draft → planned → running → waiting_approval → planned → running → verifying → completed`; approval returns a mission to `planned`, and a separate worker start is required before `running`.
- Failure, retry and cancellation paths.
- Immutable in-memory event/evidence snapshots in the domain core.
- Supabase persistence for missions, tasks, events and proof records.
- Server-only approval queue and execution-run ledger: requests atomically move the task and mission into `waiting_approval`; owner approval records an `authorized` permission record but keeps the mission `planned` until a real worker starts, while rejection blocks the run and fails the task. Idempotency keys prevent duplicate approval records and are bound to the original mission, task and action summary; conflicting reuse returns a conflict. A new server-only lease layer atomically claims approved runs, issues replaceable lease tokens, supports bounded heartbeats, recovers expired leases, and schedules bounded retries (maximum five attempts).
- Atomic, idempotent mission creation RPC restricted to the trusted `service_role`; reusing a key with changed mission content returns a conflict.
- Authenticated read API for mission lists and details.
- Authenticated owner-scoped approval request and decision API routes; decision actor is taken from the verified JWT subject, never from request JSON.
- Atomic owner cancellation endpoint expires pending approvals, cancels active authorization records and cancels remaining non-terminal tasks; it does not attempt to stop external systems.
- Deterministic, no-cost starter planner templates for Learn, Build, Agents and Intelligence; plan persistence atomically creates tasks and advances draft missions to planned.
- Bilingual Mission Control panel inside NOVA Agents for mission creation, starter-plan generation, listing, task/event/proof inspection, task-level approval requests, explicit owner approval/rejection across multiple tasks and mission cancellation.
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
| `nova_mission_approvals` | Pending/approved/rejected owner decisions and action summaries |
| `nova_mission_execution_runs` | Idempotent authorization, bounded attempts, worker identity, expiring lease token, heartbeat and retry schedule |

All six tables have RLS enabled. Each row carries `owner_id`; the database enforces mission/child ownership consistency with composite foreign keys. Authenticated clients can select only their own rows. Writes are reserved for trusted server-side code.

## API contract

The Edge Function is named `nova-mission-api`. It requires an authenticated Supabase user session.

| Method | Path | Purpose |
|---|---|---|
| POST | `/functions/v1/nova-mission-api/missions` | Create a mission |
| GET | `/functions/v1/nova-mission-api/missions` | List up to 50 of the user's missions |
| GET | `/functions/v1/nova-mission-api/missions/{id}` | Read one mission, tasks, events, proofs, approval decisions and execution-run records |
| POST | `/functions/v1/nova-mission-api/missions/{id}/plan` | Generate and persist a one-time, deterministic five-task starter checklist for a draft mission |
| POST | `/functions/v1/nova-mission-api/missions/{id}/tasks/{task_id}/approval` | Queue a bounded action summary for explicit owner approval; creates no external side effect |
| POST | `/functions/v1/nova-mission-api/approvals/{id}/decision` | Record an owner-bound approve/reject decision using the authenticated JWT subject |
| POST | `/functions/v1/nova-mission-api/missions/{id}/cancel` | Cancel an active mission and atomically close pending approvals and authorization records |

Mission creation accepts `title` (1–200 chars), optional `description` (up to 10,000 chars), one of `learn`, `build`, `agents`, `intelligence`, optional `idempotency_key` (up to 160 chars), and an optional JSON-object `plan` (up to 100 KB). An `Idempotency-Key` header is also accepted; if both header and body specify a key, they must match.

The API derives `owner_id` from the verified JWT. It never trusts a caller-supplied owner ID. It uses the service-role client only for narrowly scoped server-only RPCs; all reads use the authenticated user's client and owner filter.

## Verification

The CI workflow now runs:

- `npm run test:mission-core`
- `node scripts/mission-ui-smoke.mjs` with a mocked Mission API, covering create/list/detail, starter planning, task approval request, owner approve/reject decisions across multiple tasks, verify approval does not falsely mark a mission running, cancellation, Hindi labels and a 390px mobile viewport
- PostgreSQL migration and RLS integration tests, including cross-account isolation
- Atomic creation/idempotency, same-payload replay, mismatched-payload conflict and RPC privilege tests
- Approval queue SQL integration: idempotent request, same-request key replay, changed-summary and cross-task key-reuse rejection, atomic task/mission gating, owner approval/rejection, duplicate-decision rejection and cross-account isolation
- Cancellation SQL integration: atomic task cancellation, pending approval expiry, authorized-run cancellation, terminal-state guard and server-only RPC permissions
- Approval decision lock-order migration serializes owner decisions with mission cancellation, preventing stale approvals and concurrent event-sequence collisions
- Worker lease integration (new tests awaiting CI): only approved runs can be claimed; active leases cannot be double-claimed; expired tokens cannot heartbeat or fail a reclaimed run; expired leases can be reclaimed with a new token; retry scheduling and five-attempt exhaustion; browser roles cannot invoke worker RPCs; cancellation revokes an active lease
- Deno type-check for `nova-mission-api`
- Deno input-validation, four-workspace starter-planner and approval request/decision validation tests
- Existing backend, security, local runtime and browser regression suites

The pre-worker Mission Engine CI suite completed successfully on commit `9ef5be0`. The worker-lease migration and its expanded PostgreSQL integration tests were added afterward; CI is queued for the current head and must pass before this lease layer is considered verified. Live Supabase deployment and live Edge Function invocation were intentionally not performed.

## Worker lease foundation (not an active worker)

The migration `20261110150000_nova_mission_execution_leases.sql` adds three service-role-only RPCs: `nova_claim_mission_task`, `nova_heartbeat_mission_task`, and `nova_fail_mission_task`. Claims require an approved authorization record, use the mission → approval → run → task lock order, serialize execution to one active task per mission, and issue a fresh lease token. Lease duration is bounded to 30–300 seconds. Expired leases can be reclaimed; stale tokens cannot heartbeat or report failure. Failures are returned to `authorized` with a bounded retry delay until attempt five, then become terminal. A trigger clears lease metadata whenever a run leaves `running`, including cancellation. The integration suite exercises approval gating, heartbeat, stale-token rejection, recovery, retry scheduling and the five-attempt ceiling.

These RPCs are not exposed through the public Mission API and no worker process calls them yet. They are primitives for a later reviewed worker service, not evidence that NOVA currently executes tasks.

## Not yet implemented

This foundation does **not** yet provide:

- LLM-powered adaptive mission planning or task decomposition (the current starter planner is deterministic and template-based)
- Task execution workers or agent/tool adapters (only the database lease primitives exist)
- Task execution controls and worker lifecycle (approval and cancellation controls are implemented)
- Full retry/resume orchestration, executor-side idempotency and external tool adapters (database lease recovery and retry scheduling only)
- Live production Supabase migration or Edge Function deployment

The starter planner creates a checklist only; it does not execute tasks or call paid AI providers. Do not label a mission as executed or verified until a real executor has produced inspectable evidence and the verification checks have passed.

## Release gates

Before production use:

1. Review the migration and run a remote dry-run against the intended Supabase project.
2. Obtain explicit project-owner approval before applying the migration.
3. Deploy the Edge Function only after its environment, JWT verification and exact-origin CORS are checked.
4. Add end-to-end authenticated API tests with two distinct live user accounts.
5. Implement execution workers with per-user permissions, bounded retries, idempotency, approvals and recovery.
6. Keep service-role credentials server-side; never expose them to the browser.

No production branch merge, Render deployment, live Supabase schema change or paid provider spend is part of this PR.
