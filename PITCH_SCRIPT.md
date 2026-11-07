# NOVA — Early Demo Pitch Script (Internal Draft)

> **LIMITED CONCEPT DISCOVERY ONLY. Use this script only to explain the product direction and ask for feedback. Do not offer a paid product, promise a live demo, or imply production availability.**

**Copy-ready pitch pack:** see [NOVA_PITCH_KIT.md](NOVA_PITCH_KIT.md). **Technical release truth:** see [PITCH_READINESS.md](PITCH_READINESS.md).

**Use only for carefully qualified concept/discovery conversations while production-readiness gates remain open.**

## 30-second Hindi pitch

NOVA एक Hindi-English AI workspace है, जिसका लक्ष्य पढ़ाई, digital creation और रोज़मर्रा की AI सहायता को एक ही mobile-first अनुभव में व्यवस्थित करना है। इसमें तीन स्पष्ट हिस्से हैं — NOVA Learn, NOVA Build और NOVA Agents। हम इसे भारत के users के लिए सरल, bilingual और mobile-friendly बनाने पर काम कर रहे हैं। अभी हम शुरुआती feedback conversations करना चाहते हैं, ताकि public launch से पहले वास्तविक जरूरतों और कमियों को ठीक कर सकें।

## 30-second English pitch

NOVA is a Hindi-English AI workspace designed to bring learning, digital creation, and everyday AI assistance into one mobile-first experience. Its product direction is organized into three clear areas: NOVA Learn, NOVA Build, and NOVA Agents. We are preparing an India-focused experience that is easier to navigate in both languages. We are currently looking for early feedback conversations to understand user needs before any public launch.

## Five-minute demo flow

1. **Home (45 sec):** Show the three workspace cards and explain the separation of tasks.
2. **Language (30 sec):** Switch language and show bilingual labels. Do not claim every provider response is translated unless verified.
3. **Learn (60 sec):** Demonstrate only a working learning action in the currently deployed build or a clearly labelled preview. Do not use private student data.
4. **Build (60 sec):** Demonstrate only a working creation action. Explain that generation depends on provider availability and limits.
5. **Agents (60 sec):** Demonstrate a simple assistant task. Clearly identify which tools are live and which are preview-only.
6. **Feedback (45 sec):** Ask what workflow is valuable, what is confusing, and what would need to be reliable before adoption.

## Questions to ask a potential design partner

- Which of Learn, Build, or Agents would you use most often?
- What task do you currently find slow or difficult?
- Would Hindi-English labels make the workflow easier to use?
- What would you need to verify before using this with real work?
- What would make you return to the product next week?

## Safe answers to common questions

**Is NOVA publicly launched?**  
The unified NOVA experience, including Business Intelligence, is still a release candidate. We are gathering feedback before calling it a public production release.

**Can you guarantee every AI answer or generation will work?**  
No. AI providers can be unavailable, slow, or rate-limited. We are testing fallbacks and reliability before making service guarantees.

**Is chat history synced to an account in the cloud?**  
The current app's existing chat/settings storage is browser-local. Do not describe it as cloud-synced unless a verified account-sync feature is released.

**Can we upload confidential company or student information?**  
Not for this early demo. Use synthetic or non-sensitive sample data only.

**What does it cost?**  
Do not quote a price or promise a plan until provider costs, usage limits, billing, support, privacy terms, and refund terms have been confirmed.

**Is NOVA Business Intelligence included?**  
NOVA Business Intelligence is part of the unified Draft preview candidate, but it is not deployed or generally available. Do not use it with real company data.

## Do not claim

- “100% error-free”, “guaranteed uptime”, or “every feature is live”.
- Paying customers, customer traction, revenue, or validated market demand unless independently evidenced.
- Cloud-synced chat history or enterprise-grade compliance.
- Unlimited or always-free AI usage.
- A released Business Intelligence module.
- Physical Android certification before a real-device test.

## Demo readiness checklist

- [ ] Open the exact build you intend to show and confirm the URL/branch.
- [ ] Verify the three workspaces on the actual presentation device.
- [ ] Test the exact Learn, Build, and Agents actions you plan to demonstrate.
- [ ] Check microphone permission and network connectivity before showing voice.
- [ ] Use non-sensitive sample prompts and files.
- [ ] Keep a short screen recording or static screenshots as a backup.
- [ ] Explain clearly if any screen is a preview rather than the live Production app.




**Current boundary:** PR #73 head `3014e4bcd4600c09320045e8caacdab7c53ba53d` passed candidate push CI #42379943971 but remains Draft, unmerged and undeployed. Only concept discovery is allowed. Do not demonstrate the integrated candidate as live, accept payment, collect confidential data or promise production service until the release gates in `PITCH_READINESS.md` are closed.


## Authoritative release-status checkpoint — 7 November 2026 (latest)

- Unified candidate branch: `feature/nova-integrated-release-20261106`; Draft PR [#73](https://github.com/s85960833-byte/NovaAI/pull/73) is open, Draft, unmerged and undeployed.
- Exact candidate head: `6c53223686943b068ac36c48fd5ae72c58edc226`.
- Both exact-head CI runs [#42381308464](https://github.com/s85960833-byte/NovaAI/actions/runs/42381308464) and [#42381303719](https://github.com/s85960833-byte/NovaAI/actions/runs/42381303719) completed successfully on that SHA. Automated candidate checks passed, including PostgreSQL migration/RLS integration, Edge Function type-check and CORS/invitation tests, dependency audit, runtime/PWA, browser workflows and five-viewport mobile regression. Live-production checks were skipped because this candidate is not on `main`.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`. No merge, Render deployment, live database migration, Auth configuration change or paid infrastructure change was performed.
- Live Supabase read-only audit: project healthy; Security Advisor returned zero findings; 13 INFO-only unused-index notices remain. Deployed `nova-bi-api` v13 still uses wildcard CORS. The exact-origin CORS correction exists only in the candidate and is not live.
- **Still open and not code-only tasks:** authorized production release decision; production Edge Function deployment and live CORS smoke; real signup, SMTP/invite and password-reset delivery; two separate real-account tenant-isolation test; physical Android touch/accessibility test; Render health-check configuration and production hosting decision; off-site backup and successful restore drill; CSP refactor/hardening; privacy, retention, deletion and incident-response review; and branch-protection verification (GitHub API previously returned 403, so status is unknown).
- **Sales boundary:** this is not paid-sales or customer-onboarding ready. At most, conduct clearly disclosed, non-sensitive concept-feedback conversations; do not accept payment, promise a live demo/SLA/availability, or collect confidential company/student data. NOVA BI remains unreleased. Any commercial, billing or infrastructure decision must be handled by the authorized adult project owner.

This checkpoint supersedes older candidate-head, CI-run and release-status statements elsewhere in this document. Historical checkpoints are retained as history, not current status.
