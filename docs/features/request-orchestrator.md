# Feature Brief — Central Request Orchestrator

**Date:** 14 November 2026 (Asia/Kolkata)  
**Status:** BUILT (routing skeleton); not VERIFIED/LIVE  
**Primary files:** `nova-orchestrator.js`, `nova-server.txt`, `scripts/orchestrator.test.cjs`

## Goal and user story

Classify each user request into a documented capability route and give an honest response when a route has no execution backend, rather than displaying a dead feature or silently pretending it ran.

## Research and source notes

- **VERIFIED — 14 Nov 2026:** source inspection confirms the classifier is integrated into the existing chat route; the output includes route, capability status, execution path, input metadata and route instruction.
- **VERIFIED — 14 Nov 2026:** exact-head Main CI run #43565665119 passed the orchestrator contract test and its capability-boundary checks.
- **UNKNOWN:** no live independent execution runtime exists for Build, durable Agent tasks, Deep Research, secure code execution or full document generation.
- Provider, browser, and content rights are governed by `docs/PROVIDER_RIGHTS_AUDIT.md` and the per-feature briefs; route classification itself does not grant those rights.

## Chosen approach

- Use an in-repository deterministic intent classifier for route selection.
- Keep the current chat history and server-owned provider boundary.
- Route only the capabilities whose underlying route is available.
- Treat Build, Agent, Deep Research and code execution as partial/not implemented; provide bounded chat assistance or a clear limitation.

## Rejected alternatives

- A model deciding to invoke arbitrary tools without a strict allow-list: rejected for security, predictable cost and prompt-injection reasons.
- Displaying every requested route as a working mode: rejected because a route label is not an execution backend.

## Cost per use

**UNKNOWN / not separately measurable.** Classification is local code; downstream AI cost depends on configured model and prompt size, neither of which is measured for live Staging.

## Acceptance criteria and tests

- Classify Hindi, Hinglish and English requests for live search, deep research, code, prompt writing, documents, image, Build and Agent.
- Return explicit capability status and execution boundary.
- Do not claim execution for missing backends.
- Exact-head Main CI run #43565665119 passed the orchestrator test (step 13) and task-specific quality routing checks (step 14).
- Remaining edge cases, live UX and full backend workflows are not complete.

## Rollback

The server can stop injecting the orchestrator route instruction while preserving the existing chat endpoint. Keep feature registry and tests aligned.

## Definition of Done

**Not met.** This is an intent-routing skeleton, not a complete multi-route execution engine.
