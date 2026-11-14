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
- **Cloudflare Workers AI — integrated as an optional, default-off general-chat fallback only.** The code uses the documented OpenAI-compatible Chat Completions endpoint at `/ai/v1/chat/completions`; it is gated by `NOVA_ALLOW_CLOUDFLARE=1` plus a valid account ID, API token and explicit model. It is currently allowed only for ordinary chat, prompt-writing and voice-transcribed text; code, research, vision, documents and build/agent tasks are excluded until task-specific quality and licence review. The endpoint format is confirmed by the official docs: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- **Cloudflare quota and price (VERIFIED 14 Nov 2026):** Workers Free allocation is 10,000 Neurons per day, reset at 00:00 UTC. Workers Paid is priced at US$0.011 per 1,000 Neurons above the daily free allocation; some models require a paid billing method. This is not a predictable fixed number of chat messages, and the code does not currently enforce a hard dollar cap. Official pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- **Cloudflare data (VERIFIED 14 Nov 2026):** Cloudflare says standard inference Customer Content is processed only as needed and not retained after processing; operational metadata may be retained, and specific models have separate open-source/acceptable-use licences. Review the selected model licence and data handling before enabling: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- **Cloudflare operational status (UNKNOWN until an eligible operator configures it):** no Cloudflare account, API token, model call, quota use or commercial deployment has been created or tested in this repo session. The provider is OFF by default. No quality-parity claim is made.

No fourth provider is enabled simply to satisfy a numerical target. A provider must pass account-age, commercial end-user use, data processing, India availability, current quota, model capability and operational failover review first. Any account or contract requiring an adult must be handled by a legally eligible adult; no eligibility bypass is acceptable.

## Cloudflare activation gate

Before setting `NOVA_ALLOW_CLOUDFLARE=1`, a legally eligible adult operator must review the current Cloudflare subscription terms, data-processing obligations, selected model licence and applicable acceptable-use rules, then configure the account ID, token and a supported model privately in Render Staging. Keep the flag at `0` until an authenticated staging smoke test, quota monitoring and a real hard-spend policy are available. Do not rotate multiple accounts or bypass quotas.

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
