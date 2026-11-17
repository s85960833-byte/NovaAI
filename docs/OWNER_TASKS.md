# Owner Tasks — Phase 1–6 handover

Every item is short. All are **PENDING OWNER REVIEW** unless marked NOT VERIFIED. None authorises a production change or Phase 7.

1. **Visual identity — PENDING OWNER REVIEW (about 1 minute).**
   1. Open the NOVA 2.0 staging URL.
   2. Tap the top-left menu, then switch Midnight / Ivory if available.
   3. Review the emblem, Darbar cards and entry motion.
   4. Add “approve” or the exact change request as a comment on the rebuild pull request.

2. **Hindi/English copy — PENDING OWNER REVIEW (about 2 minutes).**
   1. Open `docs/OWNER_REVIEW_PACK.md` in the rebuild branch.
   2. Open staging and switch Hindi/English.
   3. Check the home labels and Diwan task names.
   4. Comment only the incorrect phrase and your preferred replacement on the pull request.

3. **Pricing placeholders — PENDING OWNER REVIEW (about 1 minute).**
   1. Open `packages/shared/src/pricing.ts`.
   2. Review the ₹49 / ₹99 / ₹199 design-only values.
   3. Comment “keep placeholders” or list revised design values on the pull request.
   4. Do not connect a payment account or treat these as approved public prices.

4. **Official scheme dataset — PENDING OWNER REVIEW (about 1 minute to decide).**
   1. Open `data/schemes/approved.json`.
   2. It is intentionally empty, so no scheme is falsely advertised.
   3. Keep it empty until each entry has an official HTTPS source, current status, eligibility evidence and last-verified date.
   4. Comment “keep empty” or submit a source-reviewed record list on the pull request.

5. **Optional free AI staging key — PENDING OWNER REVIEW (about 2 minutes, only if a genuinely free tier is available).**
   1. Open Render Dashboard → `nova-2-staging` → Environment.
   2. Add only the selected provider's staging key and model name.
   3. Keep `AI_KILL_SWITCH=true` until the synthetic eval run is explicitly reviewed; never use a paid key or real document.
   4. Do not paste the key into ChatGPT, GitHub files or logs. If no free key is available, skip this task; mock evals remain valid.

6. **Physical Android smoke check — NOT VERIFIED (about 2 minutes for the first pass).**
   1. Open the staging URL in Chrome on the Infinix X6873.
   2. Check full-screen width, bottom navigation, menu/drawer and back navigation.
   3. Open Sakha and Diwan and run only the provided synthetic examples.
   4. Record any overflow, text clipping or broken control in the pull request. A real 120 Hz panel is required to verify 120 FPS.

7. **Hosted Supabase Auth — NOT VERIFIED (about 2 minutes to select the target; provisioning takes longer).**
   1. Open Supabase Dashboard → select the organisation you want to own NOVA 2.0 staging.
   2. Create a separate Free project named `nova-2-staging` in an available India-near region.
   3. Never select project `qrfwsewppafhxibdboam`; do not copy production data.
   4. Store the new URL/anon key only in staging secrets. Until then, staging sign-in remains disabled and local Supabase CI is the test fallback.

8. **Professional privacy/legal review — PENDING PROFESSIONAL REVIEW (about 2 minutes to arrange).**
   1. Share `docs/OWNER_REVIEW_PACK.md`, `PRIVACY_NOTICE_DRAFT.md` and `TERMS_OF_USE_DRAFT.md` with a responsible adult and qualified Indian privacy/legal professional.
   2. Ask them to review DPDP/children's data, terms, grievance contact, consumer disclosures and any future payments.
   3. Do not launch until written review is complete.

9. **Branch protection — NOT CHANGED.**
   1. Open GitHub → repository Settings → Branches.
   2. Add a rule for `main`; require pull requests, require the final CI status checks, and block force pushes/deletions.
   3. Save only after the exact required checks are visible. This build has not changed repository settings.

10. **Release approval — NOT AUTHORISED.**
    1. Review the Phase 1–6 final evidence report and all NOT VERIFIED items.
    2. Confirm legal, privacy, security, data migration, backups and physical-device reviews are complete.
    3. Only when ready, type exactly `APPROVE RELEASE` in ChatGPT. No other wording starts Phase 7.

11. **GitHub Actions approval — NOT REQUIRED for CI #513.** The checks, database and staging-smoke jobs completed successfully without manual approval.

12. **NOVA live performance check — PENDING OWNER REVIEW (about 1 minute).**
    1. Open https://nova-2-staging.onrender.com/perf in Chrome on your phone.
    2. Keep the page in the foreground for the 5-second measurement.
    3. Screenshot the one-screen result showing the observed refresh estimate, p50/p95 and dropped frames.
    4. Share the screenshot on PR #103. Browser timing is an estimate, not proof of panel hardware refresh capability.

13. **Phone acceptance test — PENDING OWNER REVIEW (about 5 minutes).**
    1. Follow the exact 10 steps and sample inputs in `docs/PHONE_TEST.md`.
    2. Use only synthetic samples and built-in mock wallet controls.
    3. Attach the `/perf` screenshot and any UI issue to PR #103.


14. **Staging rollback rehearsal — PENDING OWNER REVIEW (about 2 minutes of Dashboard clicks; target recovery under 5 minutes).**
    1. Open Render Dashboard → `nova-2-staging` → Events / Deploys: https://dashboard.render.com/web/srv-dbu3b63l550s739qet70.
    2. Select the previous known-good staging deployment listed in `docs/runbooks/rollback.md` (at report time: `dep-dbu760jrjlhs73af6190`).
    3. Use Render's Rollback action if shown. Do not change Production or `main`.
    4. Record the elapsed time from click to Live; target under 5 minutes.
    5. Verify https://nova-2-staging.onrender.com/api/health returns HTTP 200 and run synthetic Sakha/Diwan/mock-wallet smoke checks.
    6. Attach timestamp, resulting deploy ID/SHA, health proof and screenshot to PR #103. The rehearsal is not yet performed.

15. **Latest staging source and public /perf route — PENDING OWNER REVIEW (about 1 minute).**
    1. Open Render Dashboard → `nova-2-staging` → Events / Deploys.
    2. Confirm deployed SHA matches the PR #103 branch head.
    3. Open https://nova-2-staging.onrender.com/perf; keep it foregrounded for the 5-second sample.
    4. Screenshot observed cadence, p50/p95 and dropped frames; note phone/browser version. This is browser timing, not proof of panel hardware refresh.

16. **Hosted account export/delete — PENDING OWNER REVIEW (about 2 minutes to choose a Free test project).**
    1. Create or select a separate Free Supabase test project; never use production project `qrfwsewppafhxibdboam`.
    2. Configure only that test project's Auth and Storage credentials in staging secrets.
    3. Test hosted account export/download and deletion/storage erasure using synthetic account fixtures only; do not import production data.
    4. Keep this task open until endpoint responses and uploaded-object erasure are evidenced.
