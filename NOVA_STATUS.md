# NOVA Status — Current Source of Truth

Last verified: 12 November 2026 (UTC)
Repository: https://github.com/s85960833-byte/NovaAI
Production: https://novaai-4auo.onrender.com (main branch; unchanged)
Candidate: PR #98 — https://github.com/s85960833-byte/NovaAI/pull/98
Candidate branch: `fix/nova-home-learn-first-mobile-20261109`
Candidate head at this verification: `de142413bb1ea4ec1f52c21ccd71d6e00b0c5291`

## Verified progress

- PR #98 is Open, Draft, unmerged, and targets `main`. Production main remains `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50`; the candidate has not been merged or deployed to Production.
- Main verification run [43213482636](https://github.com/s85960833-byte/NovaAI/actions/runs/43213482636) completed successfully on the exact candidate head. It executed 43 numbered steps: 39 passed and 4 release/live steps were skipped. The skipped checks are deployed NOVA BI Edge Function auth/CORS, waiting for a merged revision on Render, live website/provider smoke, and free image-generation smoke. They are not passed tests.
- Browser verification run [43213482680](https://github.com/s85960833-byte/NovaAI/actions/runs/43213482680) completed successfully on the exact same head.
- The main CI includes dependency SBOM validation, syntax/provider safety checks, cloud-sync regression tests, rate-window and timezone tests, PostgreSQL tenant RLS, NOVA BI Edge Function type-check, 60-case AI evaluation fixture, dependency vulnerability audit, local route/PWA smoke, Docker build/smoke, Chromium responsive workspace tests, Company Cloud mobile workflows, and five-viewport mobile/drawer regression.
- These are automated CI/browser-emulation results, not proof of live provider functionality or physical Android compatibility.

## Staging / Production

- Staging service: `srv-dbqm035g1s2s73eogao0`, https://novaai-pr98-staging.onrender.com
- Staging Auto Deploy is enabled and tracks the candidate branch, but latest Live deployment is still old commit `195739a04895de364a5af22aa61f930d5d782cbb`, not candidate head `de142413bb1ea4ec1f52c21ccd71d6e00b0c5291`.
- Render Staging Health Check Path is blank. Owner must set `/health` in Staging Dashboard → Settings → Health Checks and save. No manual Production deployment is authorized.
- Production service and URL remain unchanged. No Production merge or deploy has been performed.

## Release blockers

1. Public Express AI endpoints (including chat, search, image, live retrieval and transcription) do not enforce account authentication. Current in-memory per-IP throttles are not durable per-user/monthly quotas or hard spend limits. Do not expose billable provider keys or public paid-provider traffic until authentication, abuse controls and spend caps are implemented and verified.
2. Staging is not running the candidate head; live smoke tests are therefore not verified.
3. Physical Android full-width layout, touch interactions, drawer behavior and real microphone capture require owner handset testing.
4. Real account deletion, complete retention workflow and published retention schedule are incomplete. Cloud-backup deletion is not full account deletion.
5. Provider commercial-use rights, quotas, key validity and transfer rights are not all cleared. See `API_INTEGRATION_AUDIT.md`; overall API audit remains NOT PASSED.
6. Privacy Notice and Terms are drafts. Business operator, support/grievance details, age/consent policy and retention terms require owner evidence and qualified legal review.
7. Full source, asset and IP provenance; ownership/assignment evidence; external-host deployment; backup/restore drill; two-device sync; live Auth email; uptime/load evidence; and rollback drill remain incomplete.
8. No customer, revenue, traction, testimonial, buyer interest, certification, valuation or exclusivity evidence has been established. ₹10–20 crore remains an aspirational target, not a present valuation or guarantee.

## Current release decision

**NO-GO for Production.** Keep PR #98 Draft and unmerged. Do not change Production until latest-head Staging, live smoke, physical-device, authentication/quota, data-lifecycle, provider-rights, legal/IP, rollback and owner approval gates are satisfied.

## Owner-dependent next action

Open the [Staging Render Dashboard](https://dashboard.render.com/web/srv-dbqm035g1s2s73eogao0), click **Settings**, then open **Health Checks**, set path to `/health`, and save. The current owner instruction is to complete the Settings/Health Checks step; until confirmed, do not claim Staging has the candidate deployment.

## Scope and estimate

Overall S-tier Definition of Done: approximately 23% complete (working estimate across product, security, operations, legal/IP and buyer evidence).
Buyer-readiness: approximately 37/100 (qualitative internal estimate, not an appraisal).
