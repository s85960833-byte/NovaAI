# Phase 7 Release Checklist — PREPARED, NOT AUTHORISED

**Never release until the owner types exactly: `APPROVE RELEASE`.** This checklist does not grant release permission.

## Pre-release evidence
- [ ] Phase 1–6 gate evidence table all PASS, except explicitly accepted NOT VERIFIED items with owner/professional review.
- [ ] Final rebuild PR reviewed; no direct push to `main`.
- [ ] CI checks and database tests green on exact PR head SHA.
- [ ] Staging deploy SHA equals PR head SHA; `/api/health` healthy.
- [ ] Lighthouse, JS/CSS size, API latency and frame-time reports attached.
- [ ] Android physical test on target Infinix X6873; refresh rate and 120 FPS NOT VERIFIED unless measured on suitable hardware.
- [ ] Backup/restore and rollback rehearsed on staging; backup retention limitations documented.
- [ ] Security review: RLS, auth, account deletion/export, secret scanning, dependency vulnerabilities and webhook validation.
- [ ] Privacy/terms, DPDP and children's data review by qualified professional.
- [ ] Official scheme records verified against primary government sources and owner-approved.
- [ ] Hindi/English copy, icon, visual identity and final prices owner-approved.
- [ ] Real AI provider key, model evals and spend caps independently configured; otherwise keep mock-only.
- [ ] Payments remain disabled until legal/guardian, provider, KYC, tax and compliance requirements are independently satisfied. Do not create an account here.
- [ ] Monitoring, incident response, support contact and status page ready.
- [ ] Rollback owner and exact production SHA recorded.

## Release execution (only after exact owner phrase)
1. Confirm the exact approved PR SHA and all green checks.
2. Take and verify production backups using the production operator's approved process; do not rely on this staging-only backup drill.
3. Merge the reviewed PR through GitHub UI; never push directly to `main`.
4. Deploy the exact merged SHA using the production Render dashboard.
5. Apply only reviewed, forward-only production migrations after backup verification.
6. Run production smoke checks and monitor error/latency metrics.
7. If a release gate fails, stop traffic or roll back to the recorded prior deploy using the runbook.
8. Record actual deployed SHA, timestamp, smoke results and incident owner.

## Explicit prohibitions
- No Phase 7 actions are authorised by Gate 0 or this checklist.
- No production changes, migration, secret changes, payment setup or public marketing during Phases 1–6.
- No claim of 120 FPS, guaranteed scam detection, official government partnership or legal advice without evidence.
