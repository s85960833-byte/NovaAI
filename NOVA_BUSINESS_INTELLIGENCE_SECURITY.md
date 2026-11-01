# NOVA Business Intelligence — Security Gate

**Status:** Design checklist only. This is not an implementation or security certification.

## Current data boundary
- CSV parsing and analysis run in the user's browser.
- Raw imported rows are not sent to NOVA backend endpoints, stored in local storage, or sent to an AI provider by the Business Intelligence workspace.
- Imported data and calculated results are held in page memory and are lost when the page is refreshed or closed.
- Do not use this prototype with confidential, regulated, personal, or production company data until the shared-data controls below are implemented and verified.

## Threat model
Protect against:
1. A user of one company reading another company's records.
2. A logged-out or unauthorized caller invoking business-data APIs.
3. Browser-supplied tenant IDs or role claims being trusted without server verification.
4. CSV formulas, malformed encodings, oversized rows, invalid numbers and malicious text reaching unsafe render or export paths.
5. Secrets, provider service-role keys or customer data appearing in frontend bundles, logs, URLs or error messages.
6. An automation plan being mistaken for an executed action.
7. AI explanations sending company information to an external model without informed user consent.

## Required architecture before shared company data
- Select an approved managed authentication and database provider; no provider or paid tier is approved by this plan.
- Verify access tokens on the server for every protected request.
- Derive organization membership and permissions from trusted server-side records, never from a client-supplied organization ID or role.
- Enforce tenant isolation at both API and database layers (deny by default, row-level policies where supported).
- Keep service-role/database admin credentials server-side only; never expose them to browser code.
- Define organizations, memberships, roles, datasets, analyses, workflow definitions, approval events and audit events with tenant-scoped foreign keys.
- Add least-privilege roles (owner, admin, analyst, viewer) and explicit authorization tests for every role.
- Use managed encryption in transit and at rest; define key rotation and secret rotation procedures.
- Add append-only audit events for sign-in, import, export, analysis, role changes, deletion and future automation approvals.
- Provide company-level export and deletion, retention windows, backup/restore tests and incident response steps.
- Apply per-user and per-tenant rate limits and request-size limits; avoid logging raw CSV contents.
- For AI explanations, show the exact selected fields/summary that will leave the browser, require explicit consent, disclose provider/model, and allow the user to cancel.
- For future integrations, use least-privilege OAuth scopes, encrypted token storage, explicit approval before writes, idempotency keys and recorded execution results.

## Required security tests
- Tenant A cannot read, update, export or delete Tenant B data by changing IDs or request payloads.
- Unauthenticated requests receive 401; authenticated users without the required role receive 403.
- Viewer cannot create or approve workflows; analyst cannot manage memberships; only authorized admins can change roles.
- Revoked sessions and removed memberships lose access immediately or within a documented short expiry window.
- Cross-tenant tests cover every table, API route, export and background job.
- Malformed and oversized CSV imports fail safely without server upload or browser lock-up.
- HTML/script-like cell values render as text and cannot execute.
- No secrets or raw customer rows appear in built frontend files, logs, telemetry or error responses.
- Backup restore, retention expiry, user export and deletion are tested end to end.

## Release decision
Until the required controls are implemented and tested, the product remains a local-analysis prototype. Do not enable shared company storage, invite multiple company users, connect production accounts, or market this as enterprise-ready.
