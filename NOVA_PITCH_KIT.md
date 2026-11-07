# NOVA — Pitch Kit (Internal Founder Copy Pack)

> **LIMITED CONCEPT DISCOVERY ONLY. This pack may explain the product direction and invite feedback; it is not a live-product sales offer. Do not promise a demo, subscription, deployment, SLA, or production availability.**

**Prepared:** 7 November 2026  
**Purpose:** Controlled concept discovery only. No paid sales, customer onboarding, production demo, or customer-data use until the release gates are closed.
**Product:** NOVA main app only. NOVA Business Intelligence is a separate, unreleased candidate and must not be sold or demonstrated as a live module.  
**Release truth (latest audit):** Draft PR #73 remains open, Draft, unmerged and undeployed at candidate head `6c53223686943b068ac36c48fd5ae72c58edc226`; both exact-head CI runs #42381308464 and #42381303719 passed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. Live-only checks were skipped. The live NOVA BI Edge Function still has wildcard CORS; candidate exact-origin fix is not deployed. Real Auth/SMTP, two-account isolation, physical Android, hosting/health, backup/restore, CSP, privacy/retention/incident response and branch-protection checks remain open. This is not paid-sales ready.

---

## 1. The one-sentence pitch

**NOVA is an India-oriented Hindi-English AI workspace designed to organize learning, digital creation and everyday AI assistance into one mobile-first experience.**

## 2. The 30-second pitch (Hindi)

NOVA एक Hindi-English AI workspace है, जिसे भारत के users के लिए पढ़ाई, digital creation और रोज़मर्रा की AI सहायता को एक ही mobile-first अनुभव में व्यवस्थित करने के उद्देश्य से बनाया जा रहा है। इसमें तीन हिस्से हैं — NOVA Learn, NOVA Build और NOVA Agents। हमारा अगला लक्ष्य वास्तविक users के साथ इन workflows को validate करना और feedback के आधार पर product को बेहतर बनाना है। हम अभी शुरुआती design partners और feedback collaborators से बात कर रहे हैं।

## 3. The 30-second pitch (English)

NOVA is a Hindi-English AI workspace being built for India. It brings three types of work into one mobile-first experience: learning with NOVA Learn, digital creation with NOVA Build, and everyday assistance with NOVA Agents. We are now looking for early design partners to validate which workflows are genuinely useful and what needs to improve before a broader release.

## 4. The 2-minute pitch

Many people switch between different tools when they want help learning something, creating digital work, or getting everyday AI assistance. For users who prefer Hindi, English, or a mix of both, the experience can also feel fragmented.

NOVA's product hypothesis is simple: make these jobs easier to discover through one bilingual workspace, with three clearly separated areas.

- **NOVA Learn:** learning and study-oriented workflows.
- **NOVA Build:** digital creation and builder-oriented workflows.
- **NOVA Agents:** general assistant and agent-oriented workflows.

The product is being developed as a mobile-first web experience for India. Our current focus is not to claim that every workflow is already production-ready. It is to learn which jobs users value most, test the experience with safe sample tasks, and prioritize reliability based on observed use.

We are looking for a small group of early design partners who can review the concept, try a supervised preview when it is available, and give structured feedback. The immediate ask is a short discovery conversation—not a paid commitment.

## 5. Product map — what each workspace means

| Workspace | Intended job | Safe description |
|---|---|---|
| NOVA Learn | Study and learning workflows | A place for learning-oriented AI tasks |
| NOVA Build | Digital creation | A place for builder and creative workflows |
| NOVA Agents | Everyday assistant tasks | A place for general assistance and agent-style workflows |

Do not imply that every card or tool has passed live production testing. The unified candidate is not the current Production deployment.

## 6. Who to speak with first

Treat these as **discovery hypotheses**, not proven customer segments:

1. Students and independent learners who want a clearer Hindi-English learning workflow.
2. Individual creators who want learning and digital creation tools organized in one place.
3. People who regularly use AI assistants and want a simpler bilingual mobile experience.

Ask each person about their current workflow before describing NOVA in detail. Do not claim market size, demand, willingness to pay or product-market fit without evidence.

## 6A. Competitive context — answer honestly

This is an initial public-web scan conducted on 7 November 2026, not an exhaustive competitor audit or proof of market position. The examples below overlap with the learning portion of NOVA; they do not necessarily offer the same overall workspace combination. Competitor features, pricing and availability can change. There are already Indian products addressing parts of the problem:

- [PadhoAI](https://padhoai.in/) publicly describes multilingual AI learning for students, teachers, parents and schools, including 39 Indian languages and multiple school boards.
- [Padhaao](https://www.padhaao.in/) publicly describes board-aligned learning for Indian students, 10 learning modes, Hindi/Hinglish support and a web-based experience.
- [Shrutam SAAVI](https://www.shrutam.ai/hi/) describes personalized, audio-first learning in Hindi, Hinglish, English, Telugu and Marathi.
- [Shiksha Nation AI Tutor](https://shikshanation.com/best-ai-tutor) describes a Hindi/English course-linked tutor with interactive teaching workflows.
- [Manthan AI](https://manthanai.bhaaratmind.com/) describes a Hindi, English and Hinglish tutor for CBSE, ICSE and state-board learners.
- General-purpose assistants such as ChatGPT and Gemini are also alternatives for broad AI tasks.

**Approved answer to “How is NOVA different?”**

“We are not claiming to have a better foundation model or to be the only Indian-language AI product. NOVA's hypothesis is about product organization: putting learning, digital creation and everyday assistance into clearly separated workspaces in one bilingual mobile-first experience. We need real user feedback to learn whether that organization is meaningfully better for a specific group.”

**Positioning implication:** Hindi/English learning is already a competitive category in India. NOVA's proposed Learn + Build + Agents organization may be a product hypothesis worth testing, but no evidence yet establishes that users prefer this combination or that the three-workspace model is defensible.

Do not claim that no Indian competitor offers similar features, or that NOVA is first, unique, more accurate, cheaper or more capable without a current feature-by-feature study and measured evidence.

## 7. The exact ask

Use this closing:

“Would you be open to a 15-minute feedback conversation? I’d like to understand which of these workflows would genuinely save you time, what you currently use, and what you would need to see before trying NOVA. If there is a fit, I can invite you to a supervised preview when the candidate is ready.”

For a potential institutional or business contact:

“Would you nominate one person who could review the workflow and tell us what would need to be reliable, secure and useful before your team considered a pilot?”

Do not ask anyone to upload confidential data, pay for an unreleased feature, or rely on an unverified service.

## 8. Demo rules and 5-minute flow

**Important:** Until the unified candidate has an approved preview deployment and a real-device check, this is a concept/discovery pitch. Do not open the current Production URL and claim it is the new three-workspace candidate.

When an approved preview is available:

1. **Home (45 sec):** Show the three workspaces and explain their intended jobs.
2. **Language (30 sec):** Show bilingual navigation. Do not claim every AI-generated response is translated.
3. **Learn (60 sec):** Use one harmless, pre-tested sample learning task.
4. **Build (60 sec):** Show only a creation action that has just succeeded on that device. If it fails or queues, say so.
5. **Agents (60 sec):** Ask one short general question. Show voice only after testing microphone permission, input and playback.
6. **Close (45 sec):** Ask which task they would return for and what would prevent adoption.

Before any demo:
- Confirm the exact URL and label it as Preview or Production correctly.
- Test the exact sequence on the presentation device and network.
- Use synthetic, non-sensitive examples only.
- Keep a short screen recording as a backup, labelled as a recording of the candidate.
- Do not fake a result, conceal a failure, or describe a screenshot as a live demo.

## 9. Evidence you can state accurately today

- The unified candidate is maintained in Draft PR #73.
- The exact candidate snapshot `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` passed GitHub Actions verification runs [#1200](https://github.com/s85960833-byte/NovaAI/actions/runs/42345216545) and [#1201](https://github.com/s85960833-byte/NovaAI/actions/runs/42345221304).
- Automated checks include code syntax, mode registry, rate-limit tests, PostgreSQL 17 migrations and RLS integration, Edge Function type-check and invitation tests, auth/CORS smoke, BI calculations and CSV validation, dependency audit, local server/PWA smoke, Company Cloud browser workflows and Chromium UI checks at five viewport widths (360, 390, 412, 760 and 1280 CSS pixels).
- Candidate screenshots were reviewed at those viewport widths. This is Chromium emulation, not a physical Android test.
- The current Production branch is still `main`; the unified candidate has not been merged or deployed.

Do not turn these engineering facts into claims of “zero bugs”, “certified security”, “production readiness” or guaranteed uptime.

## 10. Common questions — approved answers

**Is NOVA live?**  
An earlier Production version is hosted. The unified three-workspace candidate is still in Draft PR #73 and is not the Production build. We are seeking early feedback while release validation continues.

**Can I use all three workspaces today?**  
The three-workspace experience is in the candidate build. It is not yet deployed to the Production URL. We can discuss the concept now and arrange a supervised preview after its release gates are cleared.

**Does NOVA work in Hindi and English?**  
The product direction includes Hindi-English navigation and labels. Do not promise that every upstream AI response is translated or equally accurate in both languages.

**Is chat history cloud-synced?**  
The current general NOVA chat/settings history is browser-local. Do not describe it as account-backed or cross-device synced.

**Will AI always respond?**  
No such guarantee is made. Provider availability, latency, quotas and output quality can vary.

**What does it cost?**  
Commercial pricing and plan entitlements are not being quoted yet. They need cost, usage, support, billing, privacy and refund review first.

**Who is already using NOVA?**  
No customer traction, paid customers, retention or revenue is evidenced in this pitch pack. Do not invent numbers.

**Is NOVA Business Intelligence included?**  
NOVA BI is a separate development candidate in PR #73, not a launched or generally available service. It is not part of the current Production offer.

**Can we upload company, student or personal data?**  
Not for early discovery. Use synthetic or non-sensitive sample information only.

## 11. NOVA Business Intelligence — separate future conversation only

NOVA BI is a separate B2B product direction: an AI-assisted profit and operations workspace intended to help analyze company datasets and prepare evidence-backed decision support. Its candidate includes cost-leak review, client profitability analysis, team-level productivity indicators, heuristic project-risk review, assumption-based scenarios, approval-gated workflow proposals, Action Proof exports and workspace branding.

Critical limitations:
- It is not deployed or generally available.
- Real signup, email delivery, two-account tenant isolation, preview deployment, manual Android, backup/restore, retention, privacy and incident-response gates remain open.
- Project risk is a heuristic, not a trained or calibrated prediction.
- Scenarios use user-entered assumptions; they are not guaranteed savings or forecasts.
- Productivity output is team-level, not individual employee surveillance or ranking.
- Workflow proposals do not execute external company actions.
- Branding controls do not provide custom domains or complete removal of NOVA branding.
- External accounting, HR, CRM, project-management and payment integrations are not implemented.

If a contact asks about BI, say it is a separate prototype under validation and offer only a future discovery conversation. Do not sell it as deployed software or accept sensitive company datasets.

## 12. Claims to avoid

Never say:
- “100% error-free”, “zero bugs”, “guaranteed uptime” or “every feature works”.
- “The new UI is live on Production” while PR #73 remains unmerged.
- “Thousands of users”, “paying customers”, “revenue”, “retention” or “market validated” without evidence.
- “Unique in India” or “no competitor does this” without a current, documented market study.
- “Unlimited free AI”, fixed response times or unverified subscription limits.
- “Enterprise-grade”, “SOC 2 certified”, “compliant” or “fully secure”.
- “Cloud-synced chats” or “automatic company workflow execution”.
- “AI predicts project failure” as a calibrated claim.
- “Guaranteed profit improvement” or “savings”.

## 13. Discovery questions and evidence to collect

After each conversation, record:
- User type and context (with permission; avoid unnecessary personal data).
- The exact job they are trying to complete.
- Their current alternative and what is frustrating about it.
- Which NOVA workspace they would try first.
- Whether they would return weekly and why.
- What would stop them from adopting it.
- What evidence they need before a pilot.
- Whether they would introduce another relevant user.

Do not turn a positive comment into a paying-customer signal. Track interview count, repeated pain points, preview activation, task completion, repeat usage and willingness-to-pay separately.

## 14. Commercial and legal guardrails

No price, subscription, contract, SLA, refund promise or paid pilot is approved by this document. Before accepting money or signing any agreement, get appropriate parent/guardian and qualified legal/accounting support, and establish the actual service, support, data and refund obligations.

## 15. Final pitch status

<badge>GO — concept / discovery pitch only</badge>

**Not cleared:** live demo of the unified candidate, public onboarding, paid subscriptions, BI customer deployment, confidential data, SLA or zero-error claims. Limited concept/discovery conversations are allowed only with clear prototype status and no commercial commitment.

The goal is a credible first conversation: explain the product direction, state what is actually verified, ask for feedback, and make no promises that the current release cannot support.

---

**Technical source of truth:** [PITCH_READINESS.md](PITCH_READINESS.md), [NOVA_BUSINESS_INTELLIGENCE_ARCHITECTURE.md](NOVA_BUSINESS_INTELLIGENCE_ARCHITECTURE.md), [NOVA_BUSINESS_INTELLIGENCE_SECURITY.md](NOVA_BUSINESS_INTELLIGENCE_SECURITY.md), and [Draft PR #73](https://github.com/s85960833-byte/NovaAI/pull/73).

## Latest verification addendum — 7 November 2026

- Current unified candidate head: `b51f0ff8c5234004455284aafcdc58b21a276823` in Draft PR #73.
- Exact-head GitHub Actions runs [#1222](https://github.com/s85960833-byte/NovaAI/actions/runs/42346535889) and [#1223](https://github.com/s85960833-byte/NovaAI/actions/runs/42346539792) both completed successfully. All candidate CI verification steps passed; the live Render/provider and free image-generation steps were skipped because no isolated preview was authorized.
- The changes after the last application-code-verified snapshot `cbe3c4d165921cee77d2faa347ec7d4b2fbc862d` are documentation-only. The current candidate remains unmerged and undeployed; physical Android, real signup/email and two-account tenant-isolation checks remain open.
- This addendum supersedes earlier candidate-head and CI references in this file. Always consult Draft PR #73 for any newer head/checks.




## Latest candidate verification — 7 November 2026

- Current Draft PR #73 head: `3014e4bcd4600c09320045e8caacdab7c53ba53d`; PR push workflow [#42379943971](https://github.com/s85960833-byte/NovaAI/actions/runs/42379943971) completed successfully. A duplicate push run #42379938717 remains pending without a job and is not counted as a pass.
- The successful run passed syntax/security, PostgreSQL migration and tenant-RLS integration, Deno Edge Function type-check/CORS tests, BI calculations/CSV, dependency audit, local runtime/PWA, Chromium workspace/PDF, Company Cloud mobile-browser workflows and five-viewport responsive/drawer tests.
- Live deployed Edge Function, Render/provider/image checks were skipped because this candidate is not deployed. No physical Android device, real SMTP/Auth email, or two-real-account live tenant test has been completed.
- PR #73 remains Draft, open, unmerged and undeployed. Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No live service, database, Auth setting, billing plan or deployment was changed.


## Authoritative release-status checkpoint — 7 November 2026 (latest)

- Unified candidate branch: `feature/nova-integrated-release-20261106`; Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73) is open, Draft, unmerged and undeployed.
- Exact candidate head: `6c53223686943b068ac36c48fd5ae72c58edc226`.
- Both exact-head CI runs [#42381308464](https://github.com/s85960833-byte/NovaAI/actions/runs/42381308464) and [#42381303719](https://github.com/s85960833-byte/NovaAI/actions/runs/42381303719) completed successfully on that SHA. Automated candidate checks passed, including PostgreSQL migration/RLS integration, Edge Function type-check and CORS/invitation tests, dependency audit, runtime/PWA, browser workflows and five-viewport mobile regression. Live-production checks were skipped because this candidate is not on `main`.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No merge, Render deployment, live database migration, Auth configuration change or paid infrastructure change was performed.
- Live Supabase read-only audit: project healthy; Security Advisor returned zero findings; 13 INFO-only unused-index notices remain. Deployed `nova-bi-api` v13 still uses wildcard CORS. The exact-origin CORS correction exists only in the candidate and is not live.
- **Still open and not code-only tasks:** authorized production release decision; production Edge Function deployment and live CORS smoke; real signup, SMTP/invite and password-reset delivery; two separate real-account tenant-isolation test; physical Android touch/accessibility test; Render health-check configuration and production hosting decision; off-site backup and successful restore drill; CSP refactor/hardening; privacy, retention, deletion and incident-response review; and branch-protection verification (GitHub API previously returned 403, so status is unknown).
- **Sales boundary:** this is not paid-sales or customer-onboarding ready. At most, conduct clearly disclosed, non-sensitive concept-feedback conversations; do not accept payment, promise a live demo/SLA/availability, or collect confidential company/student data. NOVA BI remains unreleased. Any commercial, billing or infrastructure decision must be handled by the authorized adult project owner.

This checkpoint supersedes older candidate-head, CI-run and release-status statements elsewhere in this document. Historical checkpoints are retained as history, not current status.
