# NOVA AI — Data Room Index (Draft)

**As of:** 12 November 2026  
**Repository:** https://github.com/s85960833-byte/NovaAI  
**Status:** Internal evidence index only. Not proof of ownership, compliance, revenue or buyer readiness.

## Product and engineering

| File | Contents | Status |
|---|---|---|
| README.md | Local Node setup, Docker/Compose and Render deployment | Draft; Docker CI build/health smoke passed; second host not tested |
| NOVA_BUSINESS_INTELLIGENCE_ARCHITECTURE.md | NOVA BI module architecture | Module-specific, not full-system architecture |
| PHASE1_AUDIT.md | Source, route, UI, deployment and security findings | In progress; not a complete live audit |
| SUPPORT_AND_INCIDENT_RUNBOOK.md | Incident/support procedures | Draft; no staffed support owner or SLA |
| Dockerfile, docker-compose.yml, .dockerignore | Container packaging | CI build and health smoke passed; no alternate-host deployment |

## Security, privacy and data

| File | Contents | Status |
|---|---|---|
| API_INTEGRATION_AUDIT.md | Provider inventory, quotas and commercial-rights risks | NOT PASSED; rights and transferability unverified |
| SUPABASE_SECURITY_AUDIT.md | Read-only RLS, grants, function and Advisor review | Configuration review passed with limitations; not penetration tested |
| DEPENDENCY_LICENSE_AUDIT.md | npm lockfile licence metadata | Preliminary npm metadata pass; Deno/source/asset provenance incomplete |
| INDIA_PRIVACY_COMPLIANCE_REVIEW.md | India privacy/DPDP preparation | Requires qualified legal review and implementation |
| PRIVACY_NOTICE_DRAFT.md | Draft privacy notice | Not final legal policy |
| TERMS_OF_USE_DRAFT.md | Draft terms | Not final legal policy |
| TRANSFER_PACK.md | Technical handover checklist | Draft; ownership and restore proof outstanding |

## Market and buyer materials

| File | Contents | Status |
|---|---|---|
| MARKET_AND_DIFFERENTIATION_RESEARCH.md | Official competitor documentation and hypotheses | Desk research; no unique-market claim approved |
| BUYER_MAP.md | 24 buyer categories, illustrative companies and strategic-use hypotheses | Desk research only; no confirmed prospects or buyer interest |
| BUYER_INTEREST_BRIEF.md | Supervised non-paid preview brief | Discovery only; no purchase/customer claim |
| PITCH_READINESS.md | Release gates and allowed demonstration scope | LIMITED DISCOVERY ONLY; NOT READY FOR PAID SALE |
| NOVA_PITCH_KIT.md, PITCH_SCRIPT.md | Intro, safe demo and buyer-interest conversation material | Adult-supervised, non-paid discovery only |
| BUYER_OBJECTION_REVIEW.md | Remaining CTO/CFO/founder/legal objections | Open objections remain; NO-GO |
| VALUATION_MEMO.md | Cost, comparable and revenue-scenario framework | Evidence-limited; ₹15–20 lakh unsupported; ₹10–20 crore aspiration only |

## Current evidence checkpoint

- PR #98 candidate cd073c966d9a00bbb922ef3e12be4db1660b1723 is Draft and unmerged.
- Main CI: 47/47 steps passed. Browser CI: 16/16 steps passed on the same candidate.
- BUYER_MAP.md documents 24 illustrative buyer categories; no company is a confirmed prospect and no interest is claimed.
- Production main and Production Render were not changed by this candidate.
- Staging still needs current-head deployment and live smoke verification; Health Check Path was blank at last Render inspection.
- No verified customers, revenue, active users, testimonials, uptime SLA, commercial API rights, independent valuation or buyer interest are represented.

## Handling rules

- Never store API keys, passwords, database URLs with credentials, service-role keys, personal data, user content or private support logs here.
- Do not share externally until a responsible adult and qualified counsel review ownership, privacy, third-party rights and recipient access.
- Asset transfer, account ownership, payment, contracts or IP assignment must be handled by a responsible adult with qualified legal support.
