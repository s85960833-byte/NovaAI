# STR RESUME STATE

Product: STR inside the existing Nova AI app (same link)
Prompt version: final-3.0
Build version: 0.2
Phase: 0 — Inputs and verification
Step: 0.2 — Provider, Render and owner configuration verification
Done:
- 0.1 — Existing Nova source files reviewed
- 0.2 — Official provider/Render/Google Play source review started; safe provider classifications recorded
Files:
- index.html — Existing Nova frontend, reviewed only
- nova-server.txt — Existing Express backend, reviewed only
- package.json — Existing Node runtime/scripts, reviewed only
- nova-provider-url.js — Existing provider URL validation dependency
- nova-rate-limit.js — Existing rate-limiting dependency
- str/provider-config.json — Provider tier and fail-closed quota configuration; unknown limits fail closed
- str/PHASE0-VERIFICATION.md — Official source findings and infrastructure facts
- str/RESUME_STATE.md — Current progress and next actions
Business model: Model 1 (provisional default; owner-only free)
Provider config: Groq unverified; Cerebras unverified; Gemini unpaid; paid provider unselected
Retention window: 7 days (prompt default; provisional)
Language: UI Hindi/English; reply defaults to UI; content selected per build
Owner decisions: Model 1 and 7 days applied as provisional defaults
Open issues:
- Exact Groq/Cerebras account quotas not yet available; do not guess
- Render environment-variable names not exposed in service metadata
- Retention period awaits owner confirmation
- No paid provider selected; customer builds disabled
- No code or production deployment yet
Next: Phase 1.1 — Nova-safe STR shell, after Phase 0 owner settings are confirmed or defaults accepted