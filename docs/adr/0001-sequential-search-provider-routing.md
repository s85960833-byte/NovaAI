# ADR 0001: Sequential search-provider routing

- **Status:** Accepted
- **Date:** 13 November 2026
- **Scope:** NOVA live-search provider orchestration
- **Related files:** `nova-search-router.js`, `nova-server.txt`, `scripts/search-router.test.cjs`

## Context

The prior search path could start multiple configured search providers concurrently with `Promise.any`. When both paid-capable providers were configured, one user question could start more than one provider request even though only one result was ultimately used. NOVA has a small budget and does not yet have durable provider quotas or a hard rupee spend cap. That behavior made one request's maximum cost less predictable.

## Decision

Use a sequential first-usable-result router. Try configured providers in an explicit order; stop on the first usable response; record bounded failure information for fallbacks; return a no-result result if all providers fail. Do not automatically start another provider after a usable answer has already been received.

The current order is configuration-driven in `nova-server.txt` (Tavily first, then Brave LLM Context / Brave Web when configured). Shared Tavily result caching remains disabled unless the explicit permission flag is set.

## Options considered

1. **Parallel hedged requests:** lower tail latency but may start multiple billable provider calls for one query.
2. **Sequential fallback:** predictable request count and easier cost reasoning, at the cost of higher worst-case latency if earlier providers time out.
3. **Single provider only:** simplest but no provider failover.

## Consequences

- Positive: a successful early provider prevents downstream provider calls; provider request count is easier to reason about and test.
- Trade-off: worst-case latency is the sum of failed provider timeout periods; measure p50/p95 before changing the order or adding carefully budgeted hedging.
- Limit: this decision is not a global rupee spend ceiling, daily/monthly quota, durable usage ledger, provider circuit breaker, or guarantee that vendor terms permit commercial use.
- Verification: `scripts/search-router.test.cjs` and Main CI. No paid provider key is configured in Staging, so no paid live bake-off or cost measurement is claimed.
