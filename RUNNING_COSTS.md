# NOVA AI — Running Cost and Provider Inventory

**As of:** 12 November 2026. This is a configuration/evidence inventory, not an invoice or proof of zero operating costs.

## Observed infrastructure

| Service | Verified configuration | Unknown |
|---|---|---|
| Render Production | Free, Singapore, one instance | Billing history, historical costs, usage and uptime |
| Render Staging | Free, Singapore, one instance | Billing history and exact resource usage |
| Supabase | Project ACTIVE_HEALTHY, PostgreSQL 17, eu-west-1 | Plan/invoices, storage/egress, backup retention and monthly cost |
| GitHub | Public repo with Actions workflows | Account billing and non-reviewed usage |
| AI/search/data providers | Variable names documented in `.env.example`; no secrets in repo | Key validity/owner, current prices, quotas, consumption and commercial terms |
| Domain/email/analytics/payments | No production service verified | Ownership, plan, invoices and contracts |

## Latest Staging provider evidence (old commit only)

Staging still served old commit `195739a04895de364a5af22aa61f930d5d782cbb`, not PR #98. Its internal self-test log reported health/static/PWA and selected retrieval routes passing, but `/api/config` returned 503 and AI chat returned 503 because none of `LLM_KEY`, `GROQ_API_KEY` or `OPENROUTER_API_KEY` was configured. GDELT, Open-Meteo and CoinGecko experienced timeout/rate-limit behavior and fallbacks. This is not a test of current candidate.

## Provider commercial boundaries to resolve

- Open-Meteo free API is non-commercial; a subscription licence is limited/non-transferable and a buyer needs its own account. Sources: https://open-meteo.com/en/terms and https://open-meteo.com/en/pricing.
- TheSportsDB free API is for development; resale requires permission and API subscription does not grant third-party artwork rights. Source: https://api.thesportsdb.com/docs_terms_of_use.php.
- Yahoo Finance endpoint used by legacy deployment is undocumented in this review; commercial permission is unknown.
- AI provider credentials/contracts generally cannot be presumed transferable; buyer must obtain its own eligible account and keys.

## Cost treatment

- No paid service, plan upgrade or paid API purchase was started by this work.
- This does not prove the owner's accounts have no charges; billing dashboards were not accessible.
- **Total monthly cost is unknown, not ₹0.** Do not publish a unit-cost claim without usage and invoice evidence.
- Render Free has no always-on guarantee/SLA. No paid upgrade is approved.
- Supabase cost/backup retention must be checked by the account owner before customer use.

## Owner evidence needed

1. Export three months of Render, Supabase and provider bills/usage.
2. Record request units, quota, region, data retention, terms and commercial permission per vendor.
3. Measure provider spend per successful task.
4. Implement hard server-side user/provider budgets and emergency disable switches.
5. Keep billing/payment integrations off until appropriate adult operator and qualified legal/tax review approve them.
