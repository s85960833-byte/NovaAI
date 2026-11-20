# STR RESUME STATE

Product: STR inside the existing Nova AI app (same production app and URL)
Prompt version: final-3.0
Build version: 0.9 (owner-only, deterministic local build)
Current phase: Phase 4.1 — local chunked build and server-verified owner gate implemented on the feature branch; provider-backed generation and full release gates remain blocked
Latest code/workflow head at this update: 67d173c16c7b2b7a44e0227d01938028c477a81f
Draft PR: #112 — https://github.com/s85960833-byte/NovaAI/pull/112

## Completed work (verified in source and CI evidence)

### Phase 0 — discovery and owner decisions
- Reviewed the existing Nova source and production boundary on the existing repository/Render service.
- Recorded provider terms and quota uncertainties; no provider is presently eligible for customer data.
- Owner-authorized defaults: Model 1 (owner-only free) and 7-day local draft retention.
- Production main/service/settings/API keys remain unchanged.

### Phase 1 — isolated Nova integration
- STR shell, navigation, isolated responsive styles, bilingual interface, intro and language selectors.
- UI language, reply language and website-content language are independent.
- STR drafts use a separate IndexedDB database and seven-day expiry; a browser regression inserts an eight-day-old record and verifies it is pruned on reopen. STR does not replace Nova chat storage.

### Phase 2 — stateless API and safety boundary
- Same-origin /api/str/ route shells, exact payload schemas, prompt/body limits and bounded client/IP rate windows.
- Local spec endpoint builds a deterministic starter plan without any AI provider call.
- Provider routing fails closed unless the provider is verified for paid no-training use, has a valid reviewed HTTPS terms URL, explicit no-training confirmation, verified owner-only access controls, a known model, and all RPM/TPM/RPD/TPD quotas.
- Verification dates are strict calendar dates; malformed dates and insecure/credential-bearing terms URLs are rejected.
- Credential collection, impersonation, malware/spam, gambling and other unsafe prompts receive bilingual refusals before processing.

### Phase 2.1 — server-verified owner access (implemented on the feature branch; verification pending)
- STR reuses Nova's existing shared Supabase Auth client and obtains the current session through `auth.getSession()`; the browser sends the session bearer token only to fixed same-origin STR routes.
- The backend independently verifies each bearer token with the existing Supabase Auth `/auth/v1/user` endpoint using the already-public publishable key. The server request omits ambient credentials, rejects redirects, uses a five-second timeout and disables caching. No service-role key or browser-supplied user ID is trusted.
- STR owner UUIDs are allow-listed through the server environment variable `STR_OWNER_USER_IDS`. Missing or malformed configuration fails closed; an authenticated but non-allow-listed account is denied.
- The access endpoint and all STR content endpoints (`spec`, `section`, `fix`, `convert`) require the server-verified owner identity. Missing sessions return 401; non-owner accounts return 403; unconfigured gates or unavailable verification return 503.
- The STR UI now stays inert behind a bilingual access lock until the backend confirms owner access. The existing Nova sign-in dialog is reused; account sign-out re-locks STR. A service-worker cache version bump prevents a stale pre-gate shell from being reused.
- Added backend unit coverage for absent sessions, invalid sessions, allow-listed owners, non-owner accounts, missing configuration, malformed bearer values and Supabase verification failure. Runtime and browser checks now expect authenticated access.
- **Not yet fully proven:** this feature branch has not been tested with the actual owner account UUID allow-listed against the live Supabase Auth project, and no Render environment setting has been changed. Production and `main` remain untouched.

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
- User-provided HTML-like content is escaped and rendered as inert text; browser regression explicitly probes an image/event-handler injection string.
- UI wording now accurately distinguishes a local starter site/preview from a complete AI-generated application.
- Playwright mobile regression opens STR inside Nova at 360, 390 and 412 CSS-pixel widths, checks full viewport width/no horizontal overflow, then creates a plan and checks the local build action remains visible.

### Phase 5 — local delivery package
- Local ZIP export is available only after a completed preview and matching approved-spec fingerprint.
- ZIP contains static `index.html`, bilingual `GUIDE.md`, `manifest.webmanifest` and generated `icon.svg`; archive entry names and sizes are bounded and package size is capped.
- Browser smoke inspects downloaded ZIP entries, bilingual guide, preview content, manifest and icon, and checks download unlocks only after approval.
- This static ZIP is not a production application and does not include a verified hosted backend or provider-generated full application.

## Latest verification evidence
- Backend/security workflow passed on current head `16edd49d8ae0e26cb67c82377b3c1a6d06897650`: [run 44670090682](https://github.com/s85960833-byte/NovaAI/actions/runs/44670090682). It completed STR owner-auth tests (including redirect/credentials assertions), request/origin/schema/rate-limit checks, syntax/security checks, runtime API smoke, Chromium browser smoke and five-viewport mobile/drawer regression.
- Account/browser workflow passed on current head `16edd49d8ae0e26cb67c82377b3c1a6d06897650`: [run 44670090699](https://github.com/s85960833-byte/NovaAI/actions/runs/44670090699). It completed runtime routes, account UI/privacy/opt-in cloud sync, shared Supabase auth, mobile layout/drawer and graceful-shutdown checks.
- The account/browser run `44668891686` failed before app tests because Playwright's `--with-deps` apt install hit its 360-second timeout while downloading Ubuntu system packages (32.1 MB). No app test was executed in that failed run. The account workflow now installs the Chromium browser without repeating the OS dependency installation; the backend workflow retains the full Chromium + OS dependency installation. The new browser run passed.
- Both green runs contain the same application code, including owner-auth redirect hardening; the later `67d173c` change only optimizes the duplicate account workflow's install step.
- CI does not configure the owner UUID, prove a real Supabase owner session, profile real Android memory/CPU, or provide owner-device sign-off. Those are still release blockers; do not merge or deploy based only on CI.

## Current provider state and decisions
- Model 1 — owner-only free; customer builds, onboarding, customer sales and billing remain disabled.
- Retention: 7 days.
- Groq and Cerebras remain unverified for customer data; Gemini free tier is unpaid; paid provider is not selected.
- Exact model and account-specific RPM/TPM/RPD/TPD quotas are unknown; eligible provider count remains zero.
- Do not route personal/customer data to providers or silently reuse Nova's existing provider settings.
- No provider-backed AI generation is enabled. No API key values have been requested, read or committed.

## Remaining work and blockers

### Phase 4.2 — provider-backed generation and eight quality gates
- Not implemented/enabled. Requires a verified permitted provider, exact paid/no-training terms, model, quotas and owner access controls.
- The eight full-build quality gates must be implemented and tested before any AI-generated full build is advertised as complete. Local ZIP packaging checks are not a substitute for these gates.

### Phase 6 — quotas and billing framework
- Customer monetization/onboarding deliberately disabled by Model 1; only add owner-safe internal accounting necessary for the owner-only path.

### Phase 7 — performance
- Profiling, large-project benchmarks, memory/CPU measurements and optimization remain. The current browser smoke measured one local preview pause/resume cycle at about 880 ms; this is a single smoke measurement, not a performance qualification.

### Phase 8 — quality and release
- Complete the full quality matrix, resilience/security/language tests and Nova regression checks.
- Latest backend and browser CI both pass on current documentation head `16edd49d8ae0e26cb67c82377b3c1a6d06897650`; live owner-session and device sign-off remain external release gates.
- Configure the actual owner UUID allow-list only through an approved secure deployment process, then verify a real signed-in owner session and a non-owner denial against staging.
- Real owner-device Android/iPhone review and owner phone sign-off have not occurred.
- No merge or production deployment until all exit criteria and owner sign-off pass.

## Production and branch invariants
- Repository: s85960833-byte/NovaAI.
- Work branch: feature/str-phase0-foundation-20261119.
- Draft PR: #112.
- Production branch: main. Existing Render service and URL remain untouched.
- Do not create a new repository/service, edit Render settings, add secrets, merge, or deploy this feature branch.
- Next action: confirm the current backend workflow, then continue only with work that remains inside the owner-only/no-provider boundary.
