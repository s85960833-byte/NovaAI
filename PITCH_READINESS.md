# NOVA — Release and Buyer-Discovery Readiness

**Decision: LIMITED DISCOVERY ONLY.** This document is the current release record. It supersedes older readiness notes and contradictory historical status.

## Current release evidence — 8 November 2026

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
