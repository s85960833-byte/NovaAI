# Feature Brief — Sequential Search Provider Routing

**Date:** 14 November 2026 (Asia/Kolkata)  
**Status:** BUILT; live provider path not VERIFIED/LIVE  
**Primary files:** `nova-search-router.js`, `nova-server.txt`, `scripts/search-router.test.cjs`

## Goal and user story

Use the first configured search provider that returns usable results. If it fails or returns no usable result, try the next eligible provider without launching all providers concurrently.

## Research and source notes

- **VERIFIED — 13 Nov 2026:** `docs/PROVIDER_RIGHTS_AUDIT.md` records the provider-specific commercial use, storage, attribution and cache findings. GDELT is retained for metadata with visible attribution; publisher RSS, Google News RSS and other uncleared feeds are disabled.
- **VERIFIED — 13–14 Nov 2026:** Tavily shared-result caching remains off by default; Brave result storage/redistribution is restricted and no persistent shared cache is used for it.
- **UNKNOWN:** no search API key or authenticated live search result has been verified on Staging; no real per-query cost is measured.
- **VERIFIED — 14 Nov 2026:** Render's current deployment is live on the PR head; that does not establish a live search provider response.

## Chosen approach

- A small `firstSuccessful` helper tries providers serially.
- Each provider can define a usability predicate.
- Failures are recorded and the next provider is tried.
- Avoid storing results where the applicable licence does not permit storage.
- Return source metadata and attribution fields only where the selected source provides them.

## Rejected alternatives

- Parallel `Promise.any` fan-out: rejected because multiple providers may be charged for one query.
- Unlicensed HTML scraping/RSS aggregation: removed or disabled rather than treated as a free API.

## Cost per use

**UNKNOWN** until a permitted live provider plan, actual request mix and monthly credits are established. Serial routing reduces duplicate requests relative to fan-out but does not create a hard spend cap.

## Acceptance criteria and tests

- Provider order is deterministic.
- A usable result stops further calls.
- A failed/empty provider falls through to the next provider.
- Each failure is bounded and recorded without exposing secrets.
- Exact-head Main CI run #43565665119 passed sequential search routing (step 19).
- Live provider keys, query accuracy, source-date correctness, India-aware ranking and live outage drills remain unverified.

## Rollback

Restore the previous search routing entrypoint while retaining the existing API response contract. Do not restore unlicensed HTML scraping or enable unapproved result caching.

## Definition of Done

**Not met.** No authenticated live provider call, full source pipeline, pricing/usage cap, accuracy benchmark or full search failover drill.
