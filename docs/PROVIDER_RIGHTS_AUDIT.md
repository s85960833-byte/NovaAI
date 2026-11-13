# NOVA Provider Rights Audit — PR #98

Reviewed against the current PR branch source on 13 November 2026. This is a conservative engineering screen, not legal advice. A source is not commercially cleared merely because its endpoint is public, keyless, or technically reachable.

## Decisions

| Source in scope | Decision for commercial NOVA | Evidence / reason |
|---|---|---|
| DuckDuckGo HTML scraping | **REMOVE** | HTML scraping is not an approved/licensed API integration. The current PR branch already has no active DuckDuckGo HTML endpoint; keep it absent. |
| Yahoo Finance unofficial chart/feed endpoint | **REMOVE** | Unofficial endpoint and no commercial redistribution/API licence established. No Yahoo chart endpoint is present in the current PR branch. |
| `proxy.cors.dev` relay | **REMOVE** | Third-party CORS relay is not an approved data provider and adds an unnecessary intermediary. No relay call is present in the current PR branch. |
| ESPN unofficial scoreboard endpoint | **REMOVE** | ESPN terms restrict commercial use of site information without advance written permission. Current PR branch now disables the unofficial scoreboard route. |
| wttr.in | **REMOVE** | No verified commercial API licence/terms for this use were established. It is removed as a runtime fallback. |
| Open-Meteo free API (including geocoding) | **DEMO-ONLY** | Free endpoint is explicitly for non-commercial use; commercial use requires a commercial licence. Removed from runtime commercial routes. |
| Publisher RSS feeds | **DEMO-ONLY** | Publisher rights vary. BBC explicitly requires permission for business use of its RSS feeds; a public RSS URL is not blanket commercial permission. All curated publisher feed fetching is disabled pending publisher-by-publisher written permission. |
| Google News RSS | **REMOVE** | Google News terms restrict service content to personal, non-commercial use. Its RSS search route is disabled. |
| TheSportsDB free API fallback | **DEMO-ONLY** | Free tier is described for development; terms require paid subscription for published app-store apps and prohibit API resale without specific permission. Disabled for commercial product traffic until an appropriate licence is established. |

## Current code changes

- Publisher RSS source list is empty; feed fetchers fail closed without network requests.
- Google News RSS fails closed.
- Open-Meteo geocoding/weather and the wttr.in fallback fail closed.
- ESPN unofficial scoreboard and TheSportsDB free fallback fail closed.
- Yahoo Finance unofficial endpoints, DuckDuckGo HTML scraping and the CORS relay were already absent from the current PR branch at review time.
- No source in this list is classified as **allowed for commercial use** based solely on the public/keyless endpoint.

## Commercial release gate

Do not restore a disabled source until its current terms or a written provider licence explicitly covers the intended commercial app use, display, caching, retention, attribution, and redistribution. This audit does not grant any rights. Re-check terms before release because they can change.

## References

- Open-Meteo Terms: https://open-meteo.com/en/terms
- Open-Meteo commercial pricing/licence: https://open-meteo.com/en/pricing
- BBC business RSS permissions: https://www.bbc.com/usingthebbc/terms/can-i-use-bbc-content-for-my-business/
- Google News Terms: https://www.google.com/intl/en_us/terms_google_news.html
- ESPN Terms (commercial use restriction): https://www.espn.com/espn/news/story?page=espnterms
- TheSportsDB Terms: https://api.thesportsdb.com/docs_terms_of_use.php
