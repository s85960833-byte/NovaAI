# NOVA — Non-binding Product Interest Brief

**Purpose:** Early, non-paid product-interest conversations only. This document is not an offer to sell, a valuation, a purchase agreement, or a representation that NOVA is production-ready.

## What NOVA is

NOVA is an India-oriented Hindi-English AI web workspace with three product areas:

- **NOVA Learn:** learning and study workflows.
- **NOVA Build:** digital creation and builder workflows.
- **NOVA Agents:** everyday assistant and agent workflows.

The core application is hosted at https://novaai-4auo.onrender.com.

## What can be explored in a supervised preview

- Bilingual home and workspace navigation.
- Supported chat and learning interactions.
- Selected creation workflows and free-provider image generation, subject to provider availability and quotas.
- NOVA BI only as an early interface preview using synthetic data.

## Current limitations — disclose before any preview

- No verified paying customers, revenue, or commercial traction are being represented.
- Paid checkout, subscription enforcement, refunds and tax-invoice operations are not configured.
- Real account email delivery, redirect configuration, two-account isolation in the live hosted environment, and full account deletion are not yet verified end to end.
- The account/cloud-sync code is deployed and its hosted assets/opt-in UI passed the main live smoke gate, but real signup/confirmation/reset email delivery, Auth redirect allow-list and two-real-account isolation have not been verified end to end. Do not promise that cloud sync is fully production-verified. If enabled, it stores up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions; image attachments themselves are excluded. Sync is off by default.
- General chat history is browser-local by default. If a signed-in user explicitly enables optional cloud sync, the most recent 40 chats and their text/document excerpts, memory and custom instructions are uploaded; image attachments themselves are excluded.
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
- Any discussion of ownership, purchase, payment, contracts, intellectual property or transfer of accounts/assets must be handled by a responsible adult and reviewed by qualified legal support.
- A prospective buyer's interest is not a commitment or proof of product value.

## Current release evidence

- PR #86 merged: live-release gate fix, workspace-sync privilege hardening and pinned Deno CI installation.
- PR #87 merged: this supervised, non-binding product-interest brief.
- PR #88 merged as commit `73467755f2e16eb3b45449c028da8b0e24280c83`; its automated browser/mobile regression checks and PostgreSQL RLS integration checks passed.
- Render's latest verified production deployment is commit `cf29ca10205f929ff836167669de65115c3c37f8` (deployment `dep-dbo5mv3l550s738pq8qg`). The main-branch live smoke gate passed in GitHub Actions run #42475885065. Real Auth email delivery, redirect configuration and two-account cloud-sync isolation remain unverified.
- The previous Render attempt for commit `e743034977ce38aa24a8a892d4ba87f020b3f52a` failed at startup because `toidentifier` was missing. The subsequent successful deployment of `f6a3b643c5e8e8c4bb56bc84c2c9a886d0f016b8` includes the dependency fix; confirm the new main-branch deployment independently.
- Supabase Security and Health Advisors reported zero findings at the latest check. This is not a security certification or a substitute for live end-to-end tenant-isolation testing.

## Latest deployment checkpoint — 8 November 2026, 11:21 UTC

- Render deployment `dep-dbo5m83m8hqs73fkhvtg` completed with status `live` for main commit `7a9530ae32cb674b8724e1aedd30e30a456e9d92`.
- Render build completed successfully; runtime logs show `node nova-server.txt` started and reported port 10000.
- This confirms deployment completion and process startup only. The post-deploy HTTP smoke gate (`/health`, homepage/assets, response security headers, and live feature checks) has not yet been independently confirmed in this checkpoint. Do not claim all runtime checks passed until the main-branch verification workflow finishes successfully.
- Account UI/cloud-sync code is included in the deployed main commit, but real email delivery, Auth redirects, two-account isolation and account deletion remain unverified. Do not promise those capabilities.

**Document status:** Discovery-only draft. Refresh evidence and limitations after each verified deployment and test cycle.


## Superseding deployment correction — 8 November 2026, 11:23 UTC

This section supersedes the earlier statement above that the latest successful deployment was still commit `f6a3b643c5e8e8c4bb56bc84c2c9a886d0f016b8` or that commit `7a9530ae32cb674b8724e1aedd30e30a456e9d92` was the newest deployment.

- Render deployment `dep-dbo5m83m8hqs73fkhvtg` completed successfully for commit `7a9530ae32cb674b8724e1aedd30e30a456e9d92`.
- The subsequent documentation-only main commit `cf29ca10205f929ff836167669de65115c3c37f8` was also deployed successfully as Render deployment `dep-dbo5mv3l550s738pq8qg` at 11:23 UTC; Render reports build and deployment succeeded and status `live`.
- The Render service is configured for branch `main`, auto-deploy enabled, URL https://novaai-4auo.onrender.com, Free plan, Singapore region.
- These Render records confirm successful builds/deployments. They do **not** establish that the external HTTP endpoints, browser flows, real email delivery, authentication redirects, live two-account isolation, or physical Android experience have passed.
- External HTTP smoke verification has not yet been independently completed in this session. Until it passes, describe the hosted app as deployed, not fully runtime-verified or buyer-ready.
- Keep all previously stated limitations and supervised, non-paid discovery boundaries in force.


## Superseding live verification and sync disclosure — 8 November 2026, 11:30 UTC

- Render confirms deployment `dep-dbo5mv3l550s738pq8qg` is `live` for app commit `cf29ca10205f929ff836167669de65115c3c37f8`.
- Main verification [run #42475885065](https://github.com/s85960833-byte/NovaAI/actions/runs/42475885065) completed successfully, including the live website/security/PWA smoke gate, five-viewport browser layout tests, Company Cloud browser tests and free-only image-generation smoke.
- This is automated verification of the deployed app and browser simulations, not a physical Android test or proof of real Auth email delivery/two-account cloud isolation.
- The account/cloud-sync asset is deployed. Sync is opt-in and OFF by default. When enabled, it stores up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions; image attachments themselves are excluded. Avoid syncing sensitive information.
- Continue to treat real email confirmation/reset delivery, redirect allow-list, two-account isolation and complete account deletion as unverified. Keep discovery non-paid and adult-supervised.
