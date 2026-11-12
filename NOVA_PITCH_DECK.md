# NOVA AI — Buyer Preview Deck (Evidence-Limited)

**Status:** Draft presentation outline for supervised, non-paid discovery. Not an offer, appraisal or acquisition solicitation. Any transaction/ownership discussion must be handled by a responsible adult with qualified legal review.

## Slide 1 — NOVA AI
Hindi-English AI workspace for learning, building and assistant workflows.
- NOVA Learn
- NOVA Build
- NOVA Agents
- Existing preview: https://novaai-4auo.onrender.com

## Slide 2 — Product surface
- One browser workspace organizes learning, creation and assistant tasks.
- Bilingual UI and mobile-first layout are the product direction.
- Chat and settings are browser-local by default.
- Optional Supabase cloud backup is explicit opt-in and OFF by default.

## Slide 3 — Technical foundation
- Node.js 22 + Express backend.
- Modular browser app and PWA assets.
- Supabase Auth and RLS-protected BI data layer.
- NOVA BI preview: deterministic CSV analysis, source-row evidence, role-based tenant workflows, approvals and audit records.
- Docker/Compose packaging, CI, PostgreSQL migration/RLS tests, browser regression and SBOM generation.

## Slide 4 — What has been tested
- Latest PR candidate `c3ddc3e32423a219c2c456cd92c1cba42b87ed88`: Main [#43238989690](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989690) passed 45/45; Browser [#43238989457](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989457) passed 16/16.
- Main includes syntax/security, RLS migrations, Deno, vulnerability audit, deterministic synthetic NOVA BI demo-data tests, allowlisted demo downloads, path-traversal rejection and Docker health smoke.
- Browser workflow covers account/Company Cloud/mobile interaction. Chromium screenshots are not physical Android certification.
- Main live/Production release checks remain skipped while PR #98 is Draft/unmerged. CI is not live-deployment proof.
- Physical Android and microphone checks remain outstanding.

## Slide 5 — Potential differentiation (hypotheses, not moat claims)
- Evidence-first generated outputs with provenance and replayable validation.
- Hindi-English learning-to-building workflow.
- Human-approved SMB decision trace.
- Portable project handoff pack.
- Each requires competitor benchmark and genuine user validation.

## Slide 6 — Why a partner might evaluate it
- A codebase and UX foundation that could be adapted for a defined workflow.
- Reusable modules and automated verification to reduce some initial setup work.
- No proven cost-to-replicate figure, user demand or buyer willingness-to-pay exists.
- Any evaluation must first clear IP, provider terms, privacy, security and deployment gaps.

## Slide 7 — Current limitations
- PR #98 is Draft/unmerged; Staging still runs an older commit.
- AI chat was 503 on old Staging because no provider key was configured.
- Express API auth defaults OFF; durable quotas/spend caps and billing are absent.
- Account deletion/retention, backup/restore, provider commercial rights, asset provenance and legal approval incomplete.
- Render Free has no uptime SLA; no customers/revenue/traction are evidenced.

## Slide 8 — What evidence comes next
1. Deploy and verify exact candidate on existing Staging URL.
2. Complete physical Android/mic tests.
3. Enable/test API authentication, durable usage quotas and account deletion.
4. Clear provider contracts, source/media IP provenance and privacy/legal review.
5. Run supervised user research and comparable workflow benchmarks.
6. Reassess cost-to-replicate and valuation independently.

## Appendix — valuation honesty
- Tier 1 ₹15–20 lakh is unsupported today.
- Tier 2 ₹10–20 crore is an aspiration, not a present valuation or guarantee.
- No verified customer, revenue, buyer interest or independent appraisal.
- Any numbers in the Valuation Memo are clearly labeled scenarios, not forecasts.


## Market reality update — 12 November 2026

Direct Indian products [Paddlewheel](https://paddlewheel.dev/in), [BooDoo](https://play.google.com/store/apps/details?hl=en_IN&id=ai.boodoo.app) and [NavBharatAI](https://navbharatai.com/) publicly advertise overlapping Hindi/Indian-language app creation, live preview/deploy, code export and assistant/payment capabilities. NOVA does not claim these as exclusive. Selected Lovable/Bolt reviews mention credit/rework and reliability/export friction, but self-selected reviews do not establish overall market prevalence or willingness to pay.

The preliminary gross rebuild-labour estimate is ₹35–105 lakh, using a 1,500–2,280 hour scope model and published India agency rates. This is not independent appraisal or guaranteed buyer savings. ₹15–20 lakh remains unsupported as fair price; current buyer-readiness estimate is 37/100. See COST_TO_REPLICATE.md and MARKET_AND_DIFFERENTIATION_RESEARCH.md.


## Latest evidence update — 12 November 2026

The latest PR candidate `c3ddc3e32423a219c2c456cd92c1cba42b87ed88` passed Main 45/45 and Browser 16/16. NOVA BI candidate code includes fictional expense/client/task CSVs, deterministic checks and a safe allowlist for the three downloads. Samples are not customer outcomes. The Supabase backup/restore procedure is documented, but no backup export or restore has been executed. Staging still serves the older `195739a` commit; these additions are not live-verified.


## Candidate enhancement — portable Action Proof

The PR candidate adds a SHA-256 digest of the exact uploaded CSV bytes and an exportable JSON bundle linking that digest to the column mapping, row counts, calculation version, software checks and calculated analysis. This can support reproducibility checks when a reviewer retains the original input; it is not a digital signature or identity attestation. The raw CSV bytes are not included in the bundle, but derived labels/values may be, so inspect before sharing. New exact-head unit/Chromium tests are pending.


## Demonstration assets — synthetic data only

The preview includes three fictional CSV files under `samples/`: expenses, client revenue/direct costs, and team tasks. All names and rows are synthetic. The calculation tests verify arithmetic but do not establish real-world savings, employee productivity or customer profitability. Review the sample guide at `samples/README.md` before presenting the demo.
