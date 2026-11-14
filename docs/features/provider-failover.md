# Feature Brief — AI Provider Failover

**Date:** 14 November 2026 (Asia/Kolkata)  
**Status:** BUILT; not VERIFIED/LIVE  
**Primary files:** `nova-llm-router.js`, `nova-server.txt`, `scripts/llm-router.test.cjs`

## Goal and user story

When one configured AI provider is unavailable, Nova should attempt a separately operated provider without asking the user to repeat the question. It must never rotate multiple keys/accounts at one company to evade limits.

## Research and source notes

- **VERIFIED — 14 Nov 2026:** OpenRouter's Terms of Service, last updated 31 Aug 2026, state that an account user must be at least 18. This provider account must not be created or operated by the minor user. Source: https://openrouter.ai/terms
- **VERIFIED — 14 Nov 2026:** Cloudflare Workers AI publishes a 10,000 Neurons/day free allocation; Workers Paid pricing is $0.011 per 1,000 Neurons above the daily allocation, with model-specific billing exceptions. Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
- **VERIFIED — 14 Nov 2026:** Cloudflare documents its Customer Content processing commitments and notes that third-party services called through AI Gateway can have their own retention policies. Source: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- **VERIFIED — 13–14 Nov 2026:** Provider-specific terms, licences and account conditions are tracked in `docs/PROVIDER_RIGHTS_AUDIT.md`. Every selected model still requires its own current rights, age, India availability and data-processing review.
- **UNKNOWN:** no production provider account, key, live response, monthly usage profile or per-answer cost is configured or measured in Staging.

## Chosen approach

- One ordered server-side chain assembled from env configuration.
- De-duplicate by provider hostname; do not rotate same-company keys.
- Use bounded per-attempt timeout and caller cancellation.
- Open a process-local circuit on 429, auth failures and repeated failures.
- Keep optional Cloudflare disabled by default and restricted to eligible task types.
- Use mocked failure tests rather than making paid/live provider calls during CI.

## Rejected alternatives

- Parallel fan-out to all providers: rejected because it can multiply provider spend for one user request.
- Multiple accounts/keys at one vendor: rejected as quota circumvention and contractual risk.
- Claiming quality parity from provider marketing pages: rejected; only evaluation evidence can assign tiers.

## Cost and risks

- Cost per successful answer: **UNKNOWN** until a specific model, account plan, token usage and fallback frequency are measured.
- Cloudflare's published neuron pricing is not a fixed price per message; the current code has no hard daily monetary spend cap.
- Circuit state is process-local and resets on restart.
- Mid-stream failover after response bytes are delivered is not seamless.
- Four-company, task-specific, same-tier quality parity is not established.

## Acceptance criteria and tests

- Provider secrets remain server-side.
- Distinct provider hosts are used; same-host key rotation is rejected.
- Network error, timeout, 429/Retry-After, auth failure, caller cancellation, open circuit and recovery have regression tests.
- Exact-head Main CI step 12 passed in run #43565665119.
- Live inference, model quality, quota prediction and monetary spend cap remain unverified.

## Rollback

Disable the optional provider's env flag/remove its provider config. Preserve the primary route and existing UI; do not change the Production branch as part of this PR.

## Definition of Done

**Not met.** No live provider call, approved four-company chain, parity benchmark, durable circuit/usage tracking or hard spend cap.
