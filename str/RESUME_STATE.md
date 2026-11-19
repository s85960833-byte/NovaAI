# STR RESUME STATE

Product: STR inside the existing Nova AI app (same production app and URL)
Prompt version: final-3.0
Build version: 0.8
Current phase: Phase 4 — local chunked build foundation implemented; provider-backed build and complete quality gates remain blocked
Latest branch commit at this update: 6bf84ba5f435a56b0bac7e7b8875655f20f3d16b
Draft PR: #112

## Completed work (verified in source and workflow evidence)

### Phase 0 — discovery and owner decisions
- Reviewed the existing Nova source and production boundary on the existing repository/Render service.
- Recorded provider terms and quota uncertainties; no provider is presently eligible for customer data.
- Owner-authorized defaults: Model 1 (owner-only free) and 7-day local draft retention.
- Production main/service/settings/API keys remain unchanged.

### Phase 1 — isolated Nova integration
- STR shell, navigation, isolated responsive styles, bilingual interface, intro and language selectors.
- UI language, reply language and website-content language are independent.
- STR drafts use a separate IndexedDB database and seven-day expiry; they do not replace Nova chat storage.

### Phase 2 — stateless API and safety boundary
- Same-origin /api/str/ route shells, exact payload schemas, prompt/body limits and bounded client/IP rate windows.
- Local spec endpoint builds a deterministic starter plan without any AI provider call.
- Provider routing fails closed unless model, paid/no-training data tier and RPM/TPM/RPD/TPD quotas are known.
- Credential collection, impersonation, malware/spam, gambling and other unsafe prompts receive bilingual refusals before processing.

### Phase 3 — editable spec and approval lifecycle
- Compact v1 website spec validator and deterministic starter-plan constructor.
- Editable project name, page title, bilingual section headings/descriptions, assumptions and missing details; Hinglish option.
- Local before/after diff; explicit approval with canonical SHA-256 fingerprint and timestamp.
- Any saved spec change invalidates approval; re-approval creates a new hash; restore rechecks the fingerprint.

### Phase 4.1 — local chunked build foundation
- Browser-side chunk runner stores progress and output in IndexedDB.
- Pause/resume retains completed chunks and can continue on the same device.
- Deterministic HTML preview is generated locally without provider calls and is capped in size.
- Preview is isolated in iframe sandbox=`allow-scripts allow-forms` (no allow-same-origin or top-navigation); preview CSP blocks scripts, network connections, form submission, base URL and object content.
- Build output remains bound to the approved spec fingerprint.
- Playwright browser smoke exercised local preview, pause/resume, strict sandbox, CSP and restore behavior successfully on the tested candidate. The full integrated CI is still being rerun after the test collector fix below.

## Current provider state and decisions
- Model 1 — owner-only free; customer builds, onboarding, customer sales and billing remain disabled.
- Retention: 7 days.
- Groq and Cerebras remain unverified for customer data; Gemini free tier is unpaid; paid provider is not selected.
- Exact model and account-specific RPM/TPM/RPD/TPD quotas are unknown (null). Eligible provider count remains zero.
- Do not route personal/customer data to providers or silently reuse Nova's existing provider settings.
- No provider-backed AI generation is enabled. No API key values have been requested, read or committed.

## Remaining work and blockers

### Phase 4.2 — provider-backed generation and eight quality gates
- Not implemented/enabled. Requires a verified permitted provider, exact paid/no-training terms, model, quotas and owner access controls.
- The eight quality gates must be implemented and tested before any full build is advertised as complete.

### Phase 5 — delivery package
- ZIP export, generated icons/assets, complete bilingual handoff guides and store/submission materials remain unimplemented.

### Phase 6 — quotas and billing framework
- Customer monetization/onboarding deliberately disabled by Model 1; only add owner-safe internal accounting necessary for the owner-only path.

### Phase 7 — performance
- Profiling, large-project benchmarks, memory/CPU measurements and optimization remain.

### Phase 8 — quality and release
- Expand and complete the full quality matrix, resilience/security/language tests and Nova regression checks.
- Real owner-device Android/iPhone review and owner phone sign-off have not occurred.
- No merge or production deployment until all exit criteria and owner sign-off pass.

## Latest regression investigation
- Previous run at commit fc74fd4: main backend verification and integrated browser checks completed except five-viewport layout regression, which collected the exact Chromium opaque-sandbox localStorage SecurityError as a page error.
- That SecurityError states the document is sandboxed and lacks allow-same-origin; do not weaken the preview sandbox to make the test green.
- Commit 6bf84ba adds a narrow test-only classification for that exact browser error and explicitly asserts the preview iframe sandbox remains `allow-scripts allow-forms`. New CI runs are pending.
- Any unrelated runtime error or CSP violation must still fail tests.

## Production and branch invariants
- Repository: s85960833-byte/NovaAI.
- Work branch: feature/str-phase0-foundation-20261119.
- Draft PR: #112.
- Production branch: main. Existing Render service and URL remain untouched.
- Do not create a new repository/service, edit Render settings, add secrets, merge, or deploy this feature branch.
- Next action: confirm both latest CI workflows; then proceed only with work that remains inside the owner-only/no-provider boundary.
