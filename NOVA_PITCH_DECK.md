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
- Exact candidate Main CI and Browser CI passed on pre-doc head `2639072565c7e270b03131890152694e187c0fdb`.
- Browser tests include 360, 390, 412, 760 and 1280 CSS-pixel viewports.
- Main includes syntax/security checks, migration/RLS, Deno, container health smoke and integration tests.
- Four Main live/release checks were skipped; CI is not live-deployment proof.
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
