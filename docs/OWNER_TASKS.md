# Owner Tasks — Phase 1–6 Handover

Only items that genuinely need a human remain here. Each is short; none blocks mock-only engineering.

1. **Review icon and visual style — PENDING OWNER REVIEW.** Open staging → Me → inspect the emblem, midnight/ivory themes and entry animation. Reply with approve or specific changes.
2. **Review Hindi copy — PENDING OWNER REVIEW.** Open staging → switch to हिंदी → review `docs/OWNER_REVIEW_PACK.md` and `docs/i18n-glossary.md`. A fluent Hindi reviewer should check the 30 most visible strings before release.
3. **Review final prices — PENDING OWNER REVIEW.** Review `config/pricing.ts` on the rebuild branch. Prices are placeholders; no real wallet or payment is active.
4. **Review scheme dataset — PENDING OWNER REVIEW.** Review `data/schemes/approved.json`. It is intentionally empty until each record has an official source URL, current status, last-verified date and your approval.
5. **Create/select a separate Supabase test project — OWNER TASK (only if hosted Auth is required).** Supabase Dashboard → select your organisation → New project → Free plan → name `nova-2-staging` → choose a region → set a new password → wait for Healthy. Do not use project `qrfwsewppafhxibdboam` or copy production data. Add only the new project's URL and anon key to staging. Unit tests use the local synthetic Supabase stack.
6. **Optional staging AI key — OWNER TASK.** Render Dashboard → NOVA 2.0 staging → Environment → add one staging-only provider key from an adult-owned account → Save. Never send real documents. Without a key, real-model evals are NOT VERIFIED.
7. **Physical phone check — NOT VERIFIED.** Open the staging URL on the Infinix X6873 Android 16 → test home, drawer, Diwan, Sakha, wallet and browser back → note layout/voice issues. A real 120 Hz screen is needed to verify 120 FPS.
8. **Legal/privacy review — PENDING PROFESSIONAL REVIEW.** Before public release, a responsible adult and qualified professional must review privacy/DPDP, children's data, terms, grievance contact, consumer disclosures, taxes/invoices and any future payment design. No real-money setup is part of this build.
9. **Production branch protection — owner dashboard step.** GitHub → repository Settings → Branches → Add branch protection rule → branch name `main` → require pull request before merging → require status checks (select final CI checks) → block force pushes and deletions → Save. Repository settings were not changed.
