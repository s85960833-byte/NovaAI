# NOVA AI — Preliminary Cost-to-Replicate Report

**Date:** 12 November 2026  
**Status:** Planning estimate only; not a vendor quote, independent appraisal, buyer offer or sale price.

## Scope being estimated

The estimate covers a parity rebuild of the current codebase's visible product scope at approximately the current prototype stage: bilingual web workspace/PWA, Express APIs/provider adapters, optional account/sync layer, NOVA BI preview, test/security/CI/container baseline and documentation. It does **not** describe the effort needed to make the product fully production-ready.

## Bottom-up work estimate

Hours below are the author's scope estimates from the current repository/module inventory. They have not been independently measured or quoted by a software agency.

| Workstream | Low hours | High hours |
|---|---:|---:|
| Product discovery, UX and architecture | 120 | 180 |
| Frontend workspace, bilingual UI and PWA | 300 | 420 |
| Express backend, provider integrations and API safety | 280 | 420 |
| Auth, cloud sync, database tenancy and RLS | 220 | 340 |
| NOVA BI analysis, approvals and tenant UI | 240 | 360 |
| QA, security automation, CI, container and browser checks | 240 | 380 |
| Documentation, deployment and transfer preparation | 100 | 180 |
| **Total** | **1,500** | **2,280** |

## Rate evidence and calculation

Clutch's October 2026 software-development pricing guide lists Indian companies in a **US$25–49/hour** band. Wise's historical mid-market conversion page lists **US$1 = ₹93.68 on 12 November 2026**. These are market reference rates, not a quote for NOVA.

- Converted hourly band: about **₹2,342–₹4,580/hour**.
- Low scenario: 1,500 h × US$25 = US$37,500 ≈ **₹35.13 lakh**.
- High scenario: 2,280 h × US$49 = US$111,720 ≈ **₹104.66 lakh**.
- Midpoint illustration: 1,890 h × US$37 × ₹93.68 ≈ **₹65.51 lakh**.

Sources:
- Clutch, Software Development Company Pricing Guide (October 2026): https://staging.clutch.co/developers/pricing
- Wise, USD/INR historical rate for 12 November 2026: https://wise.com/gb/currency-converter/usd-to-inr-rate/history/12-11-2026

## What the estimate does and does not mean

The gross labour parity range of roughly **₹35–105 lakh** is above the requested ₹15–20 lakh Tier 1 target. It indicates that recreating a similar breadth of current scope could require substantial engineering effort. It does **not** establish that Nova is worth ₹35–105 lakh or that a buyer should pay ₹15–20 lakh.

Important limitations:
- Hours are a modelled estimate, not timesheets or a bill of quantities.
- Clutch's published band describes listed Indian software firms; the rate varies by team, quality, scope and contract.
- The estimate excludes GST, contingency, hosting, provider/API charges, domains, payment/email services, legal work, customer acquisition, support, operational monitoring and security certifications.
- It also excludes the additional work required to close current release blockers: Staging deployment, physical device checks, Auth/quota hardening, account deletion/retention, provider rights, source/media IP provenance, load/restore drills and legal review.
- Open-source components and existing products can reduce the amount a buyer needs to rebuild. Buyers can also choose an existing competitor instead of rebuilding NOVA.
- No rights-clean original-code inventory or complete contributor/asset chain of title has been independently established.

## Buyer-value conclusion

The gross rebuild-labour estimate is higher than the Tier 1 ask, but **the risk-adjusted value of the current asset is not determinable**. A buyer would discount for stale Staging, no proven customer/revenue, missing production controls, incomplete licensing/IP evidence and direct Indian competitors with similar broad features.

Therefore:
- ₹15–20 lakh is **not validated as a fair price** by this report.
- This estimate cannot be used in a pitch as guaranteed savings.
- To establish a defensible price, an independent agency must validate the hours and a qualified reviewer must clear ownership, rights, technical risk and transferability.
