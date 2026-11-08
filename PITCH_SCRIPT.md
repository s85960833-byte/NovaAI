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




**Current boundary (7 Nov 2026):** PR #73 is Draft, unmerged and undeployed. The latest application-code snapshot `1f24545b9a42ee1883c4293b2b74b9f6ecc8f4cf` passed exact-head CI #42382919198 and #42382923272; subsequent audit commits are documentation-only. Use PR #73 for the current branch head and exact CI status. The full PR history and 63-file diff require owner review before any merge. Production `main` is untouched. Only disclosed non-sensitive concept feedback is appropriate; no payment, confidential data, production service/SLA or live-product promise. See `PITCH_READINESS.md` for all release gates.


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

- Latest application-code verification snapshot: `1f24545b9a42ee1883c4293b2b74b9f6ecc8f4cf`; exact-head push/PR CI #42382919198 and #42382923272 passed. Subsequent changes in this release audit are documentation-only; use Draft PR #73 for the current branch head and its exact CI status.
- Production `main` remains `48e12a68af656b471853ac2a4509da0e3df7ab24`; no merge, Render deploy, live database migration or Auth/SMTP change was made.
- Live Supabase project `qrfwsewppafhxibdboam` is healthy (PostgreSQL 17.11, eu-west-1). All 10 NOVA BI tables have RLS enabled. Security Advisor: 0 findings; Health Advisor: 0; Performance Advisor: 13 INFO-only unused-index notices.
- Live migration history has 12 migrations. Candidate migration `20261106195900_nova_bi_rate_limit_search_path_hardening.sql` is not applied live. The live rate-limit SECURITY DEFINER function still has `search_path=public, pg_temp`; execute ACL is restricted to `postgres` and `service_role`. Candidate migration pins an empty search_path and passes the isolated PostgreSQL regression, but this live hardening is still pending.
- Live `nova-bi-api` v13 still uses wildcard CORS. Candidate exact-origin CORS code is not deployed.
- Candidate HTTP CSP now includes resource directives and frame isolation; runtime CI verifies them. Inline styles are still allowed and HTTPS `connect-src` remains broad, so CSP is not fully strict.
- General NOVA chat/settings/history remain browser-local; general consumer cloud accounts/history sync have not been verified. No subscription billing/entitlement flow was found in the audited candidate. Do not promise cloud sync or sell subscriptions.
- Remaining gates: authorized release decision; apply pending DB hardening migration; deploy and verify exact-origin Edge Function; real signup/confirmation/reset/invitation delivery with custom SMTP and exact redirect allow-list; two-real-account tenant isolation and membership lifecycle tests; physical Android test; Render health/production hosting decision; off-site backup and restore drill; privacy/retention/deletion and incident-response review; branch protection (GitHub reports `main.protected: false` and no repository rulesets; an authorized administrator must enable it); and complete CSP style/connect-src hardening.
- **Decision: NO-GO for paid sales, paid onboarding or production promises.** Only disclosed, non-sensitive concept feedback; no payments, confidential customer data, SLA or live-availability claims. Commercial, billing and infrastructure decisions require the authorized adult project owner.

This checkpoint supersedes older candidate-head, migration-count, CSP and release-status statements above. Older entries are historical audit notes only.


**Latest release-status pointer (8 Nov 2026):** The authoritative re-audit is recorded in `PITCH_READINESS.md` §21. It reconfirms that clean PR #74 is unmerged/undeployed, candidate CI skips live Render/Edge Function/provider/image checks, the deployed Edge Function still has wildcard CORS, and paid sales remain NO-GO. Treat older dated checkpoints in this file as historical.


## Current release boundary — 8 November 2026

Use clean [Draft PR #74](https://github.com/s85960833-byte/NovaAI/pull/74) and its Checks tab for the current candidate head and exact-head CI. PR #74 remains Draft, unmerged and undeployed. Production `main` is unchanged. GitHub reports `main.protected: false` and no repository rulesets. No payment, confidential data, production/SLA or live-product promise until all release gates are evidenced and approved.


## Current verification update — 8 November 2026

Latest exact-head CI [#42454154190](https://github.com/s85960833-byte/NovaAI/actions/runs/42454154190) passed on the current candidate head with 34 successful steps, 0 failures and 4 live-only checks skipped. Use clean [Draft PR #74](https://github.com/s85960833-byte/NovaAI/pull/74) for future checks. Three forward migrations remain pending; live CORS, audit policy and rate-limit search_path have not been changed. Concept feedback only; no paid offer or production promise.
