# STR RESUME STATE

Product: STR inside the existing Nova AI app (same link)
Prompt version: final-3.0
Build version: 0.6
Phase: 3 — Spec engine
Step: 3.2 — Editable bilingual spec sheet
Done:
- 0.1 — Exact Nova source files reviewed from the main branch and candidate branch
- 0.2 — Official provider, Render and Google Play source checks recorded; customer routing remains disabled
- 0.3 — Existing Render free service facts recorded; no service settings changed
- 0.4 — Owner authorized v3 defaults: Model 1 (owner-only free) and 7-day retention
- 1.1 — Isolated STR shell, navigation, bilingual base UI, local IndexedDB drafts, intro and same-origin asset route implemented
- 1.2 — Separate UI, reply and website-content language controls added; reply defaults to UI language; typed language does not automatically change reply language
- 2.1 — Stateless `/api/str/` routes added with exact payload schemas, same-origin checks, bounded per-client/IP rate windows and fail-closed 503 responses until a provider is verified
- 2.2 — Provider eligibility router added; customer data requires verified paid_no_training tier and known model/RPM/TPM/RPD/TPD; unknown quotas block
- 3.1 — Compact v1 spec validator and deterministic local starter-plan engine added; `/api/str/spec` returns schema-validated spec, assumptions and placeholders without sending prompts to a provider; bilingual unsafe-request classifier blocks credential harvesting before processing
- 3.2 — Editable project name, page title, section headings/descriptions, assumptions and missing-detail fields; optional Hinglish copy; explicit Save plan action and 7-day IndexedDB persistence/restore
Files:
- index.html — STR navigation, screen markup and isolated styles
- nova-server.txt — Same-origin STR module route and versioned PWA cache entry
- str-app.js — Bilingual shell, separate language settings, local spec-preview panel, and IndexedDB drafts with 7-day expiry
- str/server.js — Stateless STR API health/limits and fixed-payload spec/section/fix/convert routes; generation disabled until provider verification
- str/security.js — Same-origin, exact-schema, client-ID and bounded rate-window helpers
- str/provider-router.js — Provider eligibility enforcement for owner test data vs customer data; unknown limits fail closed
- str/safety.js — Bilingual unsafe-request classifier for credentials, impersonation, malware/spam, gambling and other prohibited requests
- str/spec-schema.js — Compact v1 spec schema validator for fields, enums, unique IDs, bilingual copy and unsafe flags
- str/spec-engine.js — Local rules-based spec constructor for known/vague prompts; validates every spec and never invents contact/pricing data
- scripts/str-security.test.cjs — Unit tests for origin, payload, rate windows, provider data-tier routing, unsafe prompts and spec validation
- str/provider-config.json — Provider tiers, null quotas fail-closed, Model 1 owner-only default
- str/PHASE0-VERIFICATION.md — Official provider, Render and Play verification; owner decisions
- str/DECISIONS.md — Owner-authorized decisions and implementation boundaries
- str/RESUME_STATE.md — Current phase and next step
- scripts/check.mjs — Static syntax/security and STR isolation assertions
- scripts/runtime-smoke.mjs — Local routes, STR API security/rate limits, unsafe-request rejection and no-provider spec preview checks
- scripts/check.mjs — Syntax and security assertions for STR server modules
- .github/workflows/novaai-verification.yml — Runs STR security unit tests
- scripts/browser-smoke.mjs — Existing Nova and STR browser regression checks
Business model: Model 1 — owner-only free; customer builds disabled
Provider config: Groq unverified; Cerebras unverified; Gemini unpaid; paid provider unselected; current eligible owner/customer providers both 0
Retention window: 7 days
Language: UI Hindi/English; reply defaults to UI and can be selected separately; content language English/Hindi/Hinglish
Owner decisions:
- D-STR-001: Model 1 owner-only free; customer build/billing path disabled
- D-STR-002: 7-day retention for local STR drafts/log policy default
Open issues:
- Latest static checks passed on recent candidate; current unit/runtime/browser runs require final confirmation
- Exact Groq/Cerebras account quotas remain unknown; limits remain null and routing must fail closed
- Render environment variable names are not exposed by the service metadata; no values requested
- Local rule-based starter spec is implemented; provider-backed AI spec/section/fix/convert generation remains disabled. Prompt dock refinement, full browser quality gates, chunked build, ZIP and bilingual guides remain
- Real-device Android/iPhone tests not performed
Next: 3.3 — Spec approval and change-diff workflow; then Phase 4 chunked build orchestration remains blocked until a safe generation provider is selected
