# NOVA 2.0 — Indicative Model Cost Comparison

**Snapshot date:** 2026-11-17 · **FX assumption:** US$1 = ₹93.66.  
These are Phase 0 estimates, not a bill or current quote. Token use, model prices, taxes, FX and provider policy can change. Excludes OCR, vision/image tokens, web search, storage, hosting, retries, taxes and payment fees.

## Workload assumptions

| Task | Input tokens | Output tokens |
|---|---:|---:|
| Paper Reader (text after OCR, up to five pages) | 12,000 | 2,000 |
| Scam check | 2,000 | 700 |
| RTI draft | 4,000 | 1,500 |
| Complaint letter | 3,000 | 1,200 |
| Sakha message | 1,500 | 700 |

## Model price assumptions (USD per million tokens)

| Provider/model label from Phase 0 snapshot | Input | Output | Privacy note recorded in Phase 0 |
|---|---:|---:|---|
| OpenAI GPT-6 Luna | $0.10 | $0.50 | API content not used for training by default; abuse monitoring generally up to 30 days |
| OpenAI GPT-6.1 Terra | $1.00 | $5.00 | Same OpenAI API data-control policy |
| Groq GPT-OSS 120B | $0.15 | $0.60 | Inference not retained by default; limited abuse/reliability retention; US data location |
| Gemini 3.5 Flash-Lite | $0.30 | $2.50 | Free tier may be used to improve products; paid tier not used for improvement |
| Anthropic Claude Haiku 5.5 | $0.10 | $0.50 | Default API deletion within 30 days, subject to exceptions |

## Estimated INR per task

| Task | GPT-6 Luna | GPT-6.1 Terra | Groq GPT-OSS 120B | Gemini 3.5 Flash-Lite | Claude Haiku 5.5 |
|---|---:|---:|---:|---:|---:|
| Paper Reader | ₹0.21 | ₹2.06 | ₹0.28 | ₹0.81 | ₹0.21 |
| Scam check | ₹0.05 | ₹0.52 | ₹0.07 | ₹0.22 | ₹0.05 |
| RTI draft | ₹0.11 | ₹1.08 | ₹0.14 | ₹0.46 | ₹0.11 |
| Complaint letter | ₹0.08 | ₹0.84 | ₹0.11 | ₹0.37 | ₹0.08 |
| Sakha message | ₹0.05 | ₹0.47 | ₹0.06 | ₹0.21 | ₹0.05 |

## Phase 0 model recommendations

- Paper Reader: GPT-6.1 Terra as quality candidate; prefer lower-cost model only if it passes the same rubric.
- Scam check: GPT-6 Luna plus deterministic safety rules and official contacts; no definitive fraud verdict.
- RTI: GPT-6.1 Terra quality candidate; fees/portals/timelines must be sourced from official material.
- Complaint letter: GPT-6 Luna with fixed templates and official filing links.
- Sakha: GPT-6 Luna candidate; escalate only when evals show a quality need.

A single web-search call was separately estimated at about ₹0.94 in the original snapshot, potentially more than the text-model call. Measure real p50/p95 costs with evaluation runs before setting prices.

## Product pricing placeholders — not active

1 credit = ₹1; non-withdrawable/non-transferable. Suggested design-only packs ₹49/₹99/₹199; starter gift 20 credits; Paper Reader 15; Scam check 5 plus 2 free/day; RTI 39; Complaint 39; Scheme finder 19; Sakha 10 free messages/day; optional Pass ₹99/month or ₹499/6 months. Price floor: ≥3× measured p95 cost; target ≥70% gross margin. No wallet funding or real payment is enabled.
