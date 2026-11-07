# NOVA — Pitch Readiness Pack

**Audit snapshot:** 7 November 2026  
**Pitch status:** Ready for an honest concept / early design-partner conversation. **Not cleared for a live production demo, customer onboarding, payment collection, or service guarantees.**  
**Unified demo candidate:** `feature/nova-integrated-release-20261106` — Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73)  
**Last full application-code verification:** exact candidate SHA `e2702c12c89749b4f623857c6ac924b5f1871739` passed GitHub Actions run [#1288](https://github.com/s85960833-byte/NovaAI/actions/runs/42367968496), including syntax, migration/RLS integration, Edge Function type-check, dependency audit, Company Cloud browser workflows and five-viewport Chromium regression tests. The browser screenshots are attached to the run artifacts. This is automated candidate evidence, not live-device or production-release certification.
**Documentation and pitch materials:** maintained on the unified Draft PR #73 branch.  
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

Draft PR #73 combines the three-workspace interface, BI module and security-hardening work. PR #66 is the earlier UI-only predecessor.

The unified candidate is Draft PR #73. The UI-only PR #66 and BI-only PR #67 are predecessors; neither is the release branch. The last full code-verification snapshot was `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` (runs #1200/#1201); see the audit addendum for later exact-head documentation checks. The verification job covers:

- Backend/frontend syntax and mode registry.
- PostgreSQL migration application and tenant RLS integration.
- Deno Edge Function dependency installation, type-check, auth and CORS smoke.
- BI calculations, CSV validation and 60-case evaluation fixture validation (not a live AI accuracy score).
- Production dependency audit.
- Local routes, response headers and PWA assets, including offline caching of the bilingual home and BI scripts.
- Express per-IP throttling before JSON parsing, plus normalized JSON 400/413 responses for malformed and oversized API bodies; runtime smoke tests cover the ordering and status codes.
- Company Cloud browser workflows.
- Chromium workspace navigation and five viewport widths, including drawer and Settings regression checks.
- BYOK API keys remain active-tab-only, are excluded from normal browser persistence, and are never embedded in exported shareable HTML; each recipient must enter their own provider key. A static regression guard enforces this export boundary.

The last full code-verification snapshot was `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` (runs #1200/#1201); see the latest audit addendum and PR #73 for exact-head documentation checks. Live Render/provider and free-provider image checks were skipped because preview deployment was not authorized. Physical Android behavior, live signup/email, two-account tenant isolation, and production/provider behavior are not covered by branch CI; live Render/provider/image checks were skipped.
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
|---|---|---|
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

7 November 2026 audit decision: **GO for an honest concept and early design-partner pitch. NO-GO for a guaranteed live-product demo, public onboarding, paid subscriptions, or a zero-error promise.**

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
- Pitch clearance remains: concept/discovery/design-partner conversation only. No live candidate demo, public onboarding, paid plan, SLA, BI deployment, confidential-data handling or zero-error claim.
- Earlier sections contain the full technical evidence and detailed gates. This addendum supersedes their older CI run/head references where those references are historical snapshots; always use PR #73 and its exact-head checks for the latest candidate status.

## Current exact-head status — 7 November 2026 (supersedes older checkpoint references)

- Draft PR #73 current code head at this audit: `e2702c12c89749b4f623857c6ac924b5f1871739`; it remains open, Draft, unmerged and not deployed.
- Exact-head CI runs [#1222](https://github.com/s85960833-byte/NovaAI/actions/runs/42346535889) and [#1223](https://github.com/s85960833-byte/NovaAI/actions/runs/42346539792) both passed. PostgreSQL migration/RLS integration, Edge Function type-check and invitation tests, dependency audit, local/PWA smoke, Company Cloud browser workflows and five-viewport Chromium tests passed.
- The current head differs from the last application-code-verified snapshot `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` only in documentation (`NOVA_PITCH_KIT.md`, `PITCH_READINESS.md`, `PITCH_SCRIPT.md`, `README.md`). These CI results do not constitute live deployment or physical-device certification.
- Live Render/provider and free image-generation checks were skipped because no isolated preview was authorized. Signup/email delivery, two-real-account tenant isolation, physical Android, preview runtime, backup/restore, privacy/retention and incident-response checks remain open.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; no merge, deployment or live Supabase changes were made. This addendum supersedes older candidate-head/checkpoint references above; use PR #73 for newer status.
