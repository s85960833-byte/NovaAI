# NOVA — Non-binding Product Interest Brief

**Purpose:** Early, non-paid product-interest conversations only. This document is not an offer to sell, a valuation, a purchase agreement, or a representation that NOVA is production-ready.

## What NOVA is

NOVA is an India-oriented Hindi-English AI web workspace with three product areas:

- **NOVA Learn:** learning and study workflows.
- **NOVA Build:** digital creation and builder workflows.
- **NOVA Agents:** everyday assistant and agent workflows.

The core application is hosted at https://novaai-4auo.onrender.com. The current production deployment may not include the latest account/cloud-sync implementation; verify the live release before demonstrating or describing those features.

## What can be explored in a supervised preview

- Bilingual home and workspace navigation.
- Supported chat and learning interactions.
- Selected creation workflows and free-provider image generation, subject to provider availability and quotas.
- NOVA BI only as an early interface preview using synthetic data.

## Current limitations — disclose before any preview

- No verified paying customers, revenue, or commercial traction are being represented.
- Paid checkout, subscription enforcement, refunds and tax-invoice operations are not configured.
- Real account email delivery, redirect configuration, two-account isolation and full account deletion are not yet verified end to end.
- Optional cloud sync must not be described as live until the corresponding deployment and live tests pass.
- General chat history is browser-local unless the separately labelled optional cloud-sync feature is deployed and explicitly enabled.
- Render currently uses a Free plan; no always-on guarantee or SLA is offered.
- NOVA BI is a preview. Do not upload confidential, personal, regulated, employee, student or customer data.
- AI outputs and third-party provider availability can be inaccurate, delayed, rate-limited or unavailable.
- Draft privacy and terms documents are not final legal policies.

## Questions for a non-paid discovery conversation

1. Which of the three workspaces, if any, solves a real recurring problem?
2. What alternatives are currently used for that problem?
3. Which workflow would a prospective user want to test again?
4. What security, privacy, reliability and product evidence would be needed before considering adoption?

## Boundaries

- No payment, deposit, subscription, customer onboarding or confidential-data processing is being requested.
- No price, valuation, revenue, customer count, certification, security guarantee, SLA or delivery date is promised.
- Do not share API keys, credentials, private user data, or unrestricted repository access during discovery.
- Any discussion of ownership, purchase, payment, contracts, intellectual property or transfer of accounts/assets must be handled by the responsible adult and reviewed by qualified legal support.
- A prospective buyer's interest is not a commitment or proof of product value.

## Current release evidence

- Main release candidate commit: `914d4fcf3ed72a0de64759c281ec9ff50564101f`.
- PR #86 merged with the live-release gate fix, workspace-sync privilege hardening and pinned Deno CI installation.
- CI run #42471639955 is still validating the merged revision; its live Render gate must pass before the latest release can be represented as deployed.
- Supabase Security and Health Advisors reported zero findings at the latest check. This is not a security certification or a substitute for end-to-end tenant-isolation testing.

**Document status:** Discovery-only draft. Update the evidence and limitations after each verified deployment and test cycle.
