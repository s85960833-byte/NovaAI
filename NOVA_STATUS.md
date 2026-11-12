# NOVA Status — Acquisition Readiness

Last updated: 12 November 2026 (Asia/Kolkata)
Repository: https://github.com/s85960833-byte/NovaAI
Production URL: https://novaai-4auo.onrender.com
Production branch: main
Current candidate: PR #98 — fix/nova-home-learn-first-mobile-20261109
Candidate head inspected: d87b771eea09460d915e25829e4b4abfdb0ca7b2

## Done (evidence-backed)
- PR #98 remains open, Draft, and unmerged. Production main is unchanged by this candidate.
- Previous candidate head 037421c passed main verification run 43187397022 and browser verification run 43187397043. New documentation-only commit d87b771 is now running main verification 43194759663 and browser verification 43194759669; results are pending.
- Five Chromium viewport screenshots were inspected: 360x800, 390x844, 412x915, 760x1024, 1280x800. This is emulation, not physical-device certification.
- `.env.example` exists; `.gitignore` excludes local env/secrets and common credential files.
- Privacy Notice and Terms drafts exist and explicitly disclose incomplete controls; they are not final legal documents.
- Architecture and support/incident draft documents exist for NOVA BI; broader product and transfer documentation is incomplete.
- Production Render URL and existing service identity are documented in README / prior release records.

## Phase 1 audit findings (static inspection; not a complete runtime audit)\n- Active backend currently declares 28 Express routes across config, chat, search, image, voice transcription, live data, feeds and static/PWA assets.\n- Main frontend is a single `index.html` plus modular browser scripts; the HTML has a viewport meta tag and English document language, but no description meta tag, canonical URL or H1 was detected. These are SEO/discoverability gaps to review.\n- 49 static buttons and 13 inputs were detected; all 13 inputs have a nearby/explicit label attribute, while only 21 buttons carry an aria-label/title attribute. Text-labelled buttons may be accessible, but a rendered accessibility audit is still required.\n- No HTML form, dialog role, privacy/terms link, or cookie-consent UI was detected in the main HTML. This is not proof that no consent controls exist in scripts or routes; verify rendered app and actual storage/cookie use before implementing.\n- Security controls found in the active backend include baseline headers/CSP, per-IP in-memory API throttling, a 6 MB JSON body limit, `/health`, and provider URL validation in a separate module. CSP still explicitly allows inline styles and broad HTTPS connections (documented limitation).\n- Package lock records a small dependency graph; visible license metadata is predominantly MIT/ISC/BSD-3-Clause/Apache-2.0. This is only an initial lockfile scan, not a completed provenance or license audit.\n- No Dockerfile, root-level product architecture guide, dependency license report, backup/restore guide, alternative-host guide, Transfer Pack, Data Room index or `NOVA_STATUS.md` existed before this audit; this status file is the first such tracker.\n\n## In progress
- Phase 1 total audit: repository inventory, security, routes, UI states, accessibility, performance, SEO, data flows, integrations, live deployment and operational controls.
- License and dependency provenance audit.
- Ownership and transferability evidence audit.
- Product positioning and defensible differentiation research.

## Next
1. Bring README and status documentation into alignment with verified current PR/production state.
2. Inspect all frontend modules, API routes, auth/sync, database migrations, CI and deploy configuration.
3. Produce a complete dependency/license inventory from the lockfile and verify transitive licenses.
4. Verify live production and staging responses/deploy SHAs; do not infer live state from branch CI.
5. Add only evidence-backed documentation or code improvements on the existing PR branch; run CI after each coherent change.
6. Build portable setup, Docker, deployment/backup/restore and transfer documentation after validating actual runtime requirements.
7. Research competitor capabilities and user pain points before claiming uniqueness or pricing.

## Blocked / owner-dependent
- Staging currently serves old commit 195739a, not candidate head d87b771. Render Health Check Path is blank; owner must set `/health` in the existing Staging Dashboard and deploy latest commit there.
- AI Chat live verification needs a permitted server-side provider key plus explicit model in the existing Staging Environment. Do not share secrets in chat or commit them. Respect provider age/terms requirements. No paid usage is authorized.
- Physical Android touch/layout/microphone checks require the actual handset.
- Real Auth email, two-user sync, deletion/retention, image generation and live third-party provider checks remain incomplete.
- Account ownership, legal operator details, support contact, retention schedule, age/consent policy and IP assignments require owner evidence/decisions and qualified review.
- No real customer/revenue/traction evidence has been supplied; do not claim traction or a ₹10–20 crore valuation.

## Decisions / safety gates
- Existing repo only; no new repo, fork, production URL or replacement deployment.
- Production `main` and the current live URL are protected. No merge/deploy until rollback, staging, live smoke, physical-device and release checks pass.
- No paid services/APIs or credits without explicit approval.
- No fabricated users, testimonials, revenue, analytics or exclusivity claims.
- NOVA BI remains a preview; use synthetic data only.
- Current candidate CI success does not equal product-wide production readiness.
- Acquisition target is an ambition, not a present valuation or guarantee.

## Current readiness snapshot
- Candidate CI: PASS.
- Staging latest-head verification: BLOCKED.
- Physical Android: NOT VERIFIED.
- Live provider-backed AI: NOT VERIFIED.
- Legal/ownership/transferability: INCOMPLETE.
- Traction/revenue: NO EVIDENCE PROVIDED.
- Overall acquisition readiness score: NOT YET SCORED; baseline evidence collection is underway.
