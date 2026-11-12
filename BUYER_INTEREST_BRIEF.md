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

- Repository Production main is `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; Production Render remains on `c3cee61906b88ff111b3a645db55c9c2503cd8f7` via live deployment `dep-dbom7bbm8hqs73ec2gi0`.
- PR #98 candidate `cd073c966d9a00bbb922ef3e12be4db1660b1723` passed Main workflow [#43206866629](https://github.com/s85960833-byte/NovaAI/actions/runs/43206866629) (47/47 steps) and Browser workflow [#43206866508](https://github.com/s85960833-byte/NovaAI/actions/runs/43206866508) (16/16 steps).
- PR #98 remains Draft and unmerged. Staging is still on commit `195739a04895de364a5af22aa61f930d5d782cbb`, not the candidate head; its Render Health Check Path is blank. No latest-head Staging/live smoke claim is made.
- Automated browser/mobile tests do not replace physical Android and microphone checks.

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


## Newly identified cloud-sync conflict defect — 8 November 2026

Code review of `nova-account.js` and `nova-app.js` found that when a chat with the same ID exists locally and remotely, the local copy unconditionally replaces the remote copy during merge. Newer messages added on another device can therefore be lost on the next sync. Saved memory and custom instructions are imported only when the local values are empty, so edits made on another device may not propagate. This is a confirmed multi-device sync limitation, not merely a missing test. Do not describe cloud sync as conflict-safe or rely on it for important data until merge semantics are repaired and regression-tested.


## Cloud-sync patch status — 8 November 2026

A follow-up patch now merges remote and local chat histories by their shared sequence overlap rather than globally deduplicating identical message text. This preserves legitimate repeated messages (for example, the same short reply sent twice) while appending local messages that follow the remote overlap. This is still a candidate code change, not a verified release: automated regression, browser, two-device concurrency, document-conflict, deletion/tombstone and live hosted-account tests have not yet passed. The implementation retains the local document when both copies differ because the current snapshot schema has no reliable per-document version or timestamp; memory/custom-instruction conflict resolution also remains limited. Do not claim conflict-safe multi-device sync until those tests and versioned conflict handling are complete.


## Cloud-sync verification update — 12 November 2026

The current PR candidate adds regression coverage for newest-chat selection, overlapping message histories, timestamp-based memory/custom-instruction edits and explicit clears, plus explicit document deletion. Main and Browser CI have passed on candidate `eb258ba4e81a873537aaa8a53576955a726bcff3`. These are code-level tests only: real two-device Supabase concurrency, recovery after interruption and account deletion/retention remain unverified. Do not claim fully conflict-safe multi-device sync.


## Latest candidate evidence — 12 November 2026

The PR candidate passed Main CI 47/47 and Browser CI 16/16. The same candidate contains Docker packaging and health smoke coverage, a read-only Supabase security audit and a 24-category buyer map. This does not mean the candidate is deployed: Staging still serves the older commit and its health-check path is blank. The current production URL is unchanged.

The buyer map is illustrative only. No company is a confirmed prospect, no buyer interest is evidenced, and no outreach or sale discussion has occurred. Discovery remains adult-supervised, non-paid and limited to non-sensitive/synthetic data.
