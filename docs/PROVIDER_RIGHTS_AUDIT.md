# NOVA Provider Rights Audit — PR #98

Reviewed against the PR #98 runtime source and official provider terms checked on 13 November 2026. This is an engineering screening record, not legal advice or a licence grant. Public/keyless access alone does not establish commercial reuse rights. Decisions below are limited to the precise data fields and display/retention behavior described.

## Sources explicitly requested or found in the server

| Source | Commercial-use finding | NOVA runtime decision |
|---|---|---|
| DuckDuckGo HTML scraping | No documented licensed API integration for scraping the HTML results page was established | **REMOVE** — scraper is absent |
| Yahoo Finance unofficial chart/feed | No commercial API/data rights were established for the unofficial chart endpoint | **REMOVE** — endpoint is absent |
| `proxy.cors.dev` relay | A public CORS relay is not a data licence and adds an unnecessary intermediary | **REMOVE** — relay is absent |
| ESPN unofficial scoreboard feed | No commercial permission was established for NOVA's third-party scoreboard use | **REMOVE** — route fails closed |
| wttr.in | NOVA did not establish a commercial licence for this deployment | **DISABLED** — no end-user weather call |
| Open-Meteo free API/geocoding | Official terms expressly limit the Free API to non-commercial use; paid customer API plans provide a commercial-use licence | **DISABLED** — no paid plan was purchased or enabled |
| Curated publisher RSS feeds | Rights vary by publisher; the BBC's official syndication channel is for authorised users with a relationship/contract | **DISABLED** — feed registry remains empty until publisher-specific permission is documented |
| Google News RSS | NOVA has not established a commercial syndication/API licence for the RSS integration | **DISABLED** — no Google News fallback call |
| GDELT DOC API | GDELT states its released datasets may be used and redistributed for academic, commercial or government use, provided use/redistribution cites and links the GDELT Project | **KEPT** — title/URL/date metadata only, no article full text; GDELT attribution link now passes through to the source UI; no persistent/shared result cache. Original publisher rights in the linked articles remain separate |
| USGS earthquake feed | USGS-authored data are public domain; USGS asks users to acknowledge/credit the agency | **KEPT** — source card now carries USGS credit and its official credit/copyright references |
| OpenAlex API | OpenAlex states that its data are reusable under CC0 | **KEPT** — metadata only, with CC0-1.0 licence field and link; paper copies still use their own licences |
| arXiv API | arXiv applies CC0 1.0 to metadata; article/PDF content remains subject to the authors' selected licence and/or publisher rights | **KEPT** — metadata only, with CC0-1.0 licence field and link; no paper full-text redistribution |
| Wikipedia/Wikimedia APIs | Most Wikipedia projects use CC BY-SA 4.0, but exceptions exist and each page/item's applicable licence must be checked. Attribution, licence-link, change notice and ShareAlike obligations must be met where applicable | **DISABLED** — the previous UI dropped licence/attribution fields and NOVA had not verified page-specific licences or ShareAlike treatment. Search, summary, current-event and extract endpoints now fail closed; no Wikipedia network endpoints remain |
| CoinGecko Demo API/keyless endpoint | Official CoinGecko guidance says the Demo/free plan does not include commercial rights; paid self-serve plans include standard commercial display rights subject to attribution, while redistribution/resale may need custom terms | **DISABLED** — no commercial plan was purchased or enabled |
| Coinbase public Market Data API | Official terms limit use to the user's/entity's personal or research purposes and prohibit building an end-user application without separate permission | **REMOVE** — endpoint is absent |
| World Bank datasets/indicators | The World Bank Dataset Terms generally provide datasets under CC BY 4.0 unless specifically labelled otherwise, but some indicators/data are third-party and may have different reuse/redistribution terms. It is inaccurate to classify all World Bank data as non-commercial | **DISABLED** — NOVA's generic indicator code did not inspect the exact dataset/indicator licence and required acknowledgement metadata before use. Enable only after dataset-by-dataset rights checks and source attribution are implemented |
| NASA EONET | EONET v3 documentation says all metadata is subject to its disclaimer; records can link to third-party sources with their own rights | **DISABLED** — metadata and linked-source rights are not cleared for NOVA's intended use |
| Hacker News Firebase API | Public API access does not by itself establish a blanket commercial republication licence for user-submitted stories | **DISABLED** — no story ingestion until rights/permission are established |
| Frankfurter / underlying central-bank rates | Frankfurter says it does not own the rates; provider-specific terms govern, and some rates are Frankfurter's own blended calculation rather than an official provider rate | **DISABLED** — no pair-specific upstream licence/attribution registry exists yet, so the Frankfurter endpoint and live conversion route were removed |
| Anonymous Pollinations image endpoint | Anonymous image URL was not an approved commercial integration | **REMOVE** — anonymous endpoint absent; keyed API path requires an explicit spend flag and is default-off |

## Keyed providers and account eligibility

- Tavily's official guidance (updated 2 November 2026) permits use in customer-facing/commercial applications, including on the free Researcher plan, and allows storing its results. The free Researcher plan has 1,000 credits/month and does not charge unless pay-as-you-go is enabled. Its provider rules also say individuals must be 18 or over; the NOVA operator must satisfy that eligibility. Do not create an individual account or enable a paid/pay-as-you-go option on the minor user's behalf. Any eligible operator must keep the key server-side.
- Tavily shared caching across multiple customers requires contacting Tavily first. NOVA's shared result cache stays disabled unless `TAVILY_SHARED_CACHE_ALLOWED=1`; do not set the flag without provider confirmation for the exact plan and use.
- Groq/OpenRouter and other model APIs remain governed by provider- and model-specific terms. Review the actual deployed model and account plan before enabling commercial traffic.
- No paid provider plan, new account, payment, or paid API was enabled by this audit.

## Data retention and display decisions

- GDELT records are transient for NOVA; no shared/persistent result cache is used. The response carries a visible GDELT Project attribution link.
- Publisher RSS, Google News RSS, Wikipedia-derived data, Frankfurter rates and other uncleared sources are disabled.
- Tavily result caching remains off by default. Source publisher rights still apply even when Tavily permits result storage.
- USGS data, OpenAlex metadata and arXiv metadata have the public-domain/CC0 basis described above; keep the source credit/licence metadata visible.
- A TTL cache is still storage. Never persist records where provider terms do not permit storage.
- The Pollinations hosted image API remains off unless `NOVA_ALLOW_POLLINATIONS_SPEND=1` and a server-side key is present. Default setting in `.env.example` is `0`.

## Official references checked

- GDELT terms: https://www.gdeltproject.org/about.html — unrestricted commercial use/redistribution of GDELT datasets with citation and link.
- USGS copyright and credit: https://www.usgs.gov/faqs/are-usgs-reportspublications-copyrighted and https://www.usgs.gov/information-policies-and-instructions/acknowledging-or-crediting-usgs.
- OpenAlex data licence: https://openalex.org/transparency.
- arXiv metadata/paper licensing: https://info.arxiv.org/help/license/index.html.
- Wikimedia content reuse: https://www.mediawiki.org/wiki/Wikimedia_APIs/Content_reuse and CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/.
- CoinGecko Demo vs Commercial rights (updated 19 October 2026): https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses.
- Coinbase Market Data Terms (updated 7 August 2026): https://www.coinbase.com/legal/market_data.
- World Bank Dataset Terms: https://www.worldbank.org/ext/en/legal/terms-conditions/datasets.
- NASA EONET v3 disclaimer: https://eonet.gsfc.nasa.gov/docs/v3.
- Frankfurter licence/underlying provider terms: https://frankfurter.dev/license/.
- Tavily permitted use and eligibility (updated 2 November 2026): https://help.tavily.com/articles/5880393096-permitted-use-customer-applications.
- Tavily storage/caching (updated 2 November 2026): https://help.tavily.com/articles/1612400809-storing-caching-retaining-output.
- Tavily credits/pay-as-you-go: https://help.tavily.com/articles/8298987937-billing-credits-usage-limits.
- Open-Meteo free vs commercial API terms: https://open-meteo.com/en/terms and https://open-meteo.com/en/pricing.
- BBC authorised syndication: https://information-syndication.api.bbc.com/.
- Pollinations API authentication: https://gen.pollinations.ai/docs.

## Release gate

Do not restore any disabled/removed source in customer-facing commercial routes until current written terms or a signed licence cover the exact use: app display, summarisation, caching/retention, attribution, redistribution, linked publisher content and end-user access. This audit does not provide a legal opinion or certify Indian-law compliance. Production remains NO-GO until all separate deployment, authentication, quota/cost-control, terms/privacy and operational release gates pass.
