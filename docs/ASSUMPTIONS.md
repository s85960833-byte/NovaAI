# NOVA Indian Study & Work Upgrade — Engineering Assumptions

**Recorded:** 15 November 2026  
**Branch:** `feature/nova-indian-study-work-phase0-20261115`

These assumptions keep the upgrade additive and reversible. When evidence changes one of them, update this file with the reason and a dated decision record.

## Product and scope

1. NOVA remains the existing product. Existing chat, live retrieval/search, voice, image generation, file/PDF, saved chats, memory, settings, splash, entry screen, workspace navigation, account and Study Mode behavior are compatibility requirements.
2. The active source currently shows three workspace cards and 13 registered assistant modes (7 Learn, 1 Build, 5 Agents). The master prompt's reference to four original categories and six India-specific features is treated as a preservation requirement, not permission to reconstruct or rename anything without a source-level mapping.
3. NOVA Learn is the first new product workflow. Version one targets adult tutors/coaching teachers and CBSE-aligned practice material. Student-facing features will use minimal data and teacher/guardian-managed accounts where accounts are required.
4. NOVA Build is initially disabled behind an explicit environment feature flag. Existing BI preview behavior is preserved; it is not silently replaced by the new PDF/XLSX pipeline.
5. NOVA Agents is limited to a clearly labeled Coming Soon/waitlist capability until a real, reviewed agent workflow exists. Existing chat/voice/document/scheme/shopkeeper modes remain available.
6. Existing Business Intelligence and Company Cloud are kept as separate existing capabilities; they are not evidence that new Nova Build reports, exports or SaaS-level business readiness are already complete.

## Architecture and implementation

7. Retain Node.js 22, Express 4, the configured `nova-server.txt` entry point, current modular vanilla-JS frontend, and the existing Supabase/Auth setup. No framework rewrite is justified by current evidence.
8. Treat `nova-server.js` as a legacy alternate implementation. Do not switch the Render start command or merge its routes without a parity review.
9. New modules, endpoints, DB tables and UI are additive. Prefer independent modules, explicit feature flags and small migrations. No large-file rewrite or broad cleanup during the foundation phase.
10. Existing localStorage keys and stored data shape—especially `nova`, `nova_suite_v1`, splash completion markers and cloud-sync preferences—are backward-compatibility contracts until regression tests prove otherwise.
11. Uploaded documents and tabular data are untrusted content. Their contents are data, never instructions; all external links, formulas, HTML and embedded prompt-like content are handled defensively.
12. PDF text extraction is supported first. OCR is not added unless measured memory/runtime performance on the existing Render Free service proves reliable; otherwise scanned-PDF users receive a precise, bilingual unsupported-scan message.
13. New AI-backed outputs must be validated before use. A schema-valid response is not automatically factually correct; source references and an independent verification step remain required for Learn/Build outputs.
14. Business metrics such as totals, trends and anomalies are computed by deterministic code from validated input rows. The LLM may explain the computed facts but may not invent or calculate source-of-truth numbers.
15. Long-running generation will use durable storage only after the existing database's ownership, RLS, migration history, retention and restart behavior are reviewed. Render Free in-memory state is not treated as durable job storage.

## Free-tier and cost

16. No paid external API, paid SaaS, paid hosting, subscription or paid model is introduced. Check current free-tier eligibility and quotas before choosing a provider; do not describe a provider as free merely because a free trial exists.
17. Do not create new Render services, databases, storage buckets or other billable resources without an explicit cost review and authorized adult approval. Existing Render Free remains the assumed hosting target; its cold-start/sleep behavior is documented rather than hidden.
18. Existing provider integrations and fallbacks are preserved during Phase 0. Provider self-tests are run only when an authorized, bounded, non-billable diagnostic is configured; they must not generate unexpected paid usage.
19. Razorpay code, where eventually justified, must remain TEST-mode only and disabled by default. Live payment keys, merchant activation, pricing contracts, receipts, tax handling, refunds and any customer-money flow require the authorized account owner and responsible adult; never request secret values in chat.

## Data, privacy and compliance

20. Analytics use a first-party database table and minimal event payloads. No third-party analytics service or ad tracking is introduced.
21. No student profiling, behavioral advertising or unnecessary personal data collection. Keep student records minimal and adult-managed. Customer/tutor interviews require consent and must not include confidential student records.
22. Current privacy/terms files remain drafts. New policy copy is plain-language draft material, not legal advice or a claim of DPDP compliance; responsible adult owner and qualified Indian counsel must review before launch.
23. Account deletion, retention and backup restoration must be designed and tested before representing these controls as complete. Existing cloud backup deletion is not equated with full account deletion.
24. Do not repurpose or mutate the existing NOVA BI Supabase project for new product data until schema boundaries, migrations, RLS, tenant ownership, retention and privacy design are reviewed. Do not apply migrations to a live project during Phase 0.

## Release and workflow safety

25. Production branch `main`, production Render service `srv-dbidhpc9v7es73d6ia80` and its existing URL are protected. No direct main commit, force push, production deploy, Render setting update, live Supabase migration, secret rotation or destructive action is part of Phase 0.
26. Existing PRs—including #100, #101, #98, #99 and #73—are not modified, merged or closed by this work. The phase-0 work is isolated on its own branch and a new draft PR.
27. The Render Staging service currently points to an older branch and has a blank health-check path. This mismatch is recorded; no staging branch/health-path change is made automatically because a service setting change can trigger deployment.
28. A Git backup branch `backup/pre-upgrade` was created from `main` before this phase's code edits. The connected GitHub action set does not expose a Git tag-creation write operation; therefore the requested annotated/lightweight backup tag is **not yet created**. Do not treat the branch as a tag or claim both requirements are complete.
29. The code/CI connector provides source and workflow evidence but not a fully usable local clone in this session. CI is the authoritative executable test environment for repository code. No local test pass is claimed unless it is actually run.
30. Live Render HTTP checks and physical Android testing are reported only when directly observed. An inaccessible endpoint or absent device is a blocked/skipped check, not a pass.
31. On any ambiguous legacy feature, preserve/hide nothing: record it, keep it untouched and add a characterization test before refactoring.
