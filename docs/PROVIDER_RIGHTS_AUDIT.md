# NOVA Provider Rights Audit — PR #98

Reviewed against the PR #98 branch source and official provider terms checked on 13 November 2026. This is an engineering rights screen, not legal advice. Public/keyless access alone is not a commercial licence. "Allowed" below applies only to the limited metadata/data use described, not unrestricted article, image, paper, API, or third-party content redistribution.

## Sources explicitly named in the request

| Source | Commercial-use classification | Runtime decision |
|---|---|---|
| DuckDuckGo HTML scraping | **REMOVE** — no documented licensed API integration for scraping its HTML results page | No scraper or endpoint remains |
| Yahoo Finance unofficial chart/feed | **REMOVE** — no commercial API/data rights established for the unofficial chart endpoint | No Yahoo chart endpoint remains |
| `proxy.cors.dev` relay | **REMOVE** — unapproved third-party relay is not a data licence and adds an unnecessary intermediary | No relay remains |
| ESPN unofficial scoreboard feed | **REMOVE** — ESPN/Disney terms restrict commercial use absent permission | Fail-closed; endpoint removed |
| wttr.in | **DEMO-ONLY** — no commercial licence verified for NOVA's intended use | Disabled in customer-facing routes |
| Open-Meteo free API/geocoding | **DEMO-ONLY** — free endpoint is non-commercial; commercial use requires a commercial licence | Disabled in customer-facing routes |
| Curated publisher RSS feeds | **DEMO-ONLY** — rights differ by publisher; BBC specifically requires permission for business use | Feed registry empty; fetching disabled until written publisher permissions |
| Google News RSS | **REMOVE** — Google News terms limit service content to personal/non-commercial use | Fail-closed; no fallback call |

## Other keyless sources found in `nova-server.txt`

| Source | Commercial-use classification | Runtime decision |
|---|---|---|
| GDELT DOC API | **ALLOWED FOR COMMERCIAL USE** for GDELT datasets; unrestricted academic/commercial/government use, including redistribution, provided NOVA cites and links the GDELT Project | Kept for article title/URL/date metadata only, no shared result cache, attribution included; original publishers' rights still apply |
| USGS earthquake feed | **ALLOWED FOR COMMERCIAL USE** for USGS-authored data (public domain); acknowledge USGS | Kept with USGS attribution |
| OpenAlex API | **ALLOWED FOR COMMERCIAL USE** for OpenAlex data; OpenAlex states all its dataset data is CC0 | Kept for metadata; CC0 marker included; paper copies still use their own licences |
| arXiv API | **ALLOWED FOR COMMERCIAL USE** for descriptive metadata only; arXiv applies CC0 1.0 to all metadata, but paper content uses author-selected licences | Kept for metadata/title/abstract/link only; no full-text redistribution |
| Wikipedia/Wikimedia APIs | **ALLOWED FOR COMMERCIAL USE WITH CONDITIONS** — most Wikipedia article text is CC BY-SA 4.0; check the page, provide title/author/source attribution, link the licence, indicate changes, and ShareAlike adaptations | Kept with page-level licence warning and CC BY-SA licence link |
| CoinGecko Demo API/keyless endpoint | **DEMO-ONLY** — official guidance says Demo/free plan includes no commercial rights; paid plans provide standard commercial display rights with attribution; redistribution/resale requires custom rights | Removed from commercial runtime |
| Coinbase public Market Data API | **REMOVE** — official terms limit use to personal/research purposes and prohibit end-user apps and third-party redistribution absent express written consent | Removed from runtime |
| World Bank generic indicator API | **DEMO-ONLY** — general API terms prohibit commercial API use for materials without a dataset-specific licence; current code does not verify the licence for each indicator | Disabled pending dataset-by-dataset verification |
| NASA EONET | **DEMO-ONLY** — EONET API documentation says all metadata is subject to a disclaimer and records link to external sources | Disabled pending metadata and linked-source rights review |
| Hacker News Firebase API | **DEMO-ONLY** — API exposes public user submissions but its documentation does not grant NOVA a blanket commercial republication licence | Disabled pending clear rights/permission |
| Frankfurter / underlying central-bank rates | **CONDITIONAL** — Frankfurter says provider terms govern each rate source and some rates are blended calculations | Kept only as an explicitly indicative live cross-rate; no persistent cache; source/provider attribution included |
| Anonymous Pollinations image endpoint | **REMOVE** — legacy anonymous image URL has no verified commercial permission or supported provider integration | Anonymous URL removed; keyed route disabled unless operator explicitly enables spend |

## Keyed provider rights (not keyless sources)

- Tavily's free Researcher plan can be used in commercial/customer-facing products, and its output may be stored/cached. Latest provider guidance says individuals must be 18 or over; shared cached results across multiple customers require contacting Tavily. The app operator must satisfy provider eligibility. Underlying publisher content rights remain the app operator's responsibility.
- Tavily shared caching remains off unless `TAVILY_SHARED_CACHE_ALLOWED=1`; do not set this flag unless provider support confirms shared multi-customer caching for the actual plan/use.
- Groq/OpenRouter model use is governed by provider and model-specific terms; review the selected model's licence and commercial-use policy separately.
- No paid provider plan, new account, payment, or paid API was enabled by this audit.

## Data retention/caching decisions

- GDELT records are transient; no shared/persistent result cache.
- Publisher RSS and other unlicensed feeds are disabled.
- Tavily result cache remains off by default. Current storage guidance permits result storage, but shared multi-customer caching requires contacting support; source publisher rights still apply.
- Wikimedia content cache does not remove CC BY-SA attribution/adaptation/ShareAlike obligations; check each page's licence.
- USGS data, OpenAlex metadata and arXiv metadata have the stated public-domain/CC0 basis; short operational TTL caching is retained.
- Frankfurter calls are no longer cached in NOVA; underlying provider terms remain controlling.
- Never persist source records where provider terms do not permit it. A TTL cache is still storage.

## References checked

- GDELT terms: https://www.gdeltproject.org/about.html — unrestricted academic, commercial and government use; redistribution permitted with citation/link.
- USGS copyright/credit guidance: https://www.usgs.gov/faqs/are-usgs-reportspublications-copyrighted and https://www.usgs.gov/information-policies-and-instructions/acknowledging-or-crediting-usgs.
- OpenAlex API/data licence: https://help.openalex.org/api/ and https://openalex.org/transparency.
- arXiv metadata/paper licensing: https://info.arxiv.org/help/license/index.html.
- Wikimedia content reuse: https://www.mediawiki.org/wiki/Wikimedia_APIs/Content_reuse and CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/.
- CoinGecko Demo vs Commercial rights (updated 19 Oct 2026): https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses.
- Coinbase Market Data Terms (updated 7 Aug 2026): https://www.coinbase.com/legal/market_data.
- World Bank terms/API use: https://www.worldbank.org/ext/en/legal/terms-conditions.
- NASA EONET v3 disclaimer: https://eonet.gsfc.nasa.gov/docs/v3.
- Hacker News API documentation: https://github.com/HackerNews/API.
- Frankfurter licence: https://frankfurter.dev/license/.
- Tavily commercial use, user eligibility, storage: https://help.tavily.com/articles/5880393096-permitted-use-customer-applications and https://help.tavily.com/articles/1612400809-storing-caching-retaining-output.
- Pollinations API docs: https://gen.pollinations.ai/docs and https://pollinations.ai/docs.

## Release gate

Do not restore any DEMO-ONLY/REMOVE source in customer-facing commercial routes until current written terms or a signed licence cover the exact use: app display, summarization, caching/retention, attribution, redistribution and end-user access. This audit does not grant rights, provide a legal opinion, or certify Indian-law compliance.
