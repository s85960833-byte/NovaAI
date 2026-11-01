# NOVA Business Intelligence — Implementation Plan

## Product goal
Add a separate Business Intelligence workspace to NOVA while preserving the existing chat, voice, image, search, mode workspaces, S-Tier Studio, local history and current UI.

Initial target segment: small IT services companies and software agencies. Do not claim support for every industry in v1.

## Non-negotiable engineering rules
- Never merge or deploy unverified work.
- Never label a feature as working unless its real workflow and failure cases have automated tests.
- Preserve existing local-storage keys and current routes unless a backward-compatible migration is proven.
- No paid provider, API, database, subscription or Render resource without explicit owner approval.
- Never fabricate company data, savings, risk scores, citations, employee output or proof.
- Make data source, calculation, assumptions, confidence and last-updated time visible.
- Default to read-only imports. Require explicit confirmation for any future write/automation.
- Minimize personal employee data; analyze team/workflow aggregates, not invasive surveillance.

## Existing architecture findings (2026-11-01)
- App: single-page HTML/JavaScript frontend in `index.html`.
- Backend: Express in `nova-server.txt`, started with `node nova-server.txt`.
- Existing AI, web search, image and live-data routes are server-side.
- Existing feature bundles: `nova-suite.js`, `s-tier.js`, mode registry/workspace.
- Existing per-IP API rate limit: 60 requests/minute.
- Existing chat/settings are browser-local under legacy key `nova`; mode and studio data are also browser-local.
- No real user authentication, tenant model, durable business-data database, role-based access or audit-log service was found in the reviewed code.
- Render service must not be assumed to have durable local filesystem storage.
- Current GitHub production branch: `main`; implementation branch: `feature/nova-business-intelligence`.

## Feature scope and truthful v1 behavior

### 1. Cost Leak Detector
- Import CSV files in the browser; preview columns and validate dates, currency and amounts.
- Categorize expenses only when the source provides enough information; ambiguous rows remain uncategorized.
- Calculate totals, recurring spend, category changes and anomalies deterministically.
- Show the exact rows and formulas behind each finding.
- AI may explain findings, but cannot invent missing categories or savings.

### 2. Employee Productivity Insights
- Accept project/task exports with team-level or pseudonymous identifiers.
- Calculate cycle time, overdue share, work-in-progress and bottlenecks from supplied timestamps/statuses.
- Do not rank or judge individuals from incomplete data; show coverage and caveats.
- No keystroke, screen, location or hidden employee monitoring.

### 3. Project Risk Predictor
- Begin with explainable rules based on deadline, status, remaining work, blockers and historical cycle time when present.
- Show contributing factors and missing fields; do not call heuristic scores a trained prediction.
- No fabricated probability of failure.

### 4. AI Workflow Automation
- V1 creates an actionable workflow plan and checklist from user-approved context.
- No background jobs, external account actions, email sending, payment, deployment or write access without a separately approved connector and explicit confirmation.
- Each proposed action has an owner, prerequisite, approval state and result field.

### 5. Client Profitability Analyzer
- Calculate revenue minus supplied direct costs, with explicit currency and date range.
- Separate gross contribution from net profit; do not infer overhead or tax.
- Show unallocated costs and incomplete records.

### 6. Company Digital Twin
- Build transparent what-if scenarios from actual imported baselines plus user-entered assumptions.
- Show formulas, baseline, scenario inputs, range/sensitivity and limitations.
- Scenario outputs are estimates, never guaranteed savings or forecasts.

### 7. NOVA Action Proof
- Record input dataset fingerprint, calculation version, test cases, timestamps and pass/fail outcomes.
- Proof means the analysis or generated artifact passed specified checks; it does not prove a company saved money or that a real-world action occurred.
- Include reproducible calculations and downloadable report output.

### 8. Business Dashboard
- Show data coverage, last import, selected date range, key metrics, warnings and links to the underlying rows.
- Distinguish demo/sample data from user-provided data at all times.

## Security and persistence status
- Supabase Auth and a JWT-protected `nova-bi-api` Edge Function are deployed on the approved NOVA BI project.
- Nine tenant tables plus one server-only rate-limit table have RLS enabled. Organization bootstrap, invite acceptance, approval separation and deletion audit writes are guarded by database triggers.
- Cloud save stores dataset metadata and calculated aggregates/evidence only; raw CSV file contents remain in the browser.
- Owner/admin controls include invitations, company branding, workflow approvals, company JSON export and audited deletion of saved analyses/dataset metadata. The API applies 120 requests/user/minute and 5 invitations/user/hour; IP-level abuse monitoring remains a release gate.
- Keep the feature on its isolated branch. Do not market it as enterprise-ready or deploy it until two-account browser testing, email delivery, retention/backup/restore, IP-level abuse monitoring, manual Android checks and production regression are complete.
- The Digital Twin is assumption-based arithmetic, Project Risk is heuristic, and Workflow Automation remains a plan/checklist. None should be described as a validated prediction or live external execution.

## Delivery gates
1. Complete source/route/UI/test audit and record baseline.
2. Build isolated Business Intelligence shell without changing existing screens.
3. Add CSV parsing, schema mapping, validation and deterministic metrics.
4. Add cost, client, productivity and project-risk modules.
5. Add what-if scenarios and approval-based workflow planner.
6. Add reproducible Action Proof and exports.
7. Add dashboard, accessibility/mobile behavior and security checks.
8. Run unit, malformed-input, privacy, integration, regression and live smoke tests.
9. Deploy only after CI is green; verify production routes and manual Android interactions separately.

## Known limits and open decisions
- The approved Supabase project is configured; no paid upgrade or external provider purchase has been authorized.
- Real SMTP invitation delivery depends on Supabase Auth email-provider configuration and needs a two-account end-to-end test.
- External accounting, CRM, HR and project-management integrations are not implemented.
- Custom domains/full brand removal and live workflow execution are not implemented.
- Retention, backup/restore and incident-response procedures need owner review.
- Physical Android touch/accessibility and production live smoke tests cannot be replaced by CI.
- 3–4 weeks is an estimate, not a guarantee; release remains blocked until the stated gates pass.


## Implementation progress update (2026-11-01)
- Dashboard now reports accepted source rows, calculation coverage, invalid field records and CSV structure warnings; warnings can be expanded for review.
- Project-risk results display the actual contributing heuristic factors instead of requiring users to inspect raw JSON.
- Expense, client and team analysis results include original CSV source-row references so users can trace totals back to imported records.
- CSV parsing preserves original source line numbers even when malformed rows are excluded.
- ISO calendar dates are validated (e.g. impossible dates are rejected); missing task statuses are excluded from completion denominators and counted as invalid.
- Numeric overflow now fails safely instead of allowing Infinity into exports.
- Tests cover these behaviors, including malformed-row source references and dashboard accessibility status announcements.
- Verified code commit `d2671cc94416226e796951f59b14de655f163fee`; GitHub Actions run [41326890751](https://github.com/s85960833-byte/NovaAI/actions/runs/41326890751) passed 36/36 BI tests, PostgreSQL 17 migration/RLS integration, Deno type-check, Edge Function auth/CORS smoke checks, local server/PWA checks and the Playwright mobile Company Cloud flow.


## Security implementation checkpoint (2026-11-01)
- The user approved Supabase project `qrfwsewppafhxibdboam`; nine migrations and nine RLS-protected NOVA BI tables are deployed. The separate Research-to-Code project remains untouched.
- Supabase Security Advisor reports zero findings. Edge Function `nova-bi-api` is ACTIVE at version 12 with JWT verification enabled.
- Live transaction-scoped RLS checks passed for owner bootstrap, tenant isolation, viewer write/delete denial, analyst approval/branding denial, admin approval separation and owner-role escalation denial, invitation acceptance and audited deletion. All test rows/users were rolled back and follow-up counts confirmed zero leftovers.
- `NOVA_BUSINESS_INTELLIGENCE_SECURITY.md` now documents implemented controls and remaining security/release gates; it is not a security certification.
- Keyboard focus trapping, Escape-to-close, focus restoration, visible focus styles and current-page navigation semantics are implemented and covered by mobile Playwright CI.
- Remaining gates: real account signup/email confirmation, real two-account invitation/email flow, Auth SMTP/redirect configuration, retention/backup/restore, rate limiting, manual Android/accessibility/performance checks and production regression/live smoke tests.
- Keep PR #46 Draft and production unchanged until the remaining gates pass and the owner explicitly approves release.
