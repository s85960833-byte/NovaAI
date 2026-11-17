# NOVA 2.0 — Plain-Language Audit

**Audit date:** 17 November 2026  
**Audit type:** Phase 0 read-only baseline review  
**Status:** Gate 0 subsequently approved by the owner; Phase 1–6 implementation is in progress.  
**Production safety:** No production service, production environment variable, production Supabase schema, production user data or production deployment was changed by this audit or rebuild work.

## What exists today

NOVA 1.0 is a single-page web app backed by Node.js 22 and Express 4. Its frontend is mainly index.html plus browser JavaScript modules; its server entry point is nova-server.txt. The existing product contains chat, voice, documents, image features, search, account flows, PWA support and 13 specialist modes. The 13 modes are general, voice, document, schemes, shopkeeper, math, photo, ncert, board, ssc, upsc, english and builder.

The production service is Render service srv-dbidhpc9v7es73d6ia80 at https://novaai-4auo.onrender.com. The old URL https://nova-ai-mlxf.onrender.com is obsolete and must not be used. The Phase 0 audit recorded GitHub main SHA bdbeb20881f9b6cef51ff5a9d8a3b80131079a50 and production live SHA c3cee61906b88ff111b3a645db55c9c2503cd8f7; the deployed SHA was behind main at the time of audit.

The existing Supabase project qrfwsewppafhxibdboam had 17 applied migrations and RLS enabled on 11 public tables. The local migration history did not line up with the remote ledger for three timestamps. The rebuild therefore uses a new, isolated supabase-v2 workspace and must not replay or modify the old supabase/ directory.

## Main findings in everyday language

1. **The old app has useful features, but its behaviour is not fully proven.** Most legacy feature flows were marked Unknown because a source file or button is not proof that the whole feature works on a real phone.
2. **The old CI had a real failure.** An intro-completion marker changed from v1 to v2, but the old marker was not persisted as the new marker. A browser test failed.
3. **Production and source code were not at the same revision.** The live Render SHA differed from GitHub main. This needs a release-time reconciliation, not a production change during this rebuild.
4. **Cloud chat sync could overwrite another device's newer edits.** NOVA 2.0 adds version/conflict-safe merge logic; end-to-end hosted sync still needs staging verification.
5. **Full account deletion and account-level export were not proven.** New Edge Function source has been added under supabase-v2, but it is not verified until deployed and tested against the new test project.
6. **Free hosting is only for staging.** Render Free can sleep; Supabase Free can pause and does not provide automatic backups. Use synthetic data only.
7. **AI provider calls can cost more than a simple text response.** Search, OCR, images, retries, storage and hosting add separate costs. A global and per-user spend guard plus a kill switch are required.
8. **Documents and webpages must be treated as untrusted data.** A document must never be allowed to override system instructions or trigger a tool action.
9. **Government scheme data must be official and dated.** The current scheme dataset is deliberately empty until every record is verified.
10. **Physical Android performance was not verified in Phase 0.** The Infinix X6873 Android 16 is the primary test candidate; a real 120 Hz device is required to prove the 120 Hz budget.

## Architecture decision

The approved default is a TypeScript modular monolith:
- Vite + React + TypeScript PWA.
- One Node.js 22 + TypeScript API.
- PostgreSQL and Supabase Auth with RLS.
- Drizzle for typed database access and reviewed SQL migrations.
- Zod for API input/output validation.
- Vitest and Playwright, with GitHub Actions CI.
- One isolated free staging service and one separate free Supabase test project, synthetic data only.
- No microservices or Redis until measured need.
- NOVA Business Intelligence remains a separate product boundary.

## Legacy feature treatment

- General chat and voice move into Sakha.
- Existing document capability remains in Sakha; Diwan Paper Reader is a separate structured workflow.
- Schemes move into Diwan and must use a deterministic, official-source-reviewed dataset.
- Shopkeeper remains in the Legacy shelf pending a later scope decision.
- Seven Learn modes remain accessible in Legacy until Guru is built and tested.
- Builder remains accessible in Legacy until Shilpi is built and tested.
- NOVA Business Intelligence stays separate.

No NOVA 1.0 capability is silently deleted. Existing local keys nova, nova_t, nova_modes_v1, nova_mode_cache_v1 and nova-cloud-sync-enabled must remain untouched during the rebuild. Cloud sync stays opt-in.

## Evidence and limitations

The Phase 0 pack contains the detailed PARITY_MATRIX, RISK_REGISTER, MODEL_COST_COMPARISON, ADR-001 and GATE_0_REPORT. The Research Log records source URL, question, answer, date read and impact on the plan. Current staging code, CI results and deployment status must be checked separately; this audit is a dated baseline, not a claim that every Phase 1–6 gate has passed.

## Gate 0 owner decision

The owner approved all 12 recommended defaults and declared Gate 0 passed on 17 November 2026. That approval authorises Phase 1–6 work within the stated safety limits. It does not authorise Phase 7, production changes, paid services, real user data, live payments or a public release. Phase 7 requires the exact words APPROVE RELEASE.
