# NOVA Status — Current Source of Truth

**Status date:** 12 November 2026, 19:43 IST  
**Repository:** https://github.com/s85960833-byte/NovaAI  
**Production:** https://novaai-4auo.onrender.com  
**Production dashboard:** https://dashboard.render.com/web/srv-dbidhpc9v7es73eogao0  
**PR #98:** https://github.com/s85960833-byte/NovaAI/pull/98  
**Candidate branch:** `fix/nova-home-learn-first-mobile-20261109`

## Current phase status

- Phase 1 — Total audit: **IN PROGRESS**. Source/routes/auth/provider boundaries, npm lockfile metadata, Supabase RLS, Render history/logs, CI and browser viewport artifact reviewed. Physical Android/mic, current Staging, restore/load and full live UI audit remain open.
- Phase 2 — Exclusive value engine: **NOT PROVEN**. Paddlewheel, NavBharatAI and BooDoo overlap with broad India-language app-building claims. No unique moat or same-task benchmark.
- Phase 3 — Asset value: **PARTIAL**. Architecture/API/roadmap/transfer/Data Room, synthetic demo data and secure download routes exist in candidate. Durable quotas/spend caps, billing, SDK/webhooks/plugins, full account deletion/retention and restore proof remain incomplete.
- Phase 4 — Buyer package: **PARTIAL**. Buyer Map (24 categories), preview pitch, demo/outreach-for-feedback templates, cost/valuation/objection docs and Data Room exist. No buyer interest or adult-operated transaction/contact channel.
- Phase 5 — Buyer objections: **NOT PASSED**.
- Phase 6 — Valuation: **PARTIAL**. ₹35.1–104.7 lakh gross labour scenario only, not independent valuation; ₹15–20 lakh fair asset value unsupported; ₹10–20 crore scenario only.

## Exact verified CI — 12 November 2026
- Main workflow [#43237549696](https://github.com/s85960833-byte/NovaAI/actions/runs/43237549696): **success**, 45 successful steps, zero failures, SHA `da689a57ca544e2f4be6811307e23b7f683d8790`.
- Browser workflow [#43237549642](https://github.com/s85960833-byte/NovaAI/actions/runs/43237549642): **success**, 16 successful steps, zero failures, same exact SHA.
- The NOVA BI calculation tests, synthetic demo-data tests, allowlisted demo-download runtime smoke, path-traversal rejection, Docker image smoke and five-viewport mobile regression all passed in the respective workflows.
- Main release-only live/Production steps remain skipped while the PR is unmerged. CI does not prove deployment or physical device behavior.

## Render
- Production service `srv-dbidhpc9v7es73d6ia80`, main, Free/Singapore/one instance; latest Live `dep-dbom7bbm8hqs73ec2gi0` on `c3cee61906b88ff111b3a645db55c9c2503cd8f7`. Production unchanged.
- Staging service `srv-dbqm035g1s2s73eogao0` has correct PR branch and Auto Deploy enabled, but latest Live `dep-dbqnenhe35nc73f81k4g` remains old SHA `195739a04895de364a5af22aa61f930d5d782cbb`; Health Check Path blank.
- Candidate is not live-verified on Staging or Production.

## Supabase
- Project `qrfwsewppafhxibdboam`, PostgreSQL 17.11, ACTIVE_HEALTHY, region eu-west-1.
- 11/11 public tables RLS-enabled; 24 policies; no anon table grants; Security/Health Advisors zero lints; 13 Performance Advisor INFO unused-index notices.
- `nova-bi-api` ACTIVE v14, JWT verification enabled.
- Project metadata did not expose its plan. Supabase documentation says daily managed backups cover Pro/Team/Enterprise; Free projects should export data manually.
- `BACKUP_AND_RESTORE.md` now documents CLI backup/isolated restore and its limitations. **No backup export or restore drill has been run.** Standard CLI dumps do not include Auth users, Storage objects or Edge Function secrets.

## Completed
- India competitor/user-pain review and honest no-exclusivity positioning.
- Architecture/API/cost/roadmap/scorecard/Data Room/buyer docs.
- Synthetic BI sample CSVs, deterministic calculation tests, download UI and three-file allowlist route.
- Latest exact Main and Browser CI passed.
- Owner-controlled backup/restore procedure documented from official Supabase references.
- No paid spend, Production merge/deploy, or secret retrieval.

## Next / blocked
1. Push backup runbook and Transfer/Data Room cross-links; run CI on the new exact SHA.
2. Owner: Staging Dashboard → Settings → Health Checks → set `/health` → Save.
3. Diagnose Staging Auto Deploy and bring exact candidate to existing Staging URL.
4. Enable Express Auth on Staging only; test missing/invalid/expired/valid sessions and provider endpoints.
5. Owner tests physical Android full width, drawer, touch, keyboard and microphone.
6. Implement durable quotas/spend caps, full account deletion/retention, monitoring and provider-rights/legal/IP remediation.
7. Conduct and document an isolated backup restore including separately handled Auth and Storage before claiming portability.

## Owner/external blockers
- Health Check Path requires owner dashboard action.
- Live AI test requires an authorized provider key entered privately in Render. No paid credits or spend.
- Physical Android/mic testing needs the actual handset.
- Hosted Auth email/session, two-account isolation, complete deletion, provider invoices/contracts and account transfer need operator evidence.
- Support/grievance contact, age/consent policy, contributor assignments, IP chain of title and final legal review require responsible adult operator and qualified professionals.
- The user is a minor; any commercial approach, purchase, sale, ownership transfer, contract or payment must be handled by a responsible adult with qualified counsel. Current outreach templates are non-paid feedback requests only.

## Decisions
- PR #98 stays Draft/unmerged; Production remains unchanged until all gates and explicit final release approval.
- No paid API, image credit, infrastructure, plan upgrade or billing activation.
- Do not claim customers, revenue, exclusive features, fair valuation, uptime SLA, certification or production security without evidence.
- Synthetic/non-sensitive demo data only; no confidential/customer data onboarding.

## Estimates
- Overall S-Tier Definition of Done: **29%** qualitative.
- Buyer-readiness: **36.8/100 ≈ 37/100**, weighted internal estimate, not appraisal.
- Tier 1 ₹15–20 lakh fair asset value unsupported.
- Tier 2 ₹10–20 crore aspirational only; requires sustained paid ARR, retention, growth, margins, clean IP/provider rights and independent valuation.


## Latest CI and documentation synchronization — 12 November 2026

- Current PR #98 exact head `c3ddc3e32423a219c2c456cd92c1cba42b87ed88` passed Main [#43238989690](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989690) 45/45 and Browser [#43238989457](https://github.com/s85960833-byte/NovaAI/actions/runs/43238989457) 16/16.
- README, top-level Data Room index, Technical Data Room, buyer objection review and pitch deck evidence references are synchronized to the latest candidate.
- Backup/restore process is documented; no export/restore was executed.
- This documentation update does not close the live Staging, Production, Auth, device, provider-rights, ownership, privacy or legal blockers.


## Buyer-pack additions — 12 November 2026

- Added an evidence-limited “Why evaluate NOVA?” brief, Buyer/Technical FAQ and selected Improvement Register; all are internal evaluation materials, not acquisition offers.
- The scorecard remains 37/100 and no exclusivity, fair sale price, revenue or buyer interest is claimed.


## Account deletion/data-lifecycle blocker — 12 November 2026

- Read-only live Postgres catalog query found eight public FKs to `auth.users(id)`: six RESTRICT (BI analyses, datasets, memberships, organisation creators, workflow approvals and workflow proposals), one audit actor SET NULL and one workspace snapshot CASCADE.
- The account UI only deletes `nova_user_workspaces`; no full Auth account deletion flow exists.
- No deletion code or schema changes were applied. A blind delete endpoint could fail on RESTRICT keys or harm shared tenant/audit records.
- `ACCOUNT_DELETION_REVIEW.md` records the exact catalog evidence and safe deletion requirements. Full deletion/retention/session revocation remains a critical NO-GO blocker.


## SHA-256 Action Proof enhancement — pending verification

- Added a browser-safe `sha256Hex` helper using Web Crypto and exact File ArrayBuffer bytes.
- NOVA BI analysis metadata now carries the source-file SHA-256, row counts, column mapping and calculation version. The portable JSON bundle contains proof + analysis but not raw CSV bytes.
- The proof screen shows the digest and warns that derived output may contain user-provided values.
- Unit test checks the standard `abc` SHA-256 test vector and deterministic demo-file digest. A Chromium workflow test imports the expense CSV, calculates the result, checks the digest against Node's independent SHA-256 implementation and downloads the portable bundle.
- The code change and tests are in the next candidate change; no CI pass or live behavior is claimed until the exact next SHA passes.


## Browser source-proof regression — 12 November 2026

- On exact head `b9415d5d79d2a32512ea8c953e93aa352eb80f43`, Main CI passed but Browser CI failed only at `scripts/bi-proof-browser.mjs` while waiting for CSV import to report `SHA-256 ready`.
- Preceding Chromium checks passed: account/privacy/sync, BI CSV calculations, risk, scenario, workflow proposal, Action Proof export and Company Cloud mobile flows. The failing check did not expose the final import status, secure-context flag or WebCrypto availability.
- Updated the browser proof test to use `localhost`, wait for terminal import state, and report status + `isSecureContext` + WebCrypto capability before asserting SHA success. This is a diagnostic/test hardening change; it does not weaken the SHA requirement.
- Current browser rerun is pending. Do not claim SHA proof is verified until the exact new head passes.
- Existing synthetic CSV fixtures and deterministic Node tests are in `samples/` and `scripts/demo-data.test.cjs`; they are fictional only.
