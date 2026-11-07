# NOVA — Pitch Readiness Pack

**Audit snapshot:** 7 November 2026  
**Pitch status:** LIMITED CONCEPT DISCOVERY ONLY — explain the product direction and request non-sensitive feedback while clearly stating that the unified candidate is not deployed. No paid sales, customer onboarding, confidential-data use, live demo guarantees, SLA or production-readiness claims until the release gates close.
**Unified candidate:** `feature/nova-integrated-release-20261106` — Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73)  
**Latest exact-head verified candidate snapshot:** `7b58d7b6ceac4a15ef6c93c72e6639f240a13fef`; exact-head push CI #42383854278 and PR CI #42383859510 passed. These final commits only synchronize documentation references; the latest application-code verification snapshot remains `1f24545b9a42ee1883c4293b2b74b9f6ecc8f4cf` (exact-head push/PR CI #42382919198 and #42382923272). GitHub comparison reports 464 commits ahead, 0 behind and 63 changed files; review the full history/diff before any merge.
**Latest full application-code verification snapshot:** `1f24545b9a42ee1883c4293b2b74b9f6ecc8f4cf`; exact-head CI #42382919198 and #42382923272 passed. The later `2fb0...` change only corrected comments and also passed exact-head CI.
**Live and physical checks not covered:** deployed Edge Function CORS, live Render/provider/image smoke, real SMTP/Auth email delivery, two-real-account live tenant isolation, and physical Android testing. CI success does not close these gates.
**Production branch:** `main`, last inspected head `48e12a68af656b471853ac2a4509da0e3df7ab24`  
**Production URL:** https://novaai-4auo.onrender.com

## 0. Hosting and recovery are production blockers

The connected hosting accounts are currently on free tiers: Render service `NovaAI` is on the Free compute plan, and the Supabase organization is on the Free plan. This is not suitable for a production sales promise:

- Render says Free web services are not for production applications; they spin down after 15 minutes without inbound traffic and may take about one minute to restart. Free instances also lack persistent disks and can be restarted by the platform ([Render Free instance limits](https://render.com/docs/free)).
- Supabase Free does not include automatic backups; its guidance is to create and retain manual off-site backups. Free projects can also pause after one week of inactivity ([Supabase Free-plan backup FAQ](https://supabase.com/kb/faqs/platform/free-plan-backups), [backup documentation](https://supabase.com/docs/guides/platform/backups), [pricing](https://supabase.com/pricing)).
- The current Render service is in Singapore while the connected Supabase database is in Ireland (`eu-west-1`). Supabase recommends choosing a region close to users and offers Mumbai and Singapore regions. This cross-region setup should be benchmarked and a target region chosen before production; changing region requires a migration to a new project ([Supabase region guide](https://supabase.com/docs/guides/platform/regions)).
- Render's service configuration currently has no health-check path set, even though the candidate server exposes `/health`. Configure the Render health check path to `/health` before a production deployment so failed starts are not treated as healthy.

Therefore NOVA cannot honestly be described as production-grade for customer onboarding, business-critical use, backup/recovery guarantees, or an SLA on the current plans. Clearing this gate requires an owner-approved hosting decision, paid always-on Render compute, an appropriate Supabase plan or independently tested off-site backup process, and a successful restore drill. No paid plan or live infrastructure setting has been changed.

## 1. What NOVA is

NOVA is an India-oriented, Hindi-English AI workspace intended to make study, digital creation, and everyday AI assistance easier to access from one mobile-first web app.

Its intended navigation has three workspaces:

- **NOVA Learn:** study and learning workflows, including photo-based questions and learning modes.
- **NOVA Build:** digital creation workflows, including Image Studio and builder-oriented tools.
- **NOVA Agents:** general assistant, agent-oriented workflows, voice entry points, and saved history.

The current product message is a **product direction and prototype**, not a claim that every workflow is already live, reliable, or used by customers.

## 2. Pitch positioning

**One-line pitch**

NOVA is a Hindi-English AI workspace for India that brings learning, digital creation, and everyday AI assistance together in one mobile-first experience.

**30-second Hindi pitch**

NOVA एक Hindi-English AI workspace है, जिसका उद्देश्य पढ़ाई, digital creation और रोज़मर्रा की AI सहायता को एक ही mobile-first अनुभव में व्यवस्थित करना है। इसमें तीन स्पष्ट हिस्से हैं — NOVA Learn, NOVA Build और NOVA Agents। हम भारत के users के लिए इसे सरल और bilingual बनाने पर काम कर रहे हैं। अभी हम शुरुआती demo partners से feedback लेना चाहते हैं, ताकि public launch से पहले वास्तविक उपयोग के आधार पर product को बेहतर बनाया जा सके।

**30-second English pitch**

NOVA is a Hindi-English AI workspace designed to bring learning, digital creation, and everyday AI assistance into one mobile-first experience. It is organized into three clear areas: NOVA Learn, NOVA Build, and NOVA Agents. We are preparing an India-focused experience and are looking for early design partners to test real workflows and help us improve the product before a wider release.

## 3. The problem and product hypothesis

People may need separate tools for study help, creating digital work, asking questions, handling files, and voice-based assistance. NOVA's hypothesis is that a clear bilingual workspace can make these workflows easier to discover and use.

This is a hypothesis to validate. Do not claim market demand, willingness to pay, user retention, customer traction, revenue, or product-market fit without independently collected evidence.

**Differentiation to test in conversations:** the combination of Hindi-English navigation, three task-specific workspaces, and a mobile-first experience. Do not claim that these features are unique in the market.

## 4. What has been verified in the candidate

Draft PR #73 combines the three-workspace interface, NOVA Business Intelligence and candidate security-hardening work. PR #66 (UI-only) and PR #67 (BI-only) are predecessors, not the release branch.

Historical checkpoint: application-code snapshot `3014e4bcd4600c09320045e8caacdab7c53ba53d` passed CI [#42379943971](https://github.com/s85960833-byte/NovaAI/actions/runs/42379943971); subsequent code changes were verified on `1f24545b9a42ee1883c4293b2b74b9f6ecc8f4cf` by exact-head push/PR CI #42382919198 and #42382923272. The executed application-code checks cover:

- Backend/frontend syntax, security regression checks and mode registry.
- PostgreSQL migration application and tenant RLS integration tests.
- Deno Edge Function type-check and exact-origin CORS unit tests.
- BI calculations and CSV validation (not a live AI accuracy score).
- Production dependency audit.
- Local routes, response headers, PWA assets and runtime behavior.
- Express per-IP throttling and malformed/oversized request handling.
- Chromium workspace navigation, PDF module/worker/upload paths, Company Cloud browser workflows, and five viewport widths including drawer and Settings regressions.
- BYOK API keys remain active-tab-only, are excluded from normal browser persistence, and are not embedded in exported shareable HTML; each recipient must enter their own provider key.

These results are candidate-branch automated checks. They do **not** prove that the deployed Render/Supabase services are healthy, that Auth email reaches real inboxes, that two real customer accounts are isolated, or that the app works correctly on a physical Android device. Live Render/provider/image checks were skipped because an isolated candidate deployment has not been authorized.

## 5. Exact demo plan

Use this sequence only on the exact candidate build after opening that build on the presentation device. The candidate is not currently the Production deployment; do not silently substitute the existing Production URL and describe it as the new three-workspace build.

1. **Home — 45 seconds:** show Learn, Build, and Agents and explain the job of each.
2. **Language — 30 seconds:** switch interface language and show the bilingual labels. Do not claim every provider response is translated.
3. **Learn — 60 seconds:** try one harmless sample learning question. Use a working path only; do not use private student data.
4. **Build — 60 seconds:** open the Image Studio / creation entry point. A queue, timeout, or provider limit must be described honestly; never fake a generated result.
5. **Agents — 60 seconds:** ask one short general question. Show voice only after a real microphone and speaker check on that device.
6. **Saved history and close — 45 seconds:** explain that the existing chat/settings history is browser-local, then ask for feedback.

Keep a screenshot or screen-recording backup of the candidate. Clearly label screenshots as candidate/preview images, not proof of a live Production release.

## 6. What is not yet cleared

| Area | Verified evidence | Still not verified |
| Hosting and recovery | Render and Supabase plans inspected; current regions confirmed | Paid always-on compute, tested off-site backup and restore drill, monitoring, and region decision (Render Singapore vs Supabase Ireland; India-focused Mumbai/Singapore options need latency and residency review) |
|---|---|---|
| Candidate UI | CI Chromium interaction and five viewport widths passed | Physical Android touch, visual fit, keyboard, accessibility, reduced-motion and low-network behavior |
| Backend and PWA | Local routes, PWA assets and syntax checks passed; Render service is LIVE on Production commit `48e12a68af656b471853ac2a4509da0e3df7ab24`; recent Render error logs and HTTP 500/502/503 request logs returned no entries | Direct public-route response, HTTPS headers/HSTS, and candidate deployment remain unverified |
| AI providers | Static/local route checks and provider fallback code exist | Fresh live chat, search, voice transcription/speech and image-generation checks on the exact candidate |
| Image security | Worker-controlled remote image URL fetching is disabled; decoded image payload size/type validation is bounded; local security-header checks passed | Live HTTPS response-header/HSTS verification and live free-provider image result |
| Saved data | Existing `nova` / `nova_t` storage contract is preserved by design; new mode history is additive | Existing chats/settings must be checked on the actual presentation device |
| General NOVA account | No general assistant account-backed login is established | Signup, sign-in, cross-device chat sync and account recovery are not launch claims |
| NOVA Business Intelligence | BI code, Supabase controls and tenant tests are included in unified Draft PR #73 | real-account/email flows, privacy/retention, backup/restore and manual Android checks |
| Production release | PR #73 is isolated from `main`; no merge or deployment was performed | Owner-approved merge/release, Render deploy, exact deployed commit and full production smoke test |

## 7. Product and data boundaries

- Existing general NOVA chat/settings are browser-local. Clearing browser/site data can remove that local history. Do not say it is synced to a NOVA account.
- AI provider availability, response quality, latency, and free-tier quotas can change. No perfect-answer or always-available promise is appropriate.
- Use synthetic or non-sensitive sample prompts and files during early demos. Do not upload confidential company, employee, student, financial, or personal data.
- Do not quote pricing, subscription entitlements, monthly limits, refunds, or provider guarantees until the actual cost and commercial terms are reviewed and approved.
- Do not claim security certification, regulatory compliance, enterprise readiness, or zero errors.
- No customer count, revenue, retention, or traction is currently evidenced in this audit.

## 8. NOVA Business Intelligence — included in the unified candidate, not production

NOVA Business Intelligence is included in unified Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73), alongside the three-workspace UI. It remains a feature candidate, not a launched service, and is not part of Production.

Latest checks on the approved Supabase project `qrfwsewppafhxibdboam` found:

- Project state: `ACTIVE_HEALTHY`, PostgreSQL 17.
- 12 migrations recorded.
- 10 NOVA BI tables; RLS enabled on all 10.
- `nova-bi-api` Edge Function is ACTIVE at version 13 with JWT verification enabled.
- Live v13 still reads request bodies fully before checking their size, lacks the candidate's explicit 400/413 input handling, does not use the candidate's NOVA site redirect override, and lacks compensating cleanup if invitation membership/audit writes fail. These are candidate-only fixes pending an approved deployment.
- The live Edge Function's `deno.json` does not pin `@supabase/server`; the candidate pins version `1.9.2`.
- Read-only database inspection confirms the live rate-limit function still has `search_path=public, pg_temp`; its execute ACL is limited to `postgres` and `service_role`. The candidate's forward-only migration to an empty search_path remains unapplied.
- Supabase Security Advisor: 0 findings; Health Advisor: 0 findings.
- Performance Advisor: 13 unused-index INFO notices. These are observations, not security findings; indexes were not removed without workload evidence.
- Current live counts: 0 Auth users, 0 organizations, 0 memberships.
- The invitation-acceptance permission gap was fixed with a narrow `UPDATE(status)` grant. SQL confirms authenticated users cannot update membership `role`, `organization_id`, or `user_id`.
- The BI-only predecessor PR #67 had successful automated checks, and its migrations, RLS tests and Edge Function code are carried into unified PR #73. The current combined PR #73 CI is the authoritative verification run.
- Older PR #46 is a divergent legacy branch and must not be merged as a substitute. Unified PR #73 is the current integrated candidate. Its auth/email, two-real-account tenant isolation, SMTP delivery, retention, backup/restore, privacy, incident response, Preview and manual device gates remain open.

BI capabilities such as profitability analysis, cost-leak review, productivity indicators, heuristic project risk, scenario modeling, workflow proposals, Action Proof, and workspace branding are included in the unified development candidate only; do not present them as launched or generally available. The risk model is heuristic; the Digital Twin is assumption-based; workflow items are approval-gated proposals and do not execute external company actions. Do not present BI as launched, certified, or ready for production customers.

## 9. Repository and branch history — what to use

- **PR #73:** use this as the unified UI + BI preview candidate. Keep it Draft until the manual and release gates are cleared.
- **PR #64 and PR #65:** their security and workspace changes are incorporated into #73. Do not merge these older source PRs separately.
- **PR #10 and PR #35:** older, diverged four-section UI branches. They are not the current three-workspace pitch candidate. Do not merge them into this release.
- **PR #73:** unified NOVA UI + Business Intelligence candidate. Keep it clearly labelled as preview and out of Production until all gates pass.
- **Production `main`:** remains separate from the candidate. No PR was merged and no Render deployment was triggered during this audit.

## 10. Questions to ask a prospective design partner

1. Which workspace — Learn, Build, or Agents — is most useful to you?
2. What task do you currently find slow, confusing, or fragmented?
3. Would bilingual Hindi-English labels make the experience easier?
4. Which exact action would you test more than once a week?
5. What would need to work reliably before you would consider adopting it?

**Recommended ask:** invite a small number of early design partners to try a supervised preview with non-sensitive sample data and give structured feedback. Do not ask them to pay for an unverified service or promise a delivery date.

## 11. Common questions — safe answers

**Is NOVA publicly launched?**  
The unified NOVA experience, including Business Intelligence, is a Draft candidate. We are validating it before calling it a public production release.

**Can you guarantee every AI answer or generation will work?**  
No. Providers can be unavailable, slow, or rate-limited. We will report failures honestly and keep validating reliability.

**Is chat history saved to an account?**  
The current general NOVA chat/settings history is browser-local. Account-backed cross-device sync is not established.

**Can a company upload confidential data?**  
Not for this early preview. Use synthetic or non-sensitive data only.

**Is Business Intelligence included?**  
Yes, in the unified Draft PR #73 preview candidate. It is not deployed or generally available; real-account, SMTP, tenant-isolation and privacy gates still apply.

**What does NOVA cost?**  
Pricing and usage limits are not being promised until provider costs, support, privacy, billing, and refund terms have been reviewed.

## 12. Final go / no-go

7 November 2026 audit decision: **LIMITED GO for concept/discovery conversations only. NO-GO for paid sales, customer onboarding, live demo promises, public signup, paid subscriptions, confidential-data handling, SLA or zero-error guarantees.** Explain clearly that the unified build is an undeployed candidate.

Before the new three-workspace build can be presented as a live demo, the remaining gates are:

1. Obtain an approved preview/release path for the Draft candidate; Production remains on `main`.
2. Test the candidate on the actual Android phone, including touch, keyboard, visual fit and low-network behavior.
3. Verify existing saved chats/settings and each exact Learn / Build / Agents action on that phone.
4. Run live, non-paid provider smoke tests and image generation on the approved candidate preview.
5. Check real HTTPS response headers/HSTS and run post-deploy regression tests after an approved release.
6. Keep general NOVA authentication and NOVA BI outside the offer unless their separate release requirements are completed.

No tool can honestly guarantee that a future pitch/demo will encounter zero errors. The goal is to make the demonstrated scope small, tested, clearly labelled, and backed by a fallback recording.


## 13. Latest pitch-pack reconciliation — 7 November 2026

- Added [NOVA_PITCH_KIT.md](NOVA_PITCH_KIT.md) as the copy-ready founder pack: one-line, 30-second Hindi/English, two-minute pitch, product map, target-segment hypotheses, discovery ask, five-minute demo guardrails, FAQ, claims to avoid, evidence collection and separate NOVA BI treatment.
- The pitch-pack, competitor review, README and index updates are documentation-only commits on the unified candidate branch. The last fully code-verified parent snapshot was `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d`, with successful CI runs [#1200](https://github.com/s85960833-byte/NovaAI/actions/runs/42345216545) and [#1201](https://github.com/s85960833-byte/NovaAI/actions/runs/42345221304). The documentation-only candidate head `51222883356029114e3d26b07f422e83bb1bbeb3` passed exact-head CI runs [#1213](https://github.com/s85960833-byte/NovaAI/actions/runs/42346013628) and [#1214](https://github.com/s85960833-byte/NovaAI/actions/runs/42346016036). Later docs-only commits may supersede that head; always check Draft PR #73 for the latest head and matching checks.
- Production remains `main` at `48e12a68af656b471853ac2a4509da0e3df7ab24`; the three-workspace candidate is not live on the Production URL.
- Only limited concept/discovery conversations are allowed, with the product described as a prototype/release candidate. No live candidate demo, public onboarding, paid plan, SLA, BI deployment, confidential-data handling or zero-error claim.
- Earlier sections contain the full technical evidence and detailed gates. This addendum supersedes their older CI run/head references where those references are historical snapshots; always use PR #73 and its exact-head checks for the latest candidate status.

## Current exact-head status — 7 November 2026 (supersedes older checkpoint references)

- Draft PR #73 current code head at this audit: `e2702c12c89749b4f623857c6ac924b5f1871739`; it remains open, Draft, unmerged and not deployed.
- Exact-head CI runs [#1222](https://github.com/s85960833-byte/NovaAI/actions/runs/42346535889) and [#1223](https://github.com/s85960833-byte/NovaAI/actions/runs/42346539792) both passed. PostgreSQL migration/RLS integration, Edge Function type-check and invitation tests, dependency audit, local/PWA smoke, Company Cloud browser workflows and five-viewport Chromium tests passed.
- The current head differs from the last application-code-verified snapshot `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` only in documentation (`NOVA_PITCH_KIT.md`, `PITCH_READINESS.md`, `PITCH_SCRIPT.md`, `README.md`). These CI results do not constitute live deployment or physical-device certification.
- Live Render/provider and free image-generation checks were skipped because no isolated preview was authorized. Signup/email delivery, two-real-account tenant isolation, physical Android, preview runtime, backup/restore, privacy/retention and incident-response checks remain open.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; no merge, deployment or live Supabase changes were made. This addendum supersedes older candidate-head/checkpoint references above; use PR #73 for newer status.

## 14. Exact-head verification update — 7 November 2026

- Unified candidate Draft PR #73 is at `bf7c6447e9a2db0c43dd5d4dcdcb972c3d1ebbdc`, targeting `main`. It remains open, Draft, unmerged and undeployed.
- Exact-head GitHub Actions runs [#42369819473](https://github.com/s85960833-byte/NovaAI/actions/runs/42369819473) and [#42369814312](https://github.com/s85960833-byte/NovaAI/actions/runs/42369814312) completed successfully. Both jobs passed; the only skipped steps were the three main-branch live Render/provider/image smoke checks, which cannot run on an undeployed feature branch.
- The CI pass verifies the candidate's source and isolated test suite. It does not prove production runtime, actual signup or email delivery, real-account tenant isolation, physical Android behavior, live provider availability, backup recovery, or privacy/legal readiness.
- A fresh read-only Supabase advisor check on 7 November returned zero Security findings and zero Health findings; Performance returned 13 INFO unused-index notices. No indexes were dropped.
- The candidate's exact-origin NOVA BI CORS policy and its Deno tests are included in the successful exact-head runs. This does not replace testing against the deployed Edge Function.
- The candidate's `script-src` no longer permits `'unsafe-inline'`; the primary HTML/workspace surfaces contain no inline script blocks or inline event-handler markup. However, `style-src` still permits `'unsafe-inline'` for inline CSS/style attributes, and broad HTTPS `connect-src` remains. The server adds `frame-ancestors 'none'`, but this is not a fully strict nonce/hash-based policy. Do not claim complete CSP hardening.
- The Render workspace ID previously surfaced as `tea-dbf2qb7avr4c73ck5p1g` has not been confirmed by the owner as NOVA's workspace. No workspace-scoped Render changes were made. The service health-check path remains unconfigured.
- No production deploy, merge, live Supabase migration, Edge Function replacement, Auth configuration change, paid infrastructure change, or branch-protection change was made.
- **Current decision remains NO-GO for paid sales pitches, production customer onboarding, and paid-service promises.** Limited concept discovery only is permitted.

## 15. Latest candidate security and verification update — 7 November 2026

- Current candidate code head before this documentation update: `a8912478ac16375b233fede106c31a70fad3b023`.
- Exact-head CI runs [#42371098562](https://github.com/s85960833-byte/NovaAI/actions/runs/42371098562) and [#42371093659](https://github.com/s85960833-byte/NovaAI/actions/runs/42371093659) both passed. Syntax, isolated mode registry, rate-limit tests, PostgreSQL migration/RLS integration, Edge Function type-check/tests, BI calculations/CSV validation, evaluation-fixture validation, production dependency audit, local runtime/PWA smoke, graceful shutdown, Company Cloud browser workflows, responsive Chromium checks and five-viewport/drawer regression checks all passed.
- The main-branch-only live Render/provider/image smoke steps were skipped. The feature candidate is not deployed to an isolated preview, so no live deployment or provider-readiness claim follows from this CI result.
- Candidate frontend JavaScript was moved out of two inline script blocks into `nova-config.js` and `nova-app.js`; the backend now serves both files and the PWA shell cache includes them. Static and runtime tests verify those routes, the external script tags, no remaining inline script blocks, and the safe local-storage persistence contract.
- **CSP is improved but not yet strict:** `script-src` no longer allows `'unsafe-inline'`, after confirming the primary app surfaces have no inline script blocks or inline HTML event-handler attributes. `style-src` still allows `'unsafe-inline'` for inline CSS/style attributes, and broad HTTPS `connect-src` remains. Markdown link attribute-injection regression tests and Chromium CSP-violation checks passed in run #1407; treat complete CSP hardening as open.
- This was candidate-branch work only. Production `main` and the live Supabase deployment were not changed; PR #73 remains Draft/unmerged. The previous blockers remain: isolated preview/live smoke, real signup and email delivery, two-real-account tenant isolation, physical Android testing, hosting/backup/restore and region decision, confirmed Render workspace/health-check configuration, branch protection, and privacy/retention/incident-response review.
- **Decision: still NO-GO for production onboarding, paid customer data, or service/SLA promises.** Candidate CI success is a necessary engineering gate, not a production release certificate.

## 16. Security regression verification — 7 November 2026

- Latest exact-head candidate CI after correcting the live CORS smoke test: SHA `d5d2f9f603686c2259efc2526611e390113e253e`, run [#42373035543](https://github.com/s85960833-byte/NovaAI/actions/runs/42373035543), passed all executed checks. The deployed Edge Function CORS smoke and live Render/provider/image checks were skipped because this is an unmerged feature branch.


- Candidate code/browser snapshot `bed9e17576e13f1003c10c09fbde7d3f165c0b33` passed exact-head GitHub Actions run [#42372386751](https://github.com/s85960833-byte/NovaAI/actions/runs/42372386751).
- Removed the unnecessary `'unsafe-inline'` token from the page's `script-src` after auditing the main HTML and workspace scripts: no inline script blocks or inline HTML event-handler markup remain in those surfaces. JavaScript DOM event-property handlers remain supported by the policy.
- Added automated regression coverage proving Markdown link destinations cannot break out of their HTML attribute and raw HTML in model output remains escaped. The Chromium smoke test now asserts the tightened script policy and fails on browser CSP violations.
- All executed CI checks passed, including the new Markdown tests, browser CSP checks, Company Cloud workflows, responsive Chromium checks and five-viewport mobile/drawer tests. The three live Render/provider/image checks were skipped because the candidate has no isolated preview.
- Remaining CSP work: remove inline style allowances by migrating the remaining inline CSS/style attributes, and narrow the broad HTTPS `connect-src` while preserving configured BYOK provider support. This is a partial hardening improvement, not a strict CSP certification.
- No production branch, Render service, Supabase migration, Auth configuration, paid plan or live customer data was changed. PR #73 remains Draft and unmerged.

## 18. Auth email delivery and redirect configuration remain unverified

- The Company Cloud UI calls Supabase Auth for signup confirmation, resend confirmation and password reset, and passes `window.location.origin` as the redirect target.
- Supabase's current documentation says its built-in SMTP is not intended for production: it only sends to pre-authorized project-team addresses, currently has a 2-email/hour limit, and has no delivery SLA. A custom SMTP service, authenticated sending domain (SPF/DKIM/DMARC), and a real delivery test are required before public signup. Reference: [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- Supabase requires the Site URL and Redirect URLs allow-list to match the application's actual redirect destinations. The Site URL defaults to `localhost:3000` and is used for confirmation and password-reset redirects. Confirm the production URL `https://novaai-4auo.onrender.com` is configured, and that no broad wildcard redirect is used. Reference: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
- The current Supabase connector does not expose Auth SMTP or URL-configuration settings, and no real email was sent in this audit. Therefore these settings and delivery are **unverified**, not passed. An authorized project owner must verify/configure them in the dashboard and run real signup, resend and password-reset tests using controlled test mailboxes.
- Do not disable email confirmation as a workaround. Keep public signup gated until these checks pass.

## 17. Live NOVA BI CORS discrepancy found — 7 November 2026

- A fresh read-only fetch of the deployed Supabase Edge Function `nova-bi-api` confirms production is still version 13 and its deployed `index.ts` returns `Access-Control-Allow-Origin: *` and answers every OPTIONS request without validating the request Origin.
- This is a real live-production security gap. The candidate code has exact-origin validation and Deno unit tests, but it has **not** been deployed. Do not treat candidate CORS tests as proof that the live endpoint is hardened.
- Corrected `scripts/supabase-edge-smoke.mjs` to require the exact configured NOVA origin, reject an attacker origin with HTTP 403 and no CORS permission, and keep the DELETE preflight check. The deployed-function smoke step is now gated to `main`; candidate PR CI validates the candidate CORS implementation through Deno tests without relying on the older live deployment.
- The next live release sequence still requires an approved Supabase Edge Function deployment followed by the exact-origin smoke test. No live function replacement was performed in this audit.
- Current release status remains NO-GO until the live CORS mismatch and the other listed production gates are closed.



## 19. Latest exact-head tenant-isolation verification — 7 November 2026

- Candidate SHA `8b127c4464bcaeec3c9fd059dd5105e264eeb1ca` passed both GitHub Actions runs [#42376378783](https://github.com/s85960833-byte/NovaAI/actions/runs/42376378783) (push) and [#42376382553](https://github.com/s85960833-byte/NovaAI/actions/runs/42376382553) (pull request). All executable checks passed; four live-only checks were skipped on the unmerged feature branch.
- Expanded PostgreSQL 17 integration coverage verifies that an outsider cannot read another tenant's datasets, analyses, workflow proposals, approvals, executions, branding or audit events; it also attempts cross-tenant dataset insert/update/delete, analysis deletion, workflow decision changes and branding changes.
- Chromium now verifies the pinned PDF.js 6.5.438 module and worker, parses a synthetic PDF, and exercises chat file upload after preloading the PDF.js module without a worker URL. Both chat and Learn loaders set the matching worker URL unconditionally and keep `isEvalSupported:false`.
- This is isolated-database and browser integration evidence, not a substitute for testing with two real Supabase Auth accounts against the deployed Edge Function and live database, nor physical Android testing.
- Live deployment remains unchanged: production Edge Function `nova-bi-api` v13 still has wildcard CORS, and candidate exact-origin CORS code has not been deployed. Candidate PR #73 remains Draft/unmerged; production `main` is untouched.
- External release gates remain: real email delivery, physical Android checks, live candidate preview/provider smoke, hosting/backups, region choice, privacy/deletion review, full CSP hardening, and branch protection.








## Latest candidate verification — 7 November 2026

- Current Draft PR #73 head: `3014e4bcd4600c09320045e8caacdab7c53ba53d`; PR push workflow [#42379943971](https://github.com/s85960833-byte/NovaAI/actions/runs/42379943971) completed successfully. A duplicate push run #42379938717 remains pending without a job and is not counted as a pass.
- The successful run passed syntax/security, PostgreSQL migration and tenant-RLS integration, Deno Edge Function type-check/CORS tests, BI calculations/CSV, dependency audit, local runtime/PWA, Chromium workspace/PDF, Company Cloud mobile-browser workflows and five-viewport responsive/drawer tests.
- Live deployed Edge Function, Render/provider/image checks were skipped because this candidate is not deployed. No physical Android device, real SMTP/Auth email, or two-real-account live tenant test has been completed.
- PR #73 remains Draft, open, unmerged and undeployed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No live service, database, Auth setting, billing plan or deployment was changed.

### Sales boundary

- **Allowed:** concept/discovery conversations and non-sensitive feedback with explicit disclosure that the integrated build is an undeployed release candidate.
- **Not allowed:** paid sale, production onboarding, customer data, live demo guarantees, SLA, zero-error or production-ready claims until the release gates above are evidenced and approved.

## 20. Fresh live Supabase read-only check — 7 November 2026

- Project `qrfwsewppafhxibdboam` reports `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1` (Ireland).
- Current Supabase security advisor response: zero security lints.
- Performance advisor response: 13 INFO-only unused-index notices. These are observations, not proof that the indexes are safe to drop; do not remove tenant/query indexes without workload evidence.
- Live Edge Function `nova-bi-api` remains ACTIVE, version 13, with `verify_jwt=true`. Its retrieved deployed source still sets `Access-Control-Allow-Origin: *` and handles OPTIONS without exact-Origin validation. This is a confirmed production CORS release blocker.
- Candidate PR #73 contains exact-origin CORS middleware and tests, but it is not live. No Edge Function deployment or database/Auth setting was changed during this read-only check.
- GitHub branch-protection endpoint returned HTTP 403 (integration permission unavailable); branch protection is **unverified**, not assumed absent or enabled.
- No real SMTP delivery, Auth redirect allow-list, two-real-user live isolation, Render health-check, off-site backup/restore, or physical Android test was performed by this read-only audit.
- **Decision unchanged: NO-GO for paid customer onboarding or production claims.** Candidate CI and clean security-advisor output do not close the live CORS or operational release gates.



## Authoritative release-status checkpoint — 7 November 2026 (latest)

- Unified candidate branch: `feature/nova-integrated-release-20261106`; Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73) is open, Draft, unmerged and undeployed.
- Exact candidate head: `6c53223686943b068ac36c48fd5ae72c58edc226`.
- Both exact-head CI runs [#42381308464](https://github.com/s85960833-byte/NovaAI/actions/runs/42381308464) and [#42381303719](https://github.com/s85960833-byte/NovaAI/actions/runs/42381303719) completed successfully on that SHA. Automated candidate checks passed, including PostgreSQL migration/RLS integration, Edge Function type-check and CORS/invitation tests, dependency audit, runtime/PWA, browser workflows and five-viewport mobile regression. Live-production checks were skipped because this candidate is not on `main`.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No merge, Render deployment, live database migration, Auth configuration change or paid infrastructure change was performed.
- Live Supabase read-only audit: project healthy; Security Advisor returned zero findings; 13 INFO-only unused-index notices remain. Deployed `nova-bi-api` v13 still uses wildcard CORS. The exact-origin CORS correction exists only in the candidate and is not live.
- **Still open and not code-only tasks:** authorized production release decision; production Edge Function deployment and live CORS smoke; real signup, SMTP/invite and password-reset delivery; two separate real-account tenant-isolation test; physical Android touch/accessibility test; Render health-check configuration and production hosting decision; off-site backup and successful restore drill; CSP refactor/hardening; privacy, retention, deletion and incident-response review; and branch-protection verification (GitHub API previously returned 403, so status is unknown).
- **Sales boundary:** this is not paid-sales or customer-onboarding ready. At most, conduct clearly disclosed, non-sensitive concept-feedback conversations; do not accept payment, promise a live demo/SLA/availability, or collect confidential company/student data. NOVA BI remains unreleased. Any commercial, billing or infrastructure decision must be handled by the authorized adult project owner.

This checkpoint supersedes older candidate-head, CI-run and release-status statements elsewhere in this document. Historical checkpoints are retained as history, not current status.


## Current authoritative release checkpoint — 7 November 2026

- Latest exact-head verified candidate snapshot: `30ce226dc62f28c5546b57e546a6921eb9017f91`; Draft PR #73 remains open, unmerged and undeployed. Exact-head push CI [#42383632884](https://github.com/s85960833-byte/NovaAI/actions/runs/42383632884) and PR CI [#42383635166](https://github.com/s85960833-byte/NovaAI/actions/runs/42383635166) both passed. Later branch updates are documentation-only; see PR #73 for the current head. These include the full HTTP CSP-header regression, isolated PostgreSQL migration/RLS integration, Deno Edge Function type-check/CORS/invitation tests, dependency audit, local runtime/PWA smoke, Chromium workspace/PDF and Company Cloud browser flows, and five-viewport/drawer tests.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; no merge, Render deploy, live database migration or Auth/SMTP change was made.
- Live Supabase project `qrfwsewppafhxibdboam` is healthy (PostgreSQL 17.11, eu-west-1). All 10 NOVA BI tables have RLS enabled. Security Advisor: 0 findings; Health Advisor: 0; Performance Advisor: 13 INFO-only unused-index notices.
- Live migration history has 12 migrations. Candidate migration `20261106195900_nova_bi_rate_limit_search_path_hardening.sql` is not applied live. The live rate-limit SECURITY DEFINER function still has `search_path=public, pg_temp`; execute ACL is restricted to `postgres` and `service_role`. Candidate migration pins an empty search_path and passes the isolated PostgreSQL regression, but this live hardening is still pending.
- Live `nova-bi-api` v13 still uses wildcard CORS. Candidate exact-origin CORS code is not deployed.
- Candidate HTTP CSP now includes resource directives and frame isolation; runtime CI verifies them. Inline styles are still allowed and HTTPS `connect-src` remains broad, so CSP is not fully strict.
- General NOVA chat/settings/history remain browser-local; general consumer cloud accounts/history sync have not been verified. No subscription billing/entitlement flow was found in the audited candidate. Do not promise cloud sync or sell subscriptions.
- Remaining gates: authorized release decision; apply pending DB hardening migration; deploy and verify exact-origin Edge Function; real signup/confirmation/reset/invitation delivery with custom SMTP and exact redirect allow-list; two-real-account tenant isolation and membership lifecycle tests; physical Android test; Render health/production hosting decision; off-site backup and restore drill; privacy/retention/deletion and incident-response review; branch protection (unverified due GitHub API 403); and complete CSP style/connect-src hardening.
- **Decision: NO-GO for paid sales, paid onboarding or production promises.** Only disclosed, non-sensitive concept feedback; no payments, confidential customer data, SLA or live-availability claims. Commercial, billing and infrastructure decisions require the authorized adult project owner.

This checkpoint supersedes older candidate-head, migration-count, CSP and release-status statements above. Older entries are historical audit notes only.


## 20. Re-audit update — 7 November 2026

- Current candidate head is `7b58d7b6ceac4a15ef6c93c72e6639f240a13fef`; exact-head push CI #42383854278 and PR CI #42383859510 both passed. The CI `verify` job completed successfully; live production smoke steps were skipped by design because this candidate is not deployed.
- Live Supabase recheck: project `qrfwsewppafhxibdboam` is `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-west-1`; all 10 `nova_bi_*` tables have RLS enabled; Security Advisor and Health Advisor returned zero findings; Performance Advisor returned 13 INFO-only unused-index notices. Do not drop indexes without workload evidence.
- Live migration history remains 12 entries. Candidate migration `20261106195900_nova_bi_rate_limit_search_path_hardening.sql` is still unapplied. Live `nova_bi_consume_rate_limit` remains `SECURITY DEFINER` with `search_path=public, pg_temp`; execute permission is restricted to `service_role` (plus postgres owner). The candidate migration changes the search path to empty and pins grants, but it has not been applied to production.
- Deployed `nova-bi-api` remains version 13 with JWT verification enabled; deployed source still has wildcard CORS. Candidate exact-origin CORS is covered by unit tests but is not deployed.
- GitHub branch-protection read returned HTTP 403 `Resource not accessible by integration`; protection/required-check enforcement remains unknown, not “disabled” or “enabled”.
- No live Auth/SMTP delivery, two-real-account isolation, physical Android, off-site backup/restore drill, or production-hosting health-check change was performed. Paid sales remain NO-GO.
