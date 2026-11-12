# NOVA AI — Selected Improvement Register

**Review date:** 12 November 2026  
**Scoring:** Internal prioritisation only. User value, buyer value and delivery risk use a 1–5 scale; effort uses 1–5 where 1 is small and 5 is large. Scores are engineering judgement, not measured user research. Only selected improvements are listed; weak or unsubstantiated ideas are intentionally omitted.

| Selected improvement | User value | Buyer value | Effort | Risk | Current evidence / status |
|---|---:|---:|---:|---:|---|
| Exact-head Main + Browser CI as release evidence | 5 | 5 | 2 | 1 | Implemented; Main 45/45 and Browser 16/16 on `c3ddc3e` |
| Secure allowlisted BI demo CSV downloads | 4 | 4 | 2 | 1 | Implemented in candidate; runtime smoke tests known filenames and rejects unknown/traversal requests |
| Synthetic BI sample datasets with calculation tests | 4 | 4 | 2 | 1 | Implemented; 5 tests use actual deterministic BI calculation functions |
| Full-system architecture and API-surface documentation | 3 | 4 | 2 | 1 | Documentation added; public API/SDK/webhooks are explicitly marked missing |
| Itemized replacement-labour model with public rate inputs | 3 | 4 | 2 | 2 | Report added; hours are estimates, not independent quote/fair value |
| Direct Indian competitor and user-pain review | 4 | 4 | 3 | 2 | Research documented; competitor claims are vendor statements and reviews are self-selected |
| Weighted buyer-readiness scorecard and current objections | 3 | 4 | 2 | 1 | 37/100 internal estimate; critical blockers remain |
| Owner-controlled Supabase backup/restore runbook | 3 | 5 | 3 | 2 | Procedure documented; real export/restore not run |
| Data Room, transfer and buyer documentation cross-links | 3 | 4 | 2 | 1 | Updated; ownership/rights/restore evidence still required |
| Candidate deployment and physical-device verification gates | 5 | 5 | 3 | 2 | Documented; owner Health Check Path and physical Android work remain pending |

## Improvement-loop result

The latest round found meaningful improvements in evidence traceability, synthetic demo reproducibility, safe file download and recovery documentation; these were added to the PR branch and verified by CI where noted. It did **not** find a proven exclusive market moat. Two consecutive “no meaningful improvement” rounds have not been demonstrated. The overall Definition of Done remains open.
