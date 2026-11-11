# NOVA Mission Engine V1 — Foundation

**Implementation status:** Mission Engine V1 foundation code is present on `feature/nova-mission-engine-v1` and remains isolated in the unmerged PR #99. It is not deployed or enabled in production, and no task worker is registered. CI results are tracked against the current PR head rather than copied into this document, so the status cannot become stale after a documentation-only commit.

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

The user-facing Edge Function is named `nova-mission-api` and requires an authenticated Supabase user session. The separate internal proof-ingress Edge Function is `nova-mission-proof-api` and requires a Supabase secret key plus a verifier-specific HMAC.

| Method | Path | Purpose |
|---|---|---|
| POST | `/functions/v1/nova-mission-api/missions` | Create a mission |
| GET | `/functions/v1/nova-mission-api/missions` | List up to 50 of the user's missions |
| GET | `/functions/v1/nova-mission-api/missions/{id}` | Read one mission, tasks, events, proofs, action receipts, approval decisions and execution-run records; owner reads never expose worker lease tokens |
| POST | `/functions/v1/nova-mission-api/missions/{id}/plan` | Generate and persist a one-time, deterministic five-task starter checklist for a draft mission |
| POST | `/functions/v1/nova-mission-api/missions/{id}/tasks/{task_id}/approval` | Queue a bounded action summary for explicit owner approval; creates no external side effect |
| POST | `/functions/v1/nova-mission-api/approvals/{id}/decision` | Record an owner-bound approve/reject decision using the authenticated JWT subject |
| POST | `/functions/v1/nova-mission-api/missions/{id}/cancel` | Cancel an active mission and atomically close pending approvals and authorization records |
| POST | `/functions/v1/nova-mission-proof-api` | Internal verifier-only endpoint; authenticates a Supabase secret key plus verifier-specific HMAC, recomputes the canonical SHA-256 digest, and calls one atomic proof + attestation + lease-fenced completion RPC |

Mission creation accepts `title` (1–200 chars), optional `description` (up to 10,000 chars), one of `learn`, `build`, `agents`, `intelligence`, optional `idempotency_key` (up to 160 chars), and an optional JSON-object `plan` (up to 100 KB). An `Idempotency-Key` header is also accepted; if both header and body specify a key, they must match.

The Mission API derives `owner_id` from the verified user JWT. It never trusts a caller-supplied owner ID. It uses the service-role client only for narrowly scoped server-only RPCs; all reads use the authenticated user's client and owner filter. The separate proof endpoint uses `@supabase/server` `auth: 'secret'` (platform JWT verification is disabled for that function because the wrapper validates the secret key) and additionally requires a verifier-specific HMAC signature. Configure `NOVA_MISSION_VERIFIER_KEYS` as a server-side JSON object keyed by verifier ID, each containing the exact approved `version` and a unique random `secret` of at least 32 characters. Never place this configuration or the Supabase secret key in browser code.

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

CI results are attached to the current PR head. The last fully inspected run pair completed successfully: NOVA account/browser verification and NovaAI verification. Coverage included PostgreSQL migration/RLS integration; lease-expiry and stale-token fencing; mismatched proof/attestation rejection; unresolved-action blocking; successful proof-bound completion and service-role-only RPC privileges; Mission API type-check/tests; fail-closed Deno worker-registry tests; Mission Control mocked-API browser checks; responsive Chromium workspace/PDF.js checks; Company Cloud mobile browser workflows; five-viewport mobile/drawer regression; account/privacy/cloud-sync browser checks; and graceful shutdown. Live Supabase deployment, live Edge Function invocation, live Render/provider smoke and live image-generation smoke were skipped because this PR is not merged or deployed. Read the current PR checks for the exact latest commit status.

## Runtime tool-gateway authorization core (preflight only)

The feature branch now includes `supabase/functions/nova-mission-api/mission-tool-gateway.ts` and focused Deno tests. This is a fail-closed authorization core, not an enabled tool executor or deployed endpoint.

- Requires a matching passed `agents.tool_gates` proof and verifier attestation. The policy proof must belong to a distinct task in the same mission and owner; its task/run/proof/verifier bindings must match the attestation exactly.
- Requires the current mission, task, run and owner approval to be active, and the lease to be unexpired.
- Computes a canonical digest for the exact policy and produces a human-readable owner-approval summary containing that digest and each allowed tool, operation, scope, risk and approval requirement. The executing task's approval summary must match byte-for-byte.
- Matches the requested tool, operation and scope to one explicit gate. Unknown tools, broader scopes, invalid policy declarations and credential-boundary mismatches are denied.
- Calls only an injected reservation callback after all checks. The production adapter must bind this callback to the service-role-only `nova_reserve_mission_action` RPC and calculate the request digest from the exact outbound payload.
- A replayed reservation, completed action or uncertain action is never authorized for another execution.

**Important boundary:** the module does not load database records, create approvals, call the reservation RPC itself, or invoke external tools. Its context must be assembled from trusted service-role reads, including the policy snapshot in the signed proof envelope; an API/worker adapter must connect it to the approval UI and reservation RPC before it can protect any real tool. The current SQL reservation RPC independently enforces the active approved lease and idempotency but does not itself evaluate the tool policy. No worker is registered, and no external action can be performed by this module.

## Worker lease foundation (not an active worker)

The migration `20261110150000_nova_mission_execution_leases.sql` adds three service-role-only RPCs: `nova_claim_mission_task`, `nova_heartbeat_mission_task`, and `nova_fail_mission_task`. Claims require an approved authorization record, use the mission → approval → run → task lock order, serialize execution to one active task per mission, and issue a fresh lease token. Lease duration is bounded to 30–300 seconds. Expired leases can be reclaimed; stale tokens cannot heartbeat or report failure. Failures are returned to `authorized` with a bounded retry delay until attempt five, then become terminal. A trigger clears lease metadata whenever a run leaves `running`, including cancellation. The integration suite exercises approval gating, heartbeat, stale-token rejection, recovery, retry scheduling and the five-attempt ceiling.

These RPCs are not exposed through the public Mission API and no worker process calls them yet. They are primitives for a later reviewed worker service, not evidence that NOVA currently executes tasks.

**Connected Supabase project check (read-only):** the active connected project currently contains the NOVA BI and account-workspace migrations only; it has no NOVA Mission Engine tables or Mission Engine migrations. No live schema or Edge Function was changed. Do not apply Mission Engine migrations to that project until the target project is explicitly confirmed and a separate deployment approval is given.

## Worker readiness audit

A source review found two concrete integration gaps that must be closed before any worker is enabled:

- **Typed task routing is now persisted on the feature branch.** Migration `20261110200000_nova_mission_typed_task_routing.sql` adds allowlisted `task_type` and `input_schema_version` columns, validates strict structured input in the service-role-only planning RPC, and preserves pre-existing legacy rows as non-typed rows. The starter planner now emits five workspace-scoped task types per workspace with schema version 1; the Mission API returns route metadata without exposing internal input payloads. The registry remains empty, so persisted task types do not by themselves enable execution.
- **Trusted proof persistence endpoint and atomic RPC are now implemented on the feature branch.** The endpoint requires a Supabase secret key plus a verifier-specific HMAC over the timestamp, nonce, worker ID, lease token and canonical envelope. It loads the verifier ID/version from server-side `NOVA_MISSION_VERIFIER_KEYS`, recomputes SHA-256 from canonical JSON (the client cannot submit a digest), and accepts only passing envelopes. The RPC derives mission/task/owner from the run, locks mission → approval → run → task, checks the approved active unexpired lease and worker ID, inserts proof + attestation, and calls lease-fenced completion in the same transaction. A unique run index prevents a second attestation for the same run; failed completion rolls back both inserts. PostgreSQL integration now covers wrong worker, stale lease token, expired lease, malformed digest, failed outcome, mismatched task, replay, atomic rollback when an action receipt is unresolved, and successful retry after reconciliation. The endpoint's HMAC authenticates which configured verifier service submitted the result; it does not prove that external claims are true. Task-specific verifier implementations still require independent evidence review and dedicated end-to-end tests before any worker is registered. Nine structural verifier contracts now exist: `learn.topic_sequence`, `build.requirements`, `learn.assessment`, `learn.goal_clarification`, `build.design_flow`, `learn.practice_material`, `intelligence.define_metrics`, `agents.permissions` and `agents.tool_gates`. All remain unregistered and none fact-checks external claims. The remaining 11 task types have no task-specific verifier yet.

The current approval, lease, action-receipt and registry primitives are still not enough to run tasks. Do not register a handler or enable a worker until the verifier's evidence checks are independently reviewed and the complete API + PostgreSQL negative/positive suite passes.
## Task-specific verifier contracts (not registered)

The feature branch now contains nine unregistered task-specific verifier contracts in `mission-task-verifiers.ts`:

- `learn.topic_sequence`: validates a 3–20 topic sequence, bounded learning objectives and durations, unique topic IDs, prerequisite references that point only to earlier topics, and per-topic coverage by a provenance binding.
- `build.requirements`: validates a 3–15 item requirements brief, bounded descriptions, known priority levels, unique requirement IDs, at least one bounded acceptance criterion per requirement, and per-requirement provenance coverage.
- `learn.assessment`: validates a 3–20 question assessment, bounded unique option IDs, a correct-answer key that points to exactly one offered option, bounded explanations and difficulty levels, and per-question provenance coverage.
- `learn.goal_clarification`: validates a bounded goal statement, success criteria, constraints, source references and exact mission-input provenance.
- `build.design_flow`: validates bounded screen identities, unique navigation edges, a valid start screen, directed reachability of every screen and exact mission-input provenance.
- `learn.practice_material`: validates bounded learning activities, unique IDs, supported activity types, duration limits, required practice and worked-example coverage, and exact mission-input provenance.
- `intelligence.define_metrics`: validates KPI definitions, metric kinds, numerator/denominator semantics, canonical formula consistency, units, grain, reporting periods, syntactically valid dataset-field references and exact mission-input provenance.
- `agents.permissions`: validates explicit workspace/project/resource scopes, a fixed action allowlist, unique permission IDs, rejects wildcard/global scope and requires owner approval for delete, execute, publish, send and export actions; it binds the declaration to the exact mission input.
- `agents.tool_gates`: validates a strict tool allowlist, explicit scopes, tool/operation consistency, safe credential boundaries, rejects wildcard scopes and direct server-secret access, and requires owner approval for every side-effecting or elevated/high-risk tool; it binds the gate declaration to the exact mission input.

All nine use strict version-1 input schemas and independently recompute the SHA-256 digest of the exact mission input description. Their tests cover valid structures, malformed or incomplete output, duplicate identifiers, inconsistent relationships/formulas and forged provenance, plus registry integration.

**Important limitation:** these are structural and input-provenance verifiers only. They do not independently fact-check educational content, validate external sources, inspect actual business datasets, certify product completeness, establish that a proposed plan is optimal, or enforce permissions at runtime. The `agents.permissions` and `agents.tool_gates` adapters validate declarations; a separately reviewed runtime tool gateway must enforce actual scopes, credential boundaries and approval gates before any action. In particular, a `dataset.field` reference is a syntactic reference, not proof that the dataset or field exists. The mission-input digest proves which prompt the output was bound to, not the truth or completeness of claims derived from it. No handler is registered and no worker can execute any of these tasks. The other 11 task types still have no task-specific verifier implementation. Do not treat these adapters as satisfying external-source freshness or factual-evidence release gates.

## Fail-closed worker registry foundation

The registry also validates task, mission, run and owner identifiers as UUIDs before invoking a handler; malformed bindings are rejected before execution. Negative tests cover each identifier.

The new `mission-task-registry.ts` provides a typed, explicit allowlist for future task handlers. A task type is non-executable by default; registering it requires a positive, bounded schema version, a strict input validator, a trusted handler and a separately registered verifier identity/version. Each descriptor carries its input schema version. The registry rejects version mismatches and invalid/unknown input fields before invoking a handler, in addition to duplicate registrations, missing adapters, mismatched verifier identity/version, invalid check sets and inconsistent pass/fail outcomes. Its default exported registry is intentionally empty. Tests cover default-deny behavior, schema-version and input-shape rejection before handler execution, paired handler/verifier execution, duplicate registration and forged verifier identity rejection.

This is a registry contract only: it does not claim database leases, perform external actions, persist proofs or complete tasks. No task handlers are registered, so no mission task becomes executable as a result of this change.

## Not yet implemented

This foundation does **not** yet provide:

- LLM-powered adaptive mission planning or task decomposition (the current starter planner is deterministic and template-based)
- Task execution workers or agent/tool adapters (only the database lease primitives exist)
- Task execution controls and worker lifecycle (approval and cancellation controls are implemented)
- Full retry/resume orchestration and external tool adapters (database lease recovery, retry scheduling and an action-receipt/idempotency foundation only)
- Live production Supabase migration or Edge Function deployment

The starter planner creates a checklist only; it does not execute tasks or call paid AI providers. Action receipts are database coordination records, not an executor: no external action is performed, no worker is running, and uncertain receipts require a separately reviewed external verification workflow before any operator can decide whether a side effect actually occurred. The database completion guards ensure every completed task and mission has a task-scoped passing proof row written by the trusted server role. The trusted proof endpoint now accepts verifier-signed envelopes, recomputes the canonical SHA-256 digest, and calls the atomic proof/attestation/completion RPC. The database does not independently recompute SHA-256 or authenticate an external source. The HMAC authenticates a configured verifier service and binds its message to the worker, lease token and run-specific envelope; it does not prove that the verifier's external-world claims are true. The endpoint is an integration boundary, not an implementation of task-specific evidence verification. No handlers are registered. Nine unregistered structural verifier contracts exist for `learn.topic_sequence`, `build.requirements`, `learn.assessment`, `learn.goal_clarification`, `build.design_flow`, `learn.practice_material`, `intelligence.define_metrics`, `agents.permissions` and `agents.tool_gates`; they check output structure and bind evidence to the exact mission input, but do not independently fact-check content or certify completeness. The remaining 11 task types have no verifier implementation. Do not label a mission as independently verified until each enabled task type has a reviewed verifier that checks inspectable evidence and its negative/positive tests have passed.

## Release gates

Before production use:

1. Review the migration and run a remote dry-run against the intended Supabase project.
2. Obtain explicit project-owner approval before applying the migration.
3. Deploy the Edge Function only after its environment, JWT verification and exact-origin CORS are checked.
4. Add end-to-end authenticated API tests with two distinct live user accounts.
5. Implement execution workers with per-user permissions, bounded retries, idempotency, approvals and recovery.
6. Implement and independently review task-specific evidence verifiers. Each verifier must inspect the actual output/evidence for its task type, reject unverifiable or unsupported claims, define source provenance and freshness where applicable, and test forged, missing, stale, contradictory and malformed evidence. Use the existing signed endpoint and atomic persistence RPC only after the verifier passes review. HMAC identity and canonical digest integrity are necessary transport/integrity controls, not proof of factual correctness.
7. Keep service-role credentials server-side; never expose them to the browser.

No production branch merge, Render deployment, live Supabase schema change or paid provider spend is part of this PR.
