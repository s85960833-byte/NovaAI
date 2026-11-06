# NOVA — Pitch Readiness Pack

**Audit snapshot:** 6 November 2026  
**Pitch status:** Ready for an honest concept / early design-partner conversation. **Not cleared for a live production demo, customer onboarding, payment collection, or service guarantees.**  
**Integrated demo candidate:** `pitch-readiness-20261106` — Draft PR [#66](https://github.com/s85960833-byte/NovaAI/pull/66)  
**Application code snapshot:** `344f46ad4b4b08fae035adf0a52a5049548cf58f`  
**Documentation-integrated branch head:** `d3c2ad6a45b6442bfc71363e942b3269c6874200`  
**Latest candidate CI:** [Run #896 — passed on current documentation-integrated head](https://github.com/s85960833-byte/NovaAI/actions/runs/42226220598)  
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

Draft PR #66 combines the three-workspace interface and the security-hardening work that was previously split across PRs #64 and #65.

The application code snapshot `344f46ad4b4b08fae035adf0a52a5049548cf58f`, with documentation-integrated branch head `d3c2ad6a45b6442bfc71363e942b3269c6874200`, has a successful [CI #896](https://github.com/s85960833-byte/NovaAI/actions/runs/42226220598). Its single verification job passed:

- Backend and frontend syntax checks.
- Mode registry checks.
- Validation of the 60-case AI evaluation fixture. This validates the test fixture structure; it is **not** a live model accuracy score.
- Production dependency vulnerability audit.
- Local Express routes and PWA asset checks.
- Local HTTP security-header assertions.
- Chromium workspace interaction tests.
- Responsive layout, drawer, Settings, and sidebar regression tests at 360, 390, 412, 760, and 1280 CSS-pixel widths.
- Devanagari font installation and visual screenshot artifact upload.

**The same CI run skipped** the live Render website/provider checks and the free-provider image-generation smoke test. No claim is made that those tests passed.

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
| NOVA Business Intelligence | Separate BI branch and Supabase controls have been audited | real-account/email flows, privacy/retention, backup/restore and manual Android checks |
| Production release | PR #66 is isolated from `main`; no merge or deployment was performed | Owner-approved merge/release, Render deploy, exact deployed commit and full production smoke test |

## 7. Product and data boundaries

- Existing general NOVA chat/settings are browser-local. Clearing browser/site data can remove that local history. Do not say it is synced to a NOVA account.
- AI provider availability, response quality, latency, and free-tier quotas can change. No perfect-answer or always-available promise is appropriate.
- Use synthetic or non-sensitive sample prompts and files during early demos. Do not upload confidential company, employee, student, financial, or personal data.
- Do not quote pricing, subscription entitlements, monthly limits, refunds, or provider guarantees until the actual cost and commercial terms are reviewed and approved.
- Do not claim security certification, regulatory compliance, enterprise readiness, or zero errors.
- No customer count, revenue, retention, or traction is currently evidenced in this audit.

## 8. NOVA Business Intelligence — separate and not part of this pitch demo

NOVA Business Intelligence remains a separate Draft PR [#46](https://github.com/s85960833-byte/NovaAI/pull/46) on `feature/nova-business-intelligence`; it is not integrated into PR #66 or the Production release.

Latest checks on the approved Supabase project `qrfwsewppafhxibdboam` found:

- Project state: `ACTIVE_HEALTHY`, PostgreSQL 17.
- 12 migrations recorded.
- 10 NOVA BI tables; RLS enabled on all 10.
- `nova-bi-api` Edge Function is ACTIVE at version 13 with JWT verification enabled.
- Supabase Security Advisor: 0 findings; Health Advisor: 0 findings.
- Performance Advisor: 13 unused-index INFO notices. These are observations, not security findings; indexes were not removed without workload evidence.
- Current live counts: 0 Auth users, 0 organizations, 0 memberships.
- The invitation-acceptance permission gap was fixed with a narrow `UPDATE(status)` grant. SQL confirms authenticated users cannot update membership `role`, `organization_id`, or `user_id`.
- The latest BI branch head `c64887340cebf4f0ca18d6f83ca300e2cd3d0c19` passed push-triggered [CI #887](https://github.com/s85960833-byte/NovaAI/actions/runs/42222549923), including PostgreSQL migration/RLS integration, Deno type-check, deployed Edge Function auth/CORS checks, calculations/CSV validation, and the Company Cloud mobile browser flow. The run skipped live Render/provider checks.
- PR #46 remains non-mergeable and is 196 commits ahead / 18 behind the inspected `main` head. Its auth/email, two-real-account tenant isolation, SMTP delivery, retention, backup/restore, privacy, incident response, and manual device gates remain open.

BI capabilities such as profitability analysis, cost-leak review, productivity indicators, heuristic project risk, scenario modeling, workflow proposals, Action Proof, and workspace branding must be described as a separate development candidate only. The risk model is heuristic; the Digital Twin is assumption-based; workflow items are approval-gated proposals and do not execute external company actions. Do not present BI as launched, certified, or ready for production customers.

## 9. Repository and branch history — what to use

- **PR #66:** use this as the one integrated three-workspace demo candidate. Keep it Draft until the manual and release gates are cleared.
- **PR #64 and PR #65:** their security and workspace changes are incorporated into #66. Do not merge these older source PRs separately.
- **PR #10 and PR #35:** older, diverged four-section UI branches. They are not the current three-workspace pitch candidate. Do not merge them into this release.
- **PR #46:** separate NOVA Business Intelligence development branch. Keep out of the #66 pitch demo and out of Production.
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
The integrated three-workspace experience is a Draft candidate. We are validating it before calling it a public production release.

**Can you guarantee every AI answer or generation will work?**  
No. Providers can be unavailable, slow, or rate-limited. We will report failures honestly and keep validating reliability.

**Is chat history saved to an account?**  
The current general NOVA chat/settings history is browser-local. Account-backed cross-device sync is not established.

**Can a company upload confidential data?**  
Not for this early preview. Use synthetic or non-sensitive data only.

**Is Business Intelligence included?**  
No. NOVA BI is a separate development candidate with its own release gates.

**What does NOVA cost?**  
Pricing and usage limits are not being promised until provider costs, support, privacy, billing, and refund terms have been reviewed.

## 12. Final go / no-go

6 November 2026 audit decision: **GO for an honest concept and early design-partner pitch. NO-GO for a guaranteed live-product demo, public onboarding, paid subscriptions, or a zero-error promise.**

Before the new three-workspace build can be presented as a live demo, the remaining gates are:

1. Obtain an approved preview/release path for the Draft candidate; Production remains on `main`.
2. Test the candidate on the actual Android phone, including touch, keyboard, visual fit and low-network behavior.
3. Verify existing saved chats/settings and each exact Learn / Build / Agents action on that phone.
4. Run live, non-paid provider smoke tests and image generation on the approved candidate preview.
5. Check real HTTPS response headers/HSTS and run post-deploy regression tests after an approved release.
6. Keep general NOVA authentication and NOVA BI outside the offer unless their separate release requirements are completed.

No tool can honestly guarantee that a future pitch/demo will encounter zero errors. The goal is to make the demonstrated scope small, tested, clearly labelled, and backed by a fallback recording.
