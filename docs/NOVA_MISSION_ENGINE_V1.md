# NOVA Mission Engine V1 — Foundation

**Implementation status:** Mission Engine V1 foundation code is present on `feature/nova-mission-engine-v1`; the three GitHub Actions workflows for the latest implementation head `0b3ef448eb02a1dcaefee5051394fb2a261dc8e0` completed successfully. A documentation-only refresh may trigger a new CI run. This is not deployed or enabled in production, and no task worker is registered.

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
- Bilingual Mission Control panel inside NOVA Agents for mission creation, starter-plan generation, listing, task/event/proof/action-receipt inspection, task-level approval requests, explicit owner approval/rejection across multiple tasks and mission cancellation.
- Exact-origin CORS, bounded request bodies, input validation and server-enforced per-user rate limiting.
- Database-level task and mission completion guards: task and mission inserts cannot bypass proof checks; each task needs its own passing proof before completion; every task must be completed with task-scoped passing proof before mission completion; completed missions and their tasks are terminal.
- Canonical proof-envelope contract with SHA-256 digest, verifier identity/version, mission/task/run binding, bounded checks, duplicate-check rejection and deterministic JSON serialization.
- Append-only proof-attestation ledger: each attestation stores the canonical envelope, digest, verifier/version, outcome and timestamp; composite foreign keys bind it to the exact proof, mission, task, owner and execution run. The database checks envelope bindings and requires a matching claimed run; authenticated owners can read their own attestations, while only the trusted server role can insert. App-facing roles have no update/delete/truncate grants.
- Lease-fenced completion RPC: `nova_complete_mission_task` is service-role-only and requires the current unexpired approved lease token, a task/mission/owner-bound passing proof, a passing attestation bound to that exact proof and run, and no reserved or uncertain action receipts. It marks the run and task complete atomically, advances the mission only when all tasks are complete, and appends a completion event. It does not start a worker. The database stores the attestation binding and verifier identity/version; independent evidence authenticity and digest recomputation remain responsibilities of a separately reviewed trusted verifier.
- Lease-fenced action receipt ledger: trusted RPCs reserve idempotent action keys against a specific approved run, task, request digest and current lease token; same-request replay returns the existing receipt, conflicting payloads are rejected, and stale leases cannot complete actions. Completed receipts require a stable result digest/reference; uncertain outcomes are held for reconciliation and are never automatically re-issued. When a worker lease ends, a database trigger automatically moves its unfinished reserved receipts to `uncertain`. If a lease expires and is reclaimed while still running, a later approved lease can explicitly reconcile the stale reservation while preserving the original lease token; the old worker cannot reconcile it. Direct table writes are revoked even from `service_role`; security-definer RPCs require the trusted JWT role claim.
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
| `nova_mission_proof_attestations` | Append-only verifier envelope, digest, outcome and exact proof/task/run binding |
| `nova_mission_action_receipts` | Lease-bound idempotency keys, request/result digests and reserved/completed/uncertain action outcomes |

All eight tables have RLS enabled. Each row carries `owner_id`; the database enforces mission/child ownership consistency with composite foreign keys. Authenticated clients can select only their own rows. Writes are reserved for trusted server-side code; proof attestations are insert-only even for the service role.

## API contract

The Edge Function is named `nova-mission-api`. It requires an authenticated Supabase user session.

| Method | Path | Purpose |
|---|---|---|
| POST | `/functions/v1/nova-mission-api/missions` | Create a mission |
| GET | `/functions/v1/nova-mission-api/missions` | List up to 50 of the user's missions |
| GET | `/functions/v1/nova-mission-api/missions/{id}` | Read one mission, tasks, events, proofs, action receipts, approval decisions and execution-run records; owner reads never expose worker lease tokens |
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
- PostgreSQL migration and RLS integration tests, including cross-account isolation and negative/positive task-scoped proof completion cases
- Atomic creation/idempotency, same-payload replay, mismatched-payload conflict and RPC privilege tests
- Approval queue SQL integration: idempotent request, same-request key replay, changed-summary and cross-task key-reuse rejection, atomic task/mission gating, owner approval/rejection, duplicate-decision rejection and cross-account isolation
- Cancellation SQL integration: atomic task cancellation, pending approval expiry, authorized-run cancellation, terminal-state guard and server-only RPC permissions
- Approval decision lock-order migration serializes owner decisions with mission cancellation, preventing stale approvals and concurrent event-sequence collisions
- Worker lease PostgreSQL integration: only approved runs can be claimed; active leases cannot be double-claimed; expired tokens cannot heartbeat or fail a reclaimed run; expired leases can be reclaimed with a new token; retry scheduling and five-attempt exhaustion; browser roles cannot invoke worker RPCs; cancellation revokes an active lease
- Proof-attestation PostgreSQL integration: envelope/proof/run binding, duplicate-attestation rejection, mismatched-run rejection, service-role insert-only privileges and owner-only RLS reads
- Action receipt PostgreSQL integration: active approved lease requirement, JWT-role enforcement, idempotent same-request replay, conflicting request/result rejection, uncertain-outcome handling, automatic uncertainty marking on lease end, stale-token rejection after lease reclaim, idempotent abandoned-action reconciliation, direct table-write denial and owner-only reads with lease tokens hidden
- Deno type-check for `nova-mission-api`
- Deno input-validation, four-workspace starter-planner and approval request/decision validation tests
- Existing backend, security, local runtime and browser regression suites

The latest implementation head `0b3ef448eb02a1dcaefee5051394fb2a261dc8e0` passed all three GitHub Actions workflows: NovaAI verification `42828529201`, NOVA account/browser verification `42828539300`, and NovaAI push verification `42828539353`. All three completed successfully with no failed steps. Coverage includes PostgreSQL migration/RLS integration; lease-expiry and stale-token fencing; mismatched proof/attestation rejection; unresolved-action blocking; successful proof-bound completion and service-role-only RPC privileges; Mission API type-check/tests; fail-closed Deno worker-registry tests; Mission Control mocked-API browser checks; responsive Chromium workspace/PDF.js checks; Company Cloud mobile browser workflows; five-viewport mobile/drawer regression; account/privacy/cloud-sync browser checks; and graceful shutdown. Live Supabase deployment, live Edge Function invocation, live Render/provider smoke and live image-generation smoke were skipped because this PR is not merged or deployed.

## Worker lease foundation (not an active worker)

The migration `20261110150000_nova_mission_execution_leases.sql` adds three service-role-only RPCs: `nova_claim_mission_task`, `nova_heartbeat_mission_task`, and `nova_fail_mission_task`. Claims require an approved authorization record, use the mission → approval → run → task lock order, serialize execution to one active task per mission, and issue a fresh lease token. Lease duration is bounded to 30–300 seconds. Expired leases can be reclaimed; stale tokens cannot heartbeat or report failure. Failures are returned to `authorized` with a bounded retry delay until attempt five, then become terminal. A trigger clears lease metadata whenever a run leaves `running`, including cancellation. The integration suite exercises approval gating, heartbeat, stale-token rejection, recovery, retry scheduling and the five-attempt ceiling.

These RPCs are not exposed through the public Mission API and no worker process calls them yet. They are primitives for a later reviewed worker service, not evidence that NOVA currently executes tasks.

## Worker readiness audit

A source review found two concrete integration gaps that must be closed before any worker is enabled:

- **Typed task routing is not persisted yet.** The task table currently stores only a title and an `input_json.description`; the starter planner does not assign a `task_type`, while the in-memory registry requires one. A reviewed schema/API contract must add an explicit allowlisted task type and validated, versioned input schema. The worker must reject unknown or malformed types rather than infer an executable action from free text.
- **Proof persistence is not wired to execution yet.** The proof helper validates and hashes an envelope, and the database has append-only attestation storage plus a lease-fenced completion RPC, but no trusted endpoint currently accepts a verifier result, persists the proof/attestation pair, and then invokes completion. This path must recompute the digest server-side, bind every identifier to the active lease, and fail closed on any mismatch.

Therefore the current approval, lease, action-receipt and registry primitives are not enough to run tasks. Do not register a handler or enable a worker until these contracts have dedicated negative/positive integration tests and an independently reviewed verifier.
## Fail-closed worker registry foundation

The registry also validates task, mission, run and owner identifiers as UUIDs before invoking a handler; malformed bindings are rejected before execution. Negative tests cover each identifier.

The new `mission-task-registry.ts` provides a typed, explicit allowlist for future task handlers. A task type is non-executable by default; registering it requires both a trusted handler and a separately registered verifier identity/version. The registry rejects duplicate registrations, missing adapters, mismatched verifier identity/version, invalid check sets and inconsistent pass/fail outcomes. Its default exported registry is intentionally empty. Tests cover default-deny behavior, paired handler/verifier execution, duplicate registration and forged verifier identity rejection.

This is a registry contract only: it does not claim database leases, perform external actions, persist proofs or complete tasks. No task handlers are registered, so no mission task becomes executable as a result of this change.

## Not yet implemented

This foundation does **not** yet provide:

- LLM-powered adaptive mission planning or task decomposition (the current starter planner is deterministic and template-based)
- Task execution workers or agent/tool adapters (only the database lease primitives exist)
- Task execution controls and worker lifecycle (approval and cancellation controls are implemented)
- Full retry/resume orchestration and external tool adapters (database lease recovery, retry scheduling and an action-receipt/idempotency foundation only)
- Live production Supabase migration or Edge Function deployment

The starter planner creates a checklist only; it does not execute tasks or call paid AI providers. Action receipts are database coordination records, not an executor: no external action is performed, no worker is running, and uncertain receipts require a separately reviewed external verification workflow before any operator can decide whether a side effect actually occurred. The database completion guards ensure every completed task and mission has a task-scoped passing proof row written by the trusted server role. The proof-envelope helper computes a deterministic SHA-256 digest and validates scope/verifier metadata. The attestation table persists the canonical envelope and digest for later offline recomputation, but the database does not independently recompute SHA-256 or authenticate an external source. A matching claimed run and a trusted service-role insert are required; neither proves that an external action occurred. No endpoint currently accepts proof envelopes, creates attestations or marks tasks complete; a trusted adapter and independent evidence verifier must be reviewed before wiring this contract to persistence. Do not label a mission as executed or independently verified until a reviewed verifier has checked inspectable evidence and the verification checks have passed.

## Release gates

Before production use:

1. Review the migration and run a remote dry-run against the intended Supabase project.
2. Obtain explicit project-owner approval before applying the migration.
3. Deploy the Edge Function only after its environment, JWT verification and exact-origin CORS are checked.
4. Add end-to-end authenticated API tests with two distinct live user accounts.
5. Implement execution workers with per-user permissions, bounded retries, idempotency, approvals and recovery.
6. Implement a separately reviewed evidence verifier with canonical evidence serialization, cryptographic digesting, verifier identity/version, run-to-task binding, digest recomputation and executor-side idempotency/fencing before enabling any worker.
7. Keep service-role credentials server-side; never expose them to the browser.

No production branch merge, Render deployment, live Supabase schema change or paid provider spend is part of this PR.
