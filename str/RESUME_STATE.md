# STR RESUME STATE

Product: STR inside the existing Nova AI app (same link)
Prompt version: final-3.0
Build version: 0.3
Phase: 1 — Nova-safe shell
Step: 1.2 — Complete independent language controls
Done:
- 0.1 — Exact Nova source files reviewed from the main branch and candidate branch
- 0.2 — Official provider, Render and Google Play source checks recorded; customer routing remains disabled
- 0.3 — Existing Render free service facts recorded; no service settings changed
- 0.4 — Owner authorized v3 defaults: Model 1 (owner-only free) and 7-day retention
- 1.1 — Isolated STR shell, navigation, bilingual base UI, local IndexedDB drafts, intro and same-origin asset route implemented
- 1.2 — Separate UI, reply and website-content language controls added; reply defaults to UI language; typed language does not automatically change reply language
Files:
- index.html — STR navigation, screen markup and isolated styles
- nova-server.txt — Same-origin STR module route and versioned PWA cache entry
- str-app.js — Bilingual shell, separate language settings, IndexedDB drafts and 7-day local draft expiry
- str/provider-config.json — Provider tiers, null quotas fail-closed, Model 1 owner-only default
- str/PHASE0-VERIFICATION.md — Official provider, Render and Play verification; owner decisions
- str/DECISIONS.md — Owner-authorized decisions and implementation boundaries
- str/RESUME_STATE.md — Current phase and next step
- scripts/check.mjs — Static syntax/security and STR isolation assertions
- scripts/runtime-smoke.mjs — Local routes and PWA cache checks
- scripts/browser-smoke.mjs — Existing Nova and STR browser regression checks
Business model: Model 1 — owner-only free; customer builds disabled
Provider config: Groq unverified; Cerebras unverified; Gemini unpaid; paid provider unselected; customer data routes empty
Retention window: 7 days
Language: UI Hindi/English; reply defaults to UI and can be selected separately; content language English/Hindi/Hinglish
Owner decisions:
- D-STR-001: Model 1 owner-only free; customer build/billing path disabled
- D-STR-002: 7-day retention for local STR drafts/log policy default
Open issues:
- Verify latest PR checks and extend browser assertions for new language controls
- Exact Groq/Cerebras account quotas remain unknown; limits remain null and routing must fail closed
- Render environment variable names are not exposed by the service metadata; no values requested
- STR spec/section/fix/convert APIs, server security/rate-limit/origin controls, quality gates, ZIP and bilingual guides remain
- Real-device Android/iPhone tests not performed
Next: 1.2 — Add tests for independent language behavior, then Phase 2.1 security foundations
