# NOVA — Pitch Readiness Pack

**Audit snapshot:** 7 November 2026  
**Pitch status:** Ready for an honest concept / early design-partner conversation. **Not cleared for a live production demo, customer onboarding, payment collection, or service guarantees.**  
**Unified demo candidate:** `feature/nova-integrated-release-20261106` — Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73)  
**Unified candidate head:** `2054bedf6e193521ebf903d58e3d7d544893f271` (the documentation-only follow-up is tracked separately from the verified application snapshot).  
**Documentation and pitch materials:** maintained on the unified Draft PR #73 branch.  
**Latest candidate CI:** run [#1018](https://github.com/s85960833-byte/NovaAI/actions/runs/42327994039) passed on exact application-and-documentation head `2054bedf6e193521ebf903d58e3d7d544893f271`: 55/55 steps completed, 52 succeeded, 3 live-environment steps skipped by design, and 0 failures. Live Render/provider and live image-generation checks were skipped.  
**Production branch:** `main`, last inspected head `48e12a68af656b471853ac2a4509da0e3df7ab24`  
**Production URL:** https://novaai-4auo.onrender.com

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

The unified candidate is Draft PR #73. The UI-only PR #66 and BI-only PR #67 are predecessors; neither is the release branch. Combined CI run #1018 passed on the latest integrated head. Its checks cover:

- Backend/frontend syntax and mode registry.
- PostgreSQL migration application and tenant RLS integration.
- Deno Edge Function dependency installation, type-check, auth and CORS smoke.
- BI calculations, CSV validation and 60-case evaluation fixture validation (not a live AI accuracy score).
- Production dependency audit.
- Local routes, response headers and PWA assets, including offline caching of the bilingual home and BI scripts.
- Company Cloud browser workflows.
- Chromium workspace navigation and five viewport widths, including drawer and Settings regression checks.

CI #1018 passed on the exact candidate head. Physical Android behavior, live signup/email, and production/provider behavior are not covered by branch CI; live Render/provider/image checks were skipped in this run.
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
