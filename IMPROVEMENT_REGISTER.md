# NOVA AI — Selected Improvement Register

**Review date:** 12 November 2026  
**Scoring:** Internal prioritisation only. User value, buyer value and delivery risk use a 1–5 scale; effort uses 1–5 where 1 is small and 5 is large. Scores are engineering judgement, not measured user research. Only selected improvements are listed; weak/unsubstantiated ideas are intentionally omitted.

| Selected improvement | User value | Buyer value | Effort | Risk | Current evidence / status |
|---|---:|---:|---:|---:|---|
| Exact-head Main + Browser CI as release evidence | 5 | 5 | 2 | 1 | Exact candidate `76e8906` passed Main #43251147719 (45 successful, 4 live/release steps skipped) and Browser #43251147695 |
| Currency-suffixed BI CSV auto-mapping | 4 | 4 | 1 | 1 | Exact candidate `76e8906` Browser CI verifies `Amount (INR)` auto-maps and expense analysis returns the expected sample total |
| Safe allowlisted BI sample CSV downloads | 4 | 4 | 2 | 1 | Implemented in PR candidate; runtime smoke covers approved filenames and traversal rejection |
| Synthetic BI samples with deterministic calculation tests | 4 | 4 | 2 | 1 | Implemented; tests call the actual BI analysis functions |
| Source CSV SHA-256 + portable Action Proof bundle | 4 | 5 | 2 | 1 | Exact candidate `76e8906` passed Node SHA-256 test vectors and Chromium verifies the source digest and portable proof bundle; raw CSV excluded, bundle unsigned |
| Full-system architecture and API-surface docs | 3 | 4 | 2 | 1 | Documentation added; public API/SDK/webhooks are explicitly missing |
| Itemised replacement-labour model with public rates | 3 | 4 | 2 | 2 | Report added; hours are estimates, not independent quote/fair value |
| India competitor and user-pain review | 4 | 4 | 3 | 2 | Research documented; claims are vendor statements/reviews are self-selected |
| Weighted buyer-readiness scorecard and objections | 3 | 4 | 2 | 1 | 37/100 internal estimate; serious blockers remain |
| Supabase backup/restore runbook | 3 | 5 | 3 | 2 | Procedure documented; no actual export or restore executed |
| Live account-deletion schema audit | 4 | 5 | 2 | 1 | Read-only catalog found six RESTRICT FKs, one SET NULL and one CASCADE; full deletion remains unimplemented |
| Data Room, transfer and buyer-document cross-links | 3 | 4 | 2 | 1 | Updated; ownership/rights/restore evidence still required |
| Candidate deployment and physical device gates | 5 | 5 | 3 | 2 | Documented; Staging/Health Check Path and owner handset tests still pending |

## Improvement-loop result

The current round improved synthetic demo reproducibility, safe file download, portable source provenance and account-deletion diligence. This does **not** establish a unique moat. The SHA-256 proof bundle and deletion documentation are in a pending candidate and must pass exact-head CI. Two consecutive “no meaningful improvement” rounds have not been demonstrated; the Definition of Done remains open.
