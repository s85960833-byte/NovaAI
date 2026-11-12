# NOVA AI — Data Room Index

**Status:** Internal documentation index only; not evidence of ownership, legal compliance, revenue or buyer readiness.

## Technical
- [Architecture](ARCHITECTURE.md)
- [API reference and missing contracts](API_REFERENCE.md)
- [Phase 1 audit](PHASE1_AUDIT.md)
- [README/setup/deployment](README.md)
- [12-month roadmap](ROADMAP_12_MONTHS.md)
- [Support and incident runbook](SUPPORT_AND_INCIDENT_RUNBOOK.md)

## Security, privacy and rights
- [Supabase security audit](SUPABASE_SECURITY_AUDIT.md) — configuration review only, not a penetration test.
- [API/provider integration audit](API_INTEGRATION_AUDIT.md) — NOT PASSED; commercial use and transfer rights unresolved.
- [Dependency and asset licensing](DEPENDENCY_LICENSE_AUDIT.md) — npm metadata inventory only; Deno/media/source provenance incomplete.
- [India DPDP/privacy review](INDIA_PRIVACY_COMPLIANCE_REVIEW.md) — implementation and qualified legal review required.
- [Privacy notice draft](PRIVACY_NOTICE_DRAFT.md) and [Terms draft](TERMS_OF_USE_DRAFT.md).

## Operations and handover
- [Running costs](RUNNING_COSTS.md) — total cost unknown; invoices not reviewed.
- [Transfer Pack](TRANSFER_PACK.md) — draft; ownership chain, restore and account transfer unverified.
- [Supabase backup/restore runbook](BACKUP_AND_RESTORE.md) — documented only; no export or restore drill performed. SQL dump alone does not include Auth users or Storage objects.
- [Technical Data Room sub-index](data-room/README.md)
- [Current NOVA status](NOVA_STATUS.md)

## Buyer materials
- [Market and differentiation review](MARKET_AND_DIFFERENTIATION_RESEARCH.md) — no exclusive claim approved.
- [Buyer Map](BUYER_MAP.md) — 24 illustrative categories, no confirmed prospects.
- [Pitch kit](NOVA_PITCH_KIT.md), [pitch deck outline](NOVA_PITCH_DECK.md), [demo script](PITCH_SCRIPT.md) — non-paid, adult-supervised discovery only.
- [Buyer feedback outreach templates](BUYER_OUTREACH_TEMPLATES.md) — feedback only, not sale/purchase solicitation.
- [Buyer objection review](BUYER_OBJECTION_REVIEW.md) — serious blockers remain.
- [Buyer readiness scorecard](BUYER_READINESS_SCORECARD.md) — 36.8/100 ≈ 37/100 qualitative estimate, not appraisal.
- [Valuation Memo](VALUATION_MEMO.md) — ₹15–20 lakh fair value unsupported; ₹10–20 crore scenario only.
- [Cost-to-replicate report](COST_TO_REPLICATE.md) — modelled hours and public rate inputs, not an independent appraisal.

## Latest exact-head evidence — 12 November 2026
- PR #98 head `c3ddc3e32423a219c2c456cd92c1cba42b87ed88`; Main [#43238989690](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989690) passed 45/45; Browser [#43238989457](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989457) passed 16/16.
- Main skips live/Production release checks while PR remains Draft/unmerged.
- CI covers synthetic BI calculations, allowlisted sample CSV downloads + path-traversal rejection, Docker health smoke and browser/mobile regression.
- Staging still serves old `195739a04895de364a5af22aa61f930d5d782cbb`, Health Check Path blank.
- Production remains on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`; no Production change occurred.
- Physical Android/microphone, live Auth/two-account isolation, backup restore, provider rights, IP ownership, final legal review, customers/revenue and buyer interest are not evidenced.

## Synthetic demo evidence
- [NOVA BI sample data guide](samples/README.md) documents three fictional CSVs and illustrative arithmetic.
- CI test `scripts/demo-data.test.cjs` verifies expenses, client contribution, team tasks, risk heuristic and Digital Twin arithmetic against the calculation module.
- Demo data are not customer results, user counts, testimonials or benchmarks.

Never place secrets, passwords, service-role keys, personal data, raw customer datasets or private support logs in this repository.


## Buyer evaluation support
- [Why evaluate NOVA?](WHY_EVALUATE_NOVA.md) — internal evaluation brief, not a sale offer.
- [Buyer and technical FAQ](BUYER_FAQ.md) — capability, data, security, billing, ownership and valuation limitations.
- [Selected improvement register](IMPROVEMENT_REGISTER.md) — only selected workstreams and evidence; not user-validated scoring.


## Account deletion and data lifecycle
- [Account deletion/data-lifecycle review](ACCOUNT_DELETION_REVIEW.md) — live catalog found 6 RESTRICT, 1 SET NULL and 1 CASCADE FK to Auth users; full account deletion is not implemented.


## Source-provenance improvement
- The candidate adds an exact uploaded-CSV SHA-256 digest and portable Action Proof JSON bundle. It does not embed the raw CSV; derived analysis may still include user-provided labels/values and row references.
- SHA-256 is an integrity identifier, not a digital signature or identity attestation. The related unit and Chromium checks must pass on the exact head before claiming verification.


## Synthetic demo assets
- [NOVA BI demo data guide](samples/README.md) documents fictional expenses, clients and task data with expected deterministic calculations.
- The Main CI's `scripts/demo-data.test.cjs` validates parsing and calculations against the same core module. The browser proof test independently compares the imported file's SHA-256 with Node's hash.
- Do not represent synthetic outputs as real customer or business results.
