# NOVA 2.0 Risk Register

**Date:** 2026-11-17. Severity reflects impact if the risk occurs, not likelihood.

| ID | Severity | Evidence / risk | User or business impact | Mitigation / phase |
|---|---|---|---|---|
| R-01 | Critical | No proof of full Auth + DB + storage deletion | Personal data may remain after deletion request | Implement auditable deletion lifecycle; test synthetic users; P3/P6 |
| R-02 | Critical | Production main and Render live SHA differ | Tests/source may not represent live product | Keep production read-only; reconcile only in Phase 7; P6/P7 |
| R-03 | High | Main branch protection reported OFF | Accidental direct push risk | Owner dashboard steps only; do not change settings; P7 prep |
| R-04 | High | Three Supabase local/remote migration timestamp mismatches | Skip/duplicate/out-of-order migration | Reconcile schema and ledger on isolated DB; no prod changes; P1/P6 |
| R-05 | High | `nova-sync-merge.js` documents same-ID overwrite | Cross-device edits can be lost | Version/ETag concurrency, conflict copies, idempotency; P3 |
| R-06 | High | Full deletion not proven | User cannot erase account fully | Ownership-checked deletion job, storage cleanup, audit proof; P3/P6 |
| R-07 | High | Provider retention/region varies | Sensitive documents may be retained or cross borders | Data minimisation, approved provider list, per-task consent/disclosure; P3/P5 |
| R-08 | High | Render Free sleeps and is not production-grade | Cold starts and availability gaps | Free staging only; production hosting decision later; P1/P7 |
| R-09 | High | Supabase Free limits/no durable backup; pauses when inactive | Staging downtime/data loss | Synthetic seed/reset only; no real data; P1/P6 |
| R-10 | High | AI calls/search/OCR/retries can exceed budget | Unexpected spend | Spend checks, caps, kill switch, cost logs; P1/P4 |
| R-11 | High | BYOK keys can be exposed in browser | Key theft or accidental sharing | Server-side secrets, CSP, never export/log; P1/P3 |
| R-12 | High | Uploaded files/web pages may contain prompt injection | Data exfiltration or unsafe actions | Treat as untrusted data, tool allowlists, adversarial evals; P3/P5/P6 |
| R-13 | High | Scheme search is not a verified dataset | False eligibility or stale benefits | Deterministic reviewed records with official URL/date; P5 |
| R-14 | High | AI can invent deadlines, fees, legal sections or contacts | Harmful misinformation | Schema, source-only claims, uncertainty and disclaimer; P5/P6 |
| R-15 | High | Upload retention/deletion not proven | Documents may persist unexpectedly | Consent, temp storage, expiry job and audit; P5/P6 |
| R-16 | High | Android narrow layout reported; no physical test | App may be unusable on target phone | Responsive tests and physical device review; P2/P6 |
| R-17 | Medium | Intro marker migration defect; service worker can cache stale UI | Stuck entry or stale assets | Marker migration tests, cache versioning and update prompt; P2 |
| R-18 | High | Configurable provider URL / upload endpoints | SSRF or internal-network access | Host/IP allowlists, DNS checks, schemas, upload sniffing; P1/P3/P6 |
| R-19 | Medium | Prior timeout/429/403 observations | Search/AI/live data may fail | Bounded retries, circuit breaker, caching, safe fallback; P3 |
| R-20 | High | Cross-border provider processing | Privacy expectations mismatch | Provider region disclosure and data minimisation; P3/P5 |
| R-21 | High | No existing wallet/payment ledger | Incorrect balances if implemented unsafely | Append-only ledger, idempotent mock webhooks, reconciliation; P4 |
| R-22 | High | Supabase Free lacks automatic backups | Data restore may be impossible | Synthetic staging only; document restore design; P1/P6 |
| R-23 | Medium | Hindi voice browser compatibility not verified | Voice feature may fail on target browsers | Feature detection and text fallback; P3/P6 |
| R-24 | High | No proven global/per-user spend cap in legacy | Provider spend abuse | Enforce before every provider call; mock tests; P1/P4 |
| R-25 | Medium | 13 modes + BI can expand launch scope | Delayed delivery and regression | Sakha + Diwan only; legacy shelf; BI separate; P1/P2 |
| R-26 | Low | README is stale relative to audited baseline | Incorrect maintainer steps | Update docs with tested commands and exact SHA; P1 |

## Later owner/professional blockers

Real payment-provider account ownership, KYC, settlement, tax/invoice treatment, SMS sender registration and public handling of children's personal data are not implementation tasks for this build. Keep the gateway mocked, SMS disabled, and obtain responsible adult plus qualified professional review before any public real-money or sensitive-data operation.
