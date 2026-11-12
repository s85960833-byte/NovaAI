# NOVA Status — Acquisition Readiness

Last updated: 12 November 2026 (Asia/Kolkata)
Repository: https://github.com/s85960833-byte/NovaAI
Production URL: https://novaai-4auo.onrender.com
Production branch: main
Current candidate: PR #98 — fix/nova-home-learn-first-mobile-20261109
Candidate head audited: 059d6fabaa4aa880d2dd057b990db95c3957c498

## Done (evidence-backed)
- PR #98 remains open, Draft, and unmerged. GitHub currently reports it mergeable; production main remains unchanged by this candidate.
- Main verification run 43194899049 passed on candidate head 059d6fa. Browser verification run 43194899149 passed on the same head. A subsequent browser rerun 43195092562 also passed; main rerun 43195092459 is still in progress at the time of this update.
- Five Chromium viewport screenshots were previously inspected: 360x800, 390x844, 412x915, 760x1024 and 1280x800. This is browser emulation, not physical Android certification.
- .env.example exists; .gitignore excludes local env/secrets and common credential files. The active runtime is Node.js 22 with start command node nova-server.txt.
- Privacy Notice and Terms drafts exist and explicitly disclose incomplete controls; they are not final legal documents.
- PostgreSQL tenant-RLS tests, Deno type checks, browser/account flows, Company Cloud mobile tests, provider configuration, rate-window tests, provider URL validation tests and the 60-case AI evaluation fixture passed in recorded candidate CI runs.

## Phase 1 audit findings (static inspection; not a complete runtime audit)
- Active backend declares 28 Express routes across config, chat, search, image, voice transcription, live data, feeds and static/PWA assets.
- Main frontend is index.html plus modular browser scripts. The HTML has a viewport meta tag and English document language, but no description meta tag, canonical URL or H1 was detected.
- Static scan found 49 buttons and 13 inputs; all 13 inputs had a nearby/explicit label attribute. Only 21 buttons had an aria-label/title attribute; text-labelled buttons may still be accessible, so a rendered accessibility audit remains required.
- No privacy/terms link or consent UI was detected in the main HTML. This is not proof no scripted controls exist; verify rendered app and actual storage/cookie use before implementing consent UI.
- Backend security controls include baseline headers/CSP, a per-IP in-memory API throttle, a 6 MB JSON body limit, /health, and HTTPS/credential/query/fragment validation for configured provider base URLs. CSP still allows inline styles and broad HTTPS connections.
- General /api routes, including AI chat, are not authenticated in the Express server. The current global limit is 60 requests/minute per IP and is in-memory; it resets on process restart and is not a durable per-account quota. Do not configure a paid provider key or expose a billable provider until authentication/abuse controls and hard spend limits are designed and tested.
- Account cloud sync is OFF by default and requires explicit opt-in. The confirmation explains that up to 40 chats (up to 150 messages each), extracted document text, saved memory and custom instructions may be synced; image attachments are excluded. The table is protected by per-user RLS. Turning sync off stops future sync but does not delete the cloud copy; the separate delete-backup control removes that row.
- Self-service account deletion and a published retention schedule are not implemented. The draft Privacy Notice correctly treats this as a launch blocker.
- Company Cloud Edge Function enforces authenticated user context, configured-site CORS, bounded JSON request bodies, per-user API/invitation rate limits and membership checks. Live deployed Edge Function auth/CORS and email delivery remain unverified.
- Package-lock metadata scan showed a small dependency graph with declared MIT/ISC/BSD-3-Clause/Apache-2.0 licenses. This remains a preliminary metadata scan, not a full source/provenance/legal license audit.
- No root Dockerfile, full product architecture guide, dependency license report, backup/restore guide, alternative-host guide, Transfer Pack or Data Room index has yet been completed.

## In progress
- Phase 1 total audit: repository inventory, security, routes, UI states, accessibility, performance, SEO, data flows, integrations, live deployment and operational controls.
- Full dependency/source/asset provenance and license audit.
- Ownership, IP assignment and transferability evidence audit.
- Product positioning and defensible differentiation research.

## Next
1. Finish current candidate CI rerun and record its exact result.
2. Bring the PR description and README evidence references into alignment with current candidate SHA and CI runs.
3. Continue reviewing every Express route, browser module, SQL migration, Edge Function, CI workflow and external integration.
4. Complete dependency/license and third-party asset provenance checks.
5. Verify latest-head Staging deploy SHA and smoke tests; do not infer live state from branch CI.
6. Build portable setup, Docker, deployment/backup/restore and transfer documentation only after validating actual runtime requirements.
7. Research competitors and user pain points before claiming uniqueness or pricing.

## Blocked / owner-dependent
- Staging still serves old commit 195739a04895de364a5af22aa61f930d5d782cbb, not candidate head 059d6fabaa4aa880d2dd057b990db95c3957c498. Render Health Check Path is blank; owner must set /health in the existing Staging Dashboard and deploy latest commit there.
- Live AI Chat testing requires a permitted server-side provider key and explicit model in existing Staging Environment. Never share secrets in chat or commit them. Use only provider terms/age-eligible access and no paid credits.
- Physical Android full-width layout, touch, drawer and real microphone capture require the actual handset.
- Real Auth confirmation/reset email, two-device sync, account deletion/retention, live image generation and third-party provider checks remain incomplete.
- Account ownership, legal operator details, support contact, retention schedule, age/consent policy and IP assignments require owner evidence/decisions and qualified review.
- No real customer/revenue/traction evidence has been supplied; do not claim traction or a ₹10–20 crore valuation.

## Decisions / release gates
- Existing repository and production URL only; no new repo, fork or replacement deployment.
- Production main and live URL are protected. No merge/deploy until rollback, latest-head staging, live smoke, physical-device and release checks pass.
- No paid services/APIs or credits without explicit approval.
- No fabricated users, testimonials, revenue, analytics or exclusivity claims.
- NOVA BI remains a preview; use synthetic data only.
- Candidate CI success does not equal production readiness.
- Acquisition value ₹10–20 crore is a target, not a present valuation or guarantee.

## Current readiness snapshot
- Candidate main CI: PASS on run 43194899049; same-SHA rerun 43195092459 still in progress at update time.
- Candidate browser CI: PASS on runs 43194899149 and 43195092562.
- Staging latest-head verification: BLOCKED.
- Physical Android: NOT VERIFIED.
- Provider-backed live AI: NOT VERIFIED.
- Account deletion/retention and final legal policies: INCOMPLETE.
- Ownership/IP transferability and traction evidence: INCOMPLETE.
- Overall acquisition readiness score: NOT YET SCORED; baseline evidence collection is underway.
