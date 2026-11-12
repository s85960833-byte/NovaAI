# NOVA — Release and Buyer-Discovery Readiness

**Decision: LIMITED DISCOVERY ONLY.** This document is the current release record. It supersedes older readiness notes and contradictory historical status.

## Historical release evidence — 8 November 2026 (superseded by the checkpoint below)

- Production: https://novaai-4auo.onrender.com
- Main application commit deployed: `94be54b3e94f2dbccb039425b51d936565ab9eed`
- Render deployment: `dep-dbo5sdbm8hqs73fkvnrg`, status `live`.
- Render build completed; runtime logs confirm `node nova-server.txt` started and reported port 10000.
- Main verification run [#42476098568](https://github.com/s85960833-byte/NovaAI/actions/runs/42476098568) passed. It included syntax/security checks, PostgreSQL migrations and RLS integration, Deno and deployed Edge Function checks, BI calculations/CSV validation, AI evaluation fixture validation, production dependency audit, local runtime/PWA, graceful shutdown, Chromium browser tests, mobile viewport regression, live smoke and free-only image generation.
- Important timing limitation: the above live smoke step ran before deployment `dep-dbo5sdbm8hqs73fkvnrg`. A fresh post-deployment HTTP/browser smoke is still needed to verify that exact deployment. Direct HTTP checks from the current review environment were unavailable.
- Automated browser tests do not replace physical testing on the target Android phone.

## What may be demonstrated

- Bilingual home and workspace navigation.
- NOVA Learn, NOVA Build and NOVA Agents.
- Supported chat, learning and creation flows.
- Free-provider image generation only when it actually succeeds; disclose provider quotas and possible outages.
- Account UI as an opt-in feature, while clearly stating that real email delivery, redirects and two-account isolation are not yet proven.
- NOVA BI / Company Cloud as an interface preview only, using synthetic data.

## Account and data behaviour

- Chat history is browser-local by default.
- Optional account cloud sync is OFF by default.
- If explicitly enabled, the current snapshot stores up to 40 recent chats (up to 150 messages each), chat/message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded.
- The Account UI and opt-in confirmation disclose this scope. Users should not sync sensitive information.
- Disabling sync stops future uploads but does not delete an existing cloud backup; the separate delete-backup control is required.
- The app uses Supabase Auth and a per-user workspace table with RLS. Automated migration/RLS tests passed.
- Still unverified end to end: real signup/confirmation/reset email delivery, Auth Site URL/redirect allow-list, two real accounts proving cross-account isolation in the hosted app, and full account deletion/retention handling.

## Open release gates

1. Post-deployment live smoke for the exact deployed commit.
2. Real signup, sign-in, confirmation email, password reset and resend flow using approved test accounts.
3. Two-account live isolation test: account A must not read/write account B's workspace and vice versa.
4. Complete account deletion, retention schedule and support-based deletion process.
5. Physical Android testing for full-width portrait layout, touch, keyboard, drawer, dialogs, accessibility, low-network behaviour and local chat compatibility.
6. Backup/export and restore drill, including recovery ownership.
7. GitHub main-branch protection and required checks.
8. Payment provider, server-side subscription entitlements, metering, cancellation, refunds and tax invoices — none is approved or configured.
9. Final privacy notice, Terms, age policy, support contact and incident process approved by the responsible operator and qualified legal support.
10. AI quality, citation accuracy, latency, provider failure rate and unit-cost evaluation under approved quotas.
11. Hosting decision: Render Free plan, Singapore region, one instance, no always-on guarantee or SLA. Decide whether paid always-on hosting and monitoring are required before onboarding.

## NOVA BI / Company Cloud

Preview only. Use synthetic data. Do not accept confidential, personal, employee, student, regulated or customer data. Treat generated risk scores and workflow suggestions as advisory, not verified facts or executed external actions.

## Commercial boundary

No paying customers, revenue, traction, valuation, security certification or SLA are represented. Only non-paid, adult-supervised buyer-interest discovery and synthetic-data previews are appropriate. No payments, deposits, paid onboarding or confidential-data processing. Any purchase, ownership, intellectual-property transfer, payment or contract discussion must be handled by a responsible adult with qualified legal review.

## Owner-controlled requirements

SMTP/domain settings, Supabase Auth URL allow-list, physical Android testing, hosting/merchant account decisions, legal approval, support ownership, backup destination and restore access require the responsible account owner. No paid plan or cost-bearing setting should be changed without explicit approval.

**Final readiness label: NOT READY FOR PAID SALE OR PRODUCTION CUSTOMER ONBOARDING. LIMITED DISCOVERY ONLY.**


## Newly identified cloud-sync conflict defect — 8 November 2026

Code review of `nova-account.js` and `nova-app.js` found that when a chat with the same ID exists locally and remotely, the local copy unconditionally replaces the remote copy during merge. Newer messages added on another device can therefore be lost on the next sync. Saved memory and custom instructions are imported only when the local values are empty, so edits made on another device may not propagate. This is a confirmed multi-device sync limitation, not merely a missing test. Do not describe cloud sync as conflict-safe or rely on it for important data until merge semantics are repaired and regression-tested.


## Cloud-sync patch status — 8 November 2026

A follow-up patch now merges remote and local chat histories by their shared sequence overlap rather than globally deduplicating identical message text. This preserves legitimate repeated messages (for example, the same short reply sent twice) while appending local messages that follow the remote overlap. This is still a candidate code change, not a verified release: automated regression, browser, two-device concurrency, document-conflict, deletion/tombstone and live hosted-account tests have not yet passed. The implementation retains the local document when both copies differ because the current snapshot schema has no reliable per-document version or timestamp; memory/custom-instruction conflict resolution also remains limited. Do not claim conflict-safe multi-device sync until those tests and versioned conflict handling are complete.


## Current exact-head checkpoint — 12 November 2026

- Repository Production main: bdbeb20881f9b6cef51ff5a9d8a3b80131079a50.
- Production Render deployment: dep-dbom7bbm8hqs73ec2gi0, live commit c3cee61906b88ff111b3a645db55c9c2503cd8f7. Production has not been changed by PR #98.
- PR #98 candidate cd073c966d9a00bbb922ef3e12be4db1660b1723 passed Main workflow #43206866629 (47/47 steps) and Browser workflow #43206866508 (16/16 steps). Main includes SBOM generation/validation, PostgreSQL migration/RLS tests, Deno checks, Docker image build and /health smoke, runtime/PWA and browser regression; Browser covers account/privacy/opt-in sync and mobile/drawer flows.
- Staging service srv-dbqm035g1s2s73eogao0 still serves commit 195739a04895de364a5af22aa61f930d5d782cbb. Health Check Path is blank. The PR candidate is not live on Staging and has not passed a current-head public smoke test.
- Supabase read-only review: 17 migrations; 11/11 public tables have RLS; no anon table grants; 24 policies; audit-event SELECT limited to active owners/admins; eight SECURITY DEFINER functions restricted to service_role; nova-bi-api ACTIVE v14 with JWT verification. Security/Health Advisors had no lints; 13 unused-index INFO notices were not changed. All inspected application tables report zero rows.
- The candidate cloud-sync merge has unit/regression tests for message overlap, timestamp conflicts, explicit clears and document deletion. These are code-level tests only; two-device hosted concurrency, interrupted sync recovery, account deletion and retention are still unverified.

## Current release decision

**LIMITED DISCOVERY ONLY. NOT READY FOR PAID SALE OR PRODUCTION CUSTOMER ONBOARDING.** Keep all previews synthetic/non-sensitive, adult-supervised and non-paid. No payment, deposit, paid trial, customer onboarding or confidential-data processing. Any purchase, ownership, IP, account-transfer, payment or contract discussion must be handled by a responsible adult with qualified legal review.
