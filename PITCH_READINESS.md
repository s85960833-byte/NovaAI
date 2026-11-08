## Current verified release status — 8 November 2026

- **Production URL:** https://novaai-4auo.onrender.com
- **Currently live app commit:** f6a3b643c5e8e8c4bb56bc84c2c9a886d0f016b8 — Render deployment dep-dbo3i7m417fc73f6bdbg, status LIVE.
- **Main app code:** PR #83 merged as c8ad3c646d68bde2836810995f2e91d87691cfe7. It adds NOVA email/password account UI and optional cloud sync. **Render has not yet deployed this commit**; its deployment list still shows the earlier live commit. Do not tell users the new account feature is live yet.
- **Main CI:** [run #42468478954](https://github.com/s85960833-byte/NovaAI/actions/runs/42468478954) passed 38/38 steps, including live website/provider smoke, CSP/HSTS, five-viewport Chromium/mobile regression, Company Cloud browser flows and live free image generation. The feature PR also passed [account/browser verification](https://github.com/s85960833-byte/NovaAI/actions/runs/42468340606) and [full feature CI](https://github.com/s85960833-byte/NovaAI/actions/runs/42468340703). Browser tests are not real email delivery or physical Android testing.
- **Supabase:** project qrfwsewppafhxibdboam is ACTIVE_HEALTHY, PostgreSQL 17.11, eu-west-1; 16 migrations are present; nova-bi-api is ACTIVE v14 with JWT verification. Security and Health Advisors report zero findings. The additive `nova_user_workspaces` table is deployed with RLS; anon SELECT is denied; authenticated CRUD is constrained by four `auth.uid()` ownership policies.
- **Account feature implementation:** email/password sign-up, sign-in, password recovery and confirmation resend UI are merged to main but pending Render deployment. Optional cloud sync is off by default; after opt-in it stores chat text, titles and memory, excludes image attachments, and provides a delete-cloud-backup control. The existing local chat store remains intact.
- **Not yet verified:** real Auth sign-up/confirmation/reset email delivery; Auth Site URL and redirect allow-list; custom SMTP; two real user accounts proving sync isolation; self-service account deletion; full data-retention/deletion process; payment checkout, server-side entitlements, refunds or tax invoices; customer support ownership; off-site backup/restore drill; physical Android verification; incident-response rehearsal; full model/search/voice accuracy and cost evaluation.
- **Render operating limits:** Free plan, Singapore region, one instance, no configured health-check path. Supabase is on its Free plan. Do not promise always-on service, automatic backup, restore guarantees or SLA.
- **Privacy/legal:** draft documents exist in `PRIVACY_NOTICE_DRAFT.md`, `TERMS_OF_USE_DRAFT.md` and `SUPPORT_AND_INCIDENT_RUNBOOK.md`. They contain owner/legal placeholders and are **not publishable final policies**.
- **NOVA BI boundary:** early feature preview only. CSV source rows are browser-local; workflow items are proposals, not executed external actions; project-risk scores are heuristic; exports are capped at the latest 100 records. Do not accept confidential company data.
- **Pitch status:** LIMITED CONCEPT DISCOVERY ONLY — non-paid discovery conversations and supervised preview demonstrations using synthetic/non-sensitive sample data only. NO-GO for paid sales, payment collection, paid onboarding, production customer-data processing, enterprise/security/compliance claims, SLA/availability promises or guaranteed AI performance.
- Earlier checkpoints below are historical and superseded by this block.

# NOVA — Sales and Production Readiness

## Current approved positioning

NOVA is an India-oriented Hindi-English AI workspace that organizes learning, digital creation and everyday AI assistance into NOVA Learn, NOVA Build and NOVA Agents. The core app is live; the new general account/cloud-sync code is merged but not yet deployed. This does not mean every provider, account, billing or business workflow is production-ready.

## What may be demonstrated now

- Home/workspace navigation and bilingual labels.
- Learn / Build / Agents placement and supported UI flows.
- Standard chat UI and browser-local saved history.
- Settings and image panel.
- Live free image generation, while making clear that community/free providers may be rate-limited or unavailable.
- BI interface only as a labelled preview, using synthetic data and explaining its current limitations.
- Do not demonstrate the merged account/cloud-sync UI as a live production feature until Render deploys it and live Auth flows are verified.

## Release gates before paid customer onboarding

1. **Accounts:** the general NOVA account UI is implemented in main; deploy it, configure Auth Site URL/redirect allow-list and verified email delivery/custom SMTP, then test real signup, sign-in, password recovery and confirmation. Implement and verify account deletion.
2. **Data:** the per-user cloud-sync table is deployed with RLS and opt-in UI code is merged. After app deployment, verify with at least two real accounts that neither can read or overwrite the other's data; document retention, export and deletion.
3. **Payments:** select a payment provider, configure merchant account/webhooks, server-side plan entitlements, usage metering, failed-payment handling, cancellation, refunds and tax/invoice workflow. No billing provider or merchant credentials are configured.
4. **Privacy/legal/support:** approve the draft privacy notice, terms, data-processing/retention policy, support contact and incident-response process before collecting customer data or money.
5. **Hosting/recovery:** owner-approved always-on hosting decision, /health health-check configuration, monitoring/alerts, region/latency review, off-site backups and a successful restore drill.
6. **Security:** enable GitHub main-branch protection/required checks; complete tenant-isolation and access-revocation tests; review CSP and dependency updates; perform an incident-response rehearsal.
7. **Real-device verification:** test on the actual target Android phone for touch, keyboard, drawer, portrait/full-width layout, accessibility, reduced motion, low-network behavior and saved-chat compatibility.
8. **AI operations:** measure real model answer quality, latency, provider failure rates, search citations, voice and image behavior using approved quotas; publish clear limits and cost-based pricing.
9. **NOVA BI:** finish secure tenant-backed data ingestion, retention/deletion and audit workflows; distinguish heuristic insights from verified facts; do not claim automated external execution until implemented and tested.

## Owner-controlled items that cannot be completed from repository code alone

Paid hosting or merchant accounts, provider/API quota approval, SMTP/domain configuration, privacy/legal approval, customer support ownership, Auth URL/redirect settings, backup destination/restore access and hands-on physical Android testing require the account owner or device. No paid plan, external account or cost-bearing setting was changed during this audit.

## Safe next stage

Continue only non-paid discovery and supervised previews with synthetic data. Do not collect confidential files, payments or production customer data until every release gate above has evidence and owner approval.
