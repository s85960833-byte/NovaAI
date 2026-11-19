# STR RESUME STATE

Product: STR inside the existing Nova AI app (same link)
Prompt version: final-3.0
Build version: 0.2
Phase: 1 — Nova-safe shell
Step: 1.1 — Add isolated STR tab and route
Done:
- 0.1 — Exact existing Nova source files reviewed from the main branch
- 0.2 — Official provider, Render and Google Play source checks recorded; safe provider tiers configured
- 1.1 — Isolated STR shell, navigation, bilingual UI dictionary, local draft persistence, server asset route and PWA cache entry implemented
Files:
- index.html — STR navigation, screen markup and isolated STR styles
- nova-server.txt — Same-origin STR module route and versioned PWA cache entry
- str-app.js — Bilingual shell, separate IndexedDB drafts, 7-day local draft expiry and no provider calls
- str/provider-config.json — Provider tiers, unknown-quota fail-closed behavior and owner defaults
- str/PHASE0-VERIFICATION.md — Official source findings and existing Render service facts
- str/RESUME_STATE.md — Current STR phase and next steps
- scripts/check.mjs — Static syntax, CSP, provider-routing and STR isolation assertions
- scripts/runtime-smoke.mjs — Local STR route and offline cache checks
- scripts/browser-smoke.mjs — Browser checks for STR navigation, language switch, local drafts and Nova storage separation
- .github/workflows/novaai-verification.yml — Pin verification runner to supported Ubuntu 24.04
- .github/workflows/nova-account-browser-verification.yml — Pin browser runner to supported Ubuntu 24.04
Business model: Model 1 (provisional default; owner-only free)
Provider config: Groq unverified; Cerebras unverified; Gemini unpaid; paid provider unselected; no customer-data routes
Retention window: 7 days (prompt default; provisional)
Language: UI Hindi/English; reply defaults to UI (reply control not implemented yet); content language selection pending
Owner decisions: Model 1 and 7 days applied as provisional defaults
Open issues:
- Full Phase 1.1 browser verification is pending; first Ubuntu-latest Playwright run failed because Playwright 1.56.1 did not support Ubuntu 26.04; runner pinned to Ubuntu 24.04
- Exact Groq/Cerebras account quotas are unknown; limits remain null and routing must fail closed
- Render environment-variable names are not exposed by service metadata; no values requested
- Retention remains provisional until owner confirms
- STR spec/section/fix/convert APIs, security middleware, full language controls, gates, ZIP package and guides are not implemented yet
- Physical Android/iPhone testing has not been performed
Next: Complete Phase 1.1 browser tests, then Phase 1.2 language system