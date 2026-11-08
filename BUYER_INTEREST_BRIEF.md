# NOVA — Non-binding Product Interest Brief

**Purpose:** Adult-supervised, non-paid discovery only. This is not an offer to sell, valuation, purchase agreement, or claim that NOVA is ready for paid production use.

## Product overview

NOVA is an India-oriented Hindi-English AI web workspace:

- **NOVA Learn:** study and learning workflows.
- **NOVA Build:** digital creation workflows.
- **NOVA Agents:** assistant and agent workflows.

**Preview:** https://novaai-4auo.onrender.com

## What a supervised preview may cover

- Hindi-English home screen and workspace navigation.
- Supported chat and learning interactions.
- Selected creation workflows, subject to third-party provider availability and quotas.
- Free-provider image generation, subject to provider availability and quotas.
- NOVA BI / Company Cloud interface preview using synthetic data only.

## Verified engineering evidence

- Current main commit: `94be54b3e94f2dbccb039425b51d936565ab9eed`.
- Render deployment `dep-dbo5sdbm8hqs73fkvnrg` is `live` for that commit. Render logs confirm successful build, app process startup and port 10000.
- GitHub Actions run [#42476098568](https://github.com/s85960833-byte/NovaAI/actions/runs/42476098568) completed successfully. It passed syntax/security checks, PostgreSQL migration and RLS integration tests, Deno and deployed Edge Function checks, BI calculation/CSV tests, AI evaluation fixture validation, dependency audit, local runtime/PWA tests, Chromium browser tests, mobile viewport regression tests and the live smoke gate.
- The live smoke gate in that run occurred before the latest deployment. A fresh post-deployment live smoke verification is still required; direct HTTP checks from the current review environment were unavailable.
- Automated browser/mobile tests do not replace a physical Android device test.

## Important limitations to disclose

- No paying customers, revenue, commercial traction, valuation, security certification or SLA are represented.
- Paid checkout, server-side subscription enforcement, cancellation/refunds, tax invoices and production support are not configured.
- Real account signup/confirmation/reset email delivery, Supabase redirect allow-list and two-real-account cloud-sync isolation have not been verified end to end.
- Full self-service account deletion and a published retention schedule are not available.
- Cloud sync is OFF by default. If explicitly enabled, it stores up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Disabling sync stops future uploads but does not erase the existing cloud backup; the separate delete-backup control is required. Avoid syncing sensitive content.
- Render is on a Free plan in Singapore, one instance, with no always-on guarantee or SLA.
- AI outputs and external provider services may be inaccurate, delayed, rate-limited or unavailable.
- NOVA BI / Company Cloud is a preview. Never use confidential, personal, employee, student, regulated or customer data.
- Privacy notice and Terms of Use are drafts and must not be published as final legal policies.

## Discovery questions

1. Which NOVA workspace, if any, addresses a recurring problem?
2. What alternative do you currently use?
3. Which workflow would you want to test again?
4. What privacy, reliability, support and product evidence would you require before considering adoption?

## Boundaries

- No payment, deposit, paid trial, subscription or customer onboarding.
- No confidential-data processing or unrestricted repository/credential access.
- No promise of price, valuation, revenue, customer count, security guarantee, SLA or delivery date.
- Any discussion of purchase, ownership, intellectual property, accounts, payment or contracts must be handled by a responsible adult with qualified legal support.

**Status:** Limited discovery only. Not approved for paid sale or production customer onboarding.
