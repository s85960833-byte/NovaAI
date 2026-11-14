# NOVA AI — Engineering Decisions

**Updated:** 14 November 2026  
**Scope:** PR #98 implementation decisions. This file records engineering choices; it is not a legal opinion or provider licence.

## Provider routing

1. Use one provider account/key per provider company. Never create or rotate multiple accounts at one company to evade quotas or rate limits.
2. Provider credentials stay in server-side Render environment variables. They must not be committed or pasted into chat.
3. Chat provider order is configured by the existing environment variables: primary OpenAI-compatible endpoint, Groq, then OpenRouter. Providers are de-duplicated by hostname.
4. Each network attempt gets its own timeout signal. Client cancellation stops the chain. Network failures and provider rate limits can fall through to another configured provider.
5. Provider circuit state is process-local in this stage. It is not a durable quota ledger or monetary spend cap.

## Provider terms and eligibility — review dated 14 November 2026

- **Google Gemini API — excluded for Nova's planned audience.** The current Gemini API Additional Terms require the API operator to be 18+ and prohibit using the API in API Clients directed to or likely to be accessed by under-18 individuals. Nova's intended student audience makes this unsuitable. Official terms: https://ai.google.dev/gemini-api/terms
- **OpenRouter — adult operator only.** Its Terms of Service require the user to be at least 18. Official terms: https://openrouter.ai/terms
- **Mistral Free API mode — not production capacity.** Mistral's help centre describes Free mode as limited and intended for evaluation/prototyping; paid usage tiers require pay-as-you-go billing. Official guidance: https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them
- **Cloudflare Workers AI — candidate, not integrated.** Its current pricing page lists 10,000 Neurons/day on Workers Free and charges above that only on Workers Paid. This is a finite quota, not a permanent free production guarantee. Official pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

No fourth provider is enabled simply to satisfy a numerical target. A provider must pass account-age, commercial end-user use, data processing, India availability, current quota, model capability and operational failover review first. Any account or contract requiring an adult must be handled by a legally eligible adult; no eligibility bypass is acceptable.

## Explicitly not claimed as complete

- Four-company independent free-tier failover.
- Equivalent answer quality across providers.
- Remaining-quota prediction or automatic 80% switching.
- Durable global/user token ledger or hard daily monetary spend cap.
- Quality validator, golden prompt benchmark suite, or automatic model re-ranking.
- Seamless failover after a streamed answer has already started reaching the browser.
- Real authenticated provider-backed staging chat or live search.
- Production readiness, legal compliance certification, or paid plans.

## Release rule

Keep PR #98 Open / Draft / unmerged and Production unchanged until exact-head CI, Staging deploy, authenticated runtime tests, provider-rights approval, data-deletion/security work, cost controls and owner gates are all evidenced.
