# STR Decision Log

Date: 2026-11-19
Product: STR inside the existing Nova AI app
Prompt: STR Final Prompt v3
Branch: feature/str-phase0-foundation-20261119
Production boundary: keep the existing Nova repository and Render service; do not deploy this feature branch to production.

## D-STR-001 — Business model
- Decision: Model 1 — owner-only free.
- Authorization: The owner granted blanket permission to use the safe defaults in the STR v3 prompt on 2026-11-19.
- Consequence: customer build features, paid checkout and customer onboarding remain disabled. The owner's non-personal testing is the only permitted build use until provider routing is verified.
- Revisit: only if the owner explicitly changes the business model.

## D-STR-002 — Retention
- Decision: 7 days.
- Authorization: Use the 7-day v3 default under the owner's blanket permission on 2026-11-19.
- Consequence: STR-local drafts expire after 7 days. Server logs must not store full customer prompts; a later server-side log retention implementation must enforce this period and document restart behavior.
- Revisit: only if the owner explicitly changes the retention policy.

## D-STR-003 — Provider data routing
- Decision: no customer data may be sent to any provider until that provider is verified as paid and no-training for the exact account/tier.
- Current classification: Groq unverified; Cerebras unverified; Gemini free tier unpaid; paid provider not selected.
- Consequence: do not enable customer-data generation, do not invent provider quotas, and block on unknown quota values. Existing Nova chat provider settings must not be silently reused for STR customer data.

## D-STR-004 — Production and rollback
- Decision: all STR changes remain on the existing feature branch and Draft PR #112 until the required checks and owner device review pass.
- Consequence: do not merge to main, change Render settings, add environment variables, create a new service, or trigger production deployment as part of this work.

## D-STR-005 — Dependencies and credentials
- Decision: no new npm dependency and no API key/environment-variable value changes without a demonstrated requirement and explicit review.
- Consequence: keep the first implementation browser-orchestrated and stateless; never request or write secret values into GitHub files.
