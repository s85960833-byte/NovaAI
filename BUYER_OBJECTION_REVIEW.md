# NOVA AI — Remaining Buyer Objection Review

**Review date:** 12 November 2026  
**Scope:** Skeptical CTO, CFO, founder and legal reviewer. This document lists only material objections that remain open based on repository and deployment evidence reviewed to date. It is not an independent due-diligence report.

## CTO — material technical objections

1. **No current-head Staging proof.** Staging is still on commit 195739a; the current PR revision has not been deployed and tested at the staging URL.
2. **Production release not validated.** The PR remains Draft and unmerged. Production is unchanged, as intended.
3. **Public API abuse exposure.** Several AI/API endpoints are reachable without durable per-user authentication and quotas. Current IP throttles are process-local and do not provide hard monthly spend protection.
4. **No end-to-end auth proof.** Signup, email confirmation, password reset, OAuth redirect configuration, two-account isolation and recovery need real staged validation.
5. **Account deletion and retention incomplete.** A verified self-service account deletion flow and published retention schedule are missing.
6. **Backups and recovery unproven.** Supabase backup export and restore, disaster recovery and restore-time objectives have not been demonstrated.
7. **No load/soak evidence.** No repeatable load, concurrency, latency percentile or failure-recovery report is available.
8. **Monitoring incomplete.** No verified centralized error tracking, durable audit log coverage or production SLO evidence.
9. **Integration surface incomplete.** Public API/SDK/webhook contracts, versioning, idempotency and developer onboarding are not complete.
10. **Portability only partly evidenced.** Docker/Compose configuration exists and has a static CI test, but an actual image build and a second-host deployment have not been verified.

## CFO — material commercial objections

1. No verified paying customers, revenue, gross margin, churn, retention or acquisition cost.
2. No validated willingness-to-pay evidence for the proposed plans.
3. Billing, entitlements, invoices, taxes, refunds, cancellations and customer support operations are not production-ready.
4. Third-party AI/search/data commercial rights, quotas and transferability remain unresolved.
5. No complete measured running-cost ledger or usage-based unit economics.
6. No independent cost-to-replicate estimate. The ₹15–20 lakh Tier 1 ask is not supported by current evidence.
7. The ₹10–20 crore Tier 2 aspiration has no traction or comparable-transaction support.

## Founder / product — material market objections

1. Lovable, v0 and Bolt already document natural-language full-stack creation, backend integrations, deployment and related workflows. Broad feature lists are not a moat.
2. NOVA has no independently validated narrow ICP, urgent pain point, repeatable use case or measurable advantage.
3. No permission-based user research, pilot outcomes, activation, retention or product-market-fit evidence.
4. No defensible acquisition channel or customer-support plan.
5. Proposed differentiation hypotheses in MARKET_AND_DIFFERENTIATION_RESEARCH.md are not yet proven unique or validated with users.

## Legal / privacy — material diligence objections

1. Privacy Notice and Terms remain drafts, not counsel-approved policies.
2. India privacy/DPDP applicability, notices, consent, children/minor handling, processor terms, retention and deletion need qualified review.
3. Contributor agreements and a complete copyright/IP assignment chain have not been verified.
4. Full dependency, source, font, icon, image, model and dataset provenance audit remains incomplete.
5. Commercial provider terms, data-processing terms, account ownership and assignment/transfer rights have not been confirmed.
6. No verified custom-domain ownership, email delivery account, payment account or analytics account is included in the current asset inventory.
7. A buyer handover requires adult-authorized representatives and counsel-reviewed transaction documents; TRANSFER_PACK.md is only a draft checklist.

## Release gates before re-rating

- Exact PR-head Main and Browser workflows both pass.
- Staging deploys that exact commit; /health passes; local and public smoke checks pass.
- Owner verifies physical Android layout, drawer, touch targets and microphone behavior.
- Provider-backed AI is tested with an approved account, clear quota/spend protection and permitted commercial use.
- Durable authentication, per-user limits, auditability and account deletion/retention are implemented and tested.
- Backup/restore, load tests, monitoring and second-host deployment are demonstrated.
- Legal, IP, dependency and asset provenance reviews are completed by qualified reviewers.
- Real user research and cost/unit-economics evidence exist before a buyer price or moat claim is published.

## Current decision

**NO-GO for production release and NO-GO for a buyer-ready claim.** Keep PR #98 Draft, keep Production unchanged, and do not represent NOVA as worth ₹15–20 lakh or ₹10–20 crore on the current evidence.


## Latest CI checkpoint — 12 November 2026

PR #98 head `c3ddc3e32423a219c2c456cd92c1cba42b87ed88` passed Main [#43238989690](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989690) (45/45 steps) and Browser [#43238989457](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989457) (16/16 steps) on the exact same SHA. This clears automated CI for the candidate only. It does not clear current-head Staging/live verification, Auth, abuse protection, account deletion/retention, backup/restore, load/monitoring, provider/commercial rights, source/media ownership or legal review. Overall decision remains **NO-GO for production release and NO-GO for buyer-ready claims**.


## Additional direct India competition and evidence — 12 November 2026

The latest public-source review identified Paddlewheel India, BooDoo and NavBharatAI advertising substantial overlap with NOVA's Hindi-English / Indian-language app-builder and assistant positioning. Their own pages/listings describe Indian-language prompts or voice, live app preview/publish, code export/ownership, assistants and Indian payment methods. These are vendor-stated features, not independent technical tests; they nevertheless defeat a broad claim that those capabilities are unique to NOVA.

- Paddlewheel India: https://paddlewheel.dev/in
- BooDoo listing: https://play.google.com/store/apps/details?hl=en_IN&id=ai.boodoo.app
- NavBharatAI: https://navbharatai.com/ and https://navbharatai.com/about

Selected public reviews on Lovable and Bolt also report credit exhaustion during rework, repeat fixes, crashes, export and support friction. These samples are user-generated and self-selected; no market-wide rate or prevalence is inferred. Lovable Play Store: https://play.google.com/store/apps/details?hl=en-IN&id=dev.lovable.build. Bolt Trustpilot explicitly warns its reviews may not be representative: https://www.trustpilot.com/review/bolt.new.

**New founder/product objection:** a generic Hindi-English AI builder is not defensible in India. NOVA needs a reproducible workflow advantage (e.g. transparent change-budget + test/diff/restore evidence) and a benchmark against direct Indian competitors before any differentiated positioning is credible.

**New CFO objection:** selected reviews suggest some users dislike credit limits and non-local payment choices, but this does not prove NOVA can charge a viable price. Local payment support and willingness-to-pay remain untested. No pricing or revenue claims should be made.


## New legal/privacy objection — live account deletion blocker

A read-only live Postgres catalog query found six public foreign-key references to Supabase Auth users using `ON DELETE RESTRICT`, one audit actor reference using `SET NULL`, and one optional workspace backup reference using `CASCADE`. The current account UI deletes only the workspace backup; it does not delete the Auth identity. A blind deletion endpoint could fail on authored BI records or damage shared tenant history if cascades were added without policy. Ownership transfer, authorship/approval treatment, session revocation, Storage deletion and retention remain unresolved. See [ACCOUNT_DELETION_REVIEW.md](ACCOUNT_DELETION_REVIEW.md). Decision remains **NO-GO for customer onboarding and buyer-ready claims**.


## Additional current India competitor objection — 12 November 2026

NavBharatAI publicly describes an app builder that asks clarifying questions before spend, uses a rupee wallet/UPI/card pay-as-you-go model, does not charge for failed builds, and bases stop-build charges on work retained. These are its public claims, not an independent billing audit. Sources: https://navbharatai.com/ai-app-builder, https://navbharatai.com/pricing, https://navbharatai.com/terms.

**Founder objection:** NOVA's proposed Change Budget, failed-edit protection and Hindi/English prompt workflow cannot be sold as unique. The only narrower differentiator currently under test is portable evidence linking exact input bytes, mapping/version, calculation and software tests. It remains unsigned and unbenchmarked.
**CTO objection:** A client-generated SHA-256 digest can reveal an input mismatch when independently recomputed, but it does not authenticate who uploaded a file or prove that the analysis code was untampered. A signed attestation or independent verifier is not implemented.
**CFO objection:** Competitor billing claims do not prove NOVA unit economics. NOVA has no measured provider cost/task, support cost, payment fees, paid conversion or retention. No pricing recommendation is approved.
