# NOVA AI — Verification Report

**Date:** 14 November 2026 (Asia/Kolkata)  
**Repository:** `s85960833-byte/NovaAI`  
**PR:** #98 — Open / Draft / unmerged  
**Branch:** `fix/nova-home-learn-first-mobile-20261109`  
**Code-bearing SHA tested:** `035f8beec51f9f3cdb9fd0b09c6c6dde91ee49c3`

## 1. Automated verification

| Check | Result | Evidence |
|---|---|---|
| Backend/frontend syntax | PASS | Main CI #43557378141, step 7 |
| Feature registry contract | PASS | Main CI, step 8 |
| Quick / Standard / Detailed answer modes | PASS | Main CI, step 9 |
| Provider default/deprecation checks | PASS | Main CI, step 10 |
| AI provider failover and circuit tests | PASS | Main CI, step 11 |
| Markdown link escaping / attribute injection | PASS | Main CI, step 12 |
| Mode registry, cloud-sync merge/conflict, IP rate window | PASS | Main CI, steps 13–15 |
| Sequential cost-aware search router tests | PASS | Main CI, step 16 |
| Supabase API Auth wiring and timezone validation | PASS | Main CI, steps 17–18 |
| Env/secrets, HTTPS provider URL, bounded response, source-rights tests | PASS | Main CI, steps 19–27 |
| PostgreSQL migration/RLS, Deno edge-function, NOVA BI deterministic tests | PASS | Main CI, steps 28–37 |
| Dependency vulnerability audit | PASS | Main CI, step 38 |
| Local server routes, graceful shutdown, container build and health smoke | PASS | Main CI, steps 39–42 |
| Responsive Chromium, Company Cloud, NOVA BI browser, mobile layout/drawer | PASS | Main CI, steps 43–48 |
| Staging smoke and negative token cases | PASS | Main CI, steps 49–50 |
| Browser workflow | PASS | Browser CI #43557378058, all browser job steps succeeded |
| Failover suite local run | PASS | Node.js 22.16.0: 9 tests, 9 passed, 0 failed |

Workflow links:
- Main: https://github.com/s85960833-byte/NovaAI/actions/runs/43557378141
- Browser: https://github.com/s85960833-byte/NovaAI/actions/runs/43557378058

The failover contract suite simulates primary-network failure/timeout, 429 + Retry-After, correctable response retry, caller cancellation, vendor hostname de-duplication, vision-model selection, HTTPS provider bases, circuit recovery, and oversized/unreadable error bodies. These are unit tests with mocked responses; they are not tests against paid/live provider accounts.

## 2. Staging / Production

- Staging service: `srv-dbqm035g1s2s73eogao0`.
- Configured branch: `fix/nova-home-learn-first-mobile-20261109`.
- Render reports Auto Deploy = `yes`, but current event history contains no new deploy after the 13 November deploy.
- Latest confirmed Staging Live deploy: `dep-dbrhab6i0phs73fs2ni0`, commit `286ddbc6c4a96e5f62c50ada1aa9c2a890633527`.
- The code-bearing SHA tested by GitHub CI is not yet confirmed Live on Render. Current Staging Health Check Path remains blank.
- Previous Staging smoke (before this code revision) returned `/health` 200 and `/api/config` 503 because no AI provider/model is configured. The current-head AI route has not been exercised by a real authenticated provider request.
- Production URL remains https://novaai-4auo.onrender.com and was not changed. No merge or Production deployment took place.

## 3. Known blockers and unverified behavior

1. No approved provider key/model configured in Staging; real AI chat, voice and vision provider routes not verified.
2. Live search citations, source-date correctness, India ranking and fallback under live outage not end-to-end tested.
3. Physical Android width/touch, real camera/gallery and microphone permissions/capture not tested; Chromium emulation is not a substitute.
4. Valid/expired Supabase user sessions, email delivery, redirect allow-list and hosted two-user isolation not fully verified.
5. Durable monetary spend cap, per-user token ledger, quota prediction and stream-mid-answer failover not implemented.
6. Four-company production-cleared provider chain and model-quality parity not demonstrated.
7. Plans, payments, refunds, webhook reconciliation, invoices and GST workflow not implemented.
8. Full Auth user deletion, retention/deletion proof, backup/restore, load/soak, monitoring/SLO and incident/rollback drills not complete.
9. Hindi Devanagari PDF export/DOCX/XLSX workflow, full Prompt Studio, sandboxed code workspace, Nova Build and durable Nova Agent are not complete.
10. Legal/privacy/vendor/IP/child-data compliance requires current qualified professional review; this report is not a certification.

## 4. Release decision

**NOT READY FOR PRODUCTION.** Automated CI and browser checks are green for the tested code-bearing SHA, but Render Staging has not been proven to run that SHA, no real AI provider is configured, and several core product capabilities remain missing or blocked. Keep PR #98 Draft/unmerged and Production unchanged.
