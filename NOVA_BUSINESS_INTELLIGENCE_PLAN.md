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

## Security and persistence gate
The current app has no real login, tenant isolation, business-data database or role-based access. Until a secure persistence/authentication design is implemented and explicitly approved:
- V1 imports and calculations must remain browser-local by default.
- Do not upload raw company CSVs to the server automatically.
- AI explanations must disclose what selected summary/context is sent to the configured model provider and require user action.
- Do not advertise this local-only prototype as enterprise-ready or multi-user.
- Before real company rollout, implement and test authentication, tenant-scoped authorization, server-side validation, encryption in transit/at rest through the selected provider, audit logs, retention/deletion/export and backup/restore.

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
- No paid API or database has been approved.
- Real multi-user/company data storage is blocked until authentication, tenant isolation and persistence are selected.
- AI model/provider availability and free-tier quotas are external dependencies and must be reported honestly.
- Physical Android microphone/camera and touch testing cannot be replaced by CI.
- 3–4 weeks is an estimate, not a guarantee; scope changes or provider/security blockers may extend it.
