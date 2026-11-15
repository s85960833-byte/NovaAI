# NOVA — Existing Product Regression Matrix

**Scope:** characterization of the pre-upgrade product; not the new Learn/Build roadmap features.  
**Test environment:** CI-local Express service, ephemeral Playwright browser context, test credentials and test-only/mock provider responses.  
**Do not interpret mocked provider responses as live-provider verification.**

## Test suites

| ID | Suite / command | Main coverage |
|---|---|---|
| R-01 | `scripts/check.mjs` via `node scripts/check.mjs` | Syntax checks of HTML/JS/server/workflows; route/security/migration guardrails; script wiring; XSS/CSP/mobile navigation source invariants. |
| R-02 | `scripts/runtime-smoke.mjs` via verification workflow | Local Express start, `/`, `/health`, security headers/CSP, `/api/config`, API malformed/invalid-input response behavior, PWA manifest/service worker/icons and frontend-module routes. |
| R-03 | `scripts/browser-smoke.mjs` via browser verification workflow | Entry/splash marker lifecycle; English-first and Hindi switch/persistence; CSP/PDF.js worker and synthetic PDF text extraction; account and opt-in cloud-sync UI; BYOK-key non-persistence; Learn/Build/Agents navigation; Study/photo panel; BI/Company Cloud UI and language switching; mocked streamed standard chat round-trip; reopen a pre-upgrade saved chat; saved memory/custom-instruction request context; rename, pin/unpin, delete one disposable chat, preserve another, and verify state after reload; mock voice/image flows; responsive mobile touch behavior, reduced motion and JavaScript/CSP error capture. |
| R-04 | `tests/mobile-layout.spec.mjs` via `npm run test:mobile-layout` | Five viewport widths/heights, mobile single-column fit/no horizontal overflow, drawer and scrim, settings, workspace modal/composer boundaries, English-first and Hindi toggle. |
| R-05 | `scripts/modes-check.mjs` | Registered mode metadata and bilingual fields, registry/workspace consistency, study-mode policy invariants. |
| R-06 | `scripts/cloud-sync-merge.test.cjs` | Message merge, deterministic conflict resolution, deleted-chat tombstones and limits. |
| R-07 | `scripts/provider-url.test.cjs` | HTTPS-only/provider URL validation and secret-bearing endpoint restrictions. |
| R-08 | `scripts/rate-limit.test.cjs` | Bounded per-IP rate-window behavior and limit reset/expiry behavior. |
| R-09 | `scripts/pdf-security.test.cjs` | PDF.js untrusted-document/eval mitigation invariant. |
| R-10 | `scripts/security-markdown.test.cjs` | Markdown/link escaping against HTML attribute injection. |
| R-11 | `scripts/business-intelligence.test.cjs` | 45 deterministic BI CSV/data-validation/calculation tests (not AI prediction quality). |
| R-12 | `scripts/validate-ai-evaluation.mjs` | 60-case fixture schema/uniqueness/shape validation; this is not a live LLM grounding/accuracy score. |
| R-13 | `scripts/test-supabase-migrations.sh` + `scripts/supabase-rls-integration.sql` | Migration application to disposable CI PostgreSQL and tenant/RLS isolation assertions. |
| R-14 | Deno tests under `supabase/functions/nova-bi-api/*_test.ts` | Edge Function TypeScript type-check, request validation, CORS and invitation lookup helpers. |
| R-15 | `scripts/company-cloud-browser.mjs` | Company Cloud UI/auth invitation workflow in CI browser; does not establish a real user's production login. |
| R-16 | `scripts/smoke.mjs`, `scripts/shutdown-smoke.mjs`, `scripts/smoke-free-image.mjs`, `scripts/wait-live.mjs` | Additional build/runtime/shutdown/live-wait/image-provider workflow pieces. The free-image probe is not run on every PR; check workflow event conditions. |
| R-17 | `npm audit --omit=dev --audit-level=high` | Production dependency vulnerability threshold in CI. |

## User-facing feature to test mapping

| Existing feature | Relevant regression IDs | What is actually asserted | Remaining limit |
|---|---|---|---|
| Splash / NOVA Jagran entry | R-03 | Entry UI, marker persistence, legacy marker migration, no replay after reload, reduced-motion. | Physical Android cold-start/transition performance not measured. |
| Home / workspace navigation | R-03, R-04 | Three current workspace cards; English default; Hindi toggle; mobile drawer; responsive layouts. | The historic “4 main categories / 6 India-specific features” description has no direct one-to-one mapping in the present 13-mode registry; preserved, not restructured. |
| Standard chat / answer request | R-02, R-03 | Request validation; test-browser user→assistant round trip against a deterministic mocked API response. | No live provider answer-quality or reliability claim. |
| Saved chats | R-03 | In isolated browser storage: reopen a seeded pre-upgrade saved chat, send a real legacy chat request through the mocked SSE endpoint, verify both turns persist, rename and pin it, delete a separate disposable chat, preserve the renamed chat across reload. | Does not inspect or modify the owner's real browser data; provider response is mocked. |
| Memory / custom instructions | R-03 | Save to the main `nova` state, verify both values are carried in the standard chat request payload, reload, reopen the editor and verify they remain persisted. | No cloud multi-device merge proof beyond R-06. |
| Web search / live retrieval | R-02, R-17 and provider source audit | Endpoint validation; provider URL security; local API shape. Source code contains a Brave/Tavily→DuckDuckGo/Wikipedia fallback. | Current external provider success/latency is not covered by PR CI. Live self-test is disabled on ordinary smoke path. |
| News / RSS / GDELT | Provider source audit; runtime feed route | Google News and GDELT have bounded timeouts/cache; self-test defines GDELT→Google News fallback. | No reliable live Render response or current feed freshness measurement. |
| Weather | Provider source audit | Open-Meteo geocoding/forecast and wttr.in fallback are present; cache and timeouts are in source. | Live 429 rate/fallback success and freshness not measured. |
| Markets / crypto | Provider source audit | CoinGecko→Coinbase fallback, Frankfurter/ECB FX and bounded cache/timeouts are present. | Live 429 and value comparison not measured. |
| Sports | Provider source audit | ESPN scoreboard→TheSportsDB fallback. Fallback text explicitly says it is a schedule/results source, not live scores. | Live 403 and fallback success not measured. |
| Voice chat / transcription | R-02, R-03 | Simulated browser speech-recognition bridge submits transcript to mocked chat; invalid audio input returns expected client error. | Not a real mic/speaker permission test; no physical device run. |
| Image input / camera / gallery | R-03, R-02 | Build image studio integration and photo panel open/close; request validation. | Actual physical camera/gallery permission and upload are unverified. |
| Image generation | R-02, R-03 | Request shape and async job-polling/rendering with a test-only mocked response. | Does not prove a real provider produced an image; live free provider probe is skipped on PR CI. |
| Files / PDF | R-03, R-02, R-09 | Synthetic text PDF parsed with pinned PDF.js/worker; `isEvalSupported:false`; invalid requests and static routes. | Not a 20-page production workload, scanned-PDF OCR, complex-file corpus or Hindi export benchmark. |
| Study Mode / 13 prompt modes | R-03, R-05 | Registry bilingual consistency, Learn/Build/Agents mode boundaries and selected mode interactions. | No new CBSE paper-generation tests exist until that new feature is implemented. |
| NOVA Suite / Project Brain / AI Council | R-01, R-02 and bundle smoke | Source syntax and bundle route/wiring. | Every local tool/state action does not yet have an isolated behavior test; Council is sequential prompting, not independent model consensus. |
| Business Intelligence | R-02, R-11, R-13, R-14, R-15 | CSV calculation suite, DB migration/RLS checks, Edge Function validation and browser cloud flow. | No confidential/production tenant data; deployed Edge Function smoke is skipped for PR events; real two-user sign-in isolation needs owner-supervised verification. |
| Personal account / cloud sync | R-03, R-06, R-13 | Sign-in/create controls, sync OFF by default, client merge unit tests, database RLS migration tests. | Real confirmation email, password reset, two real users and deletion lifecycle are not proven. |
| Settings / BYOK key | R-03 | Key isn't persisted to localStorage after migration/save; key exists in active tab only until reload; language/theme/settings browser flow. | No test of each third-party provider key's real authentication. |
| PWA / icons / offline | R-02 | Manifest, service worker and 192/512 icon routes return valid assets in local runtime smoke. | Lighthouse score, install flow and full offline navigation on a real phone not measured. |
| Privacy / Terms | R-01, R-02 | Draft document presence, privacy UI and source-level checks. | No lawyer review, DPDP certification or complete account deletion/retention evidence. |
| Feedback persistence | None | Not found as a verified first-party DB feature in current source audit. | Open implementation gap; do not imply feedback is durably stored. |
| Evaluation | R-12 | Fixture structure validates. | No golden set of 15 original chapters, live grounding/verifier scoring or 95% source-traceability result. |
| Accessibility / Lighthouse | R-04, R-03 | Responsive layout, dialog semantics/focus checks, reduced motion and some touch targets. | No measured Lighthouse >=90 report or complete WCAG audit. |

## External provider source audit (not live-provider sign-off)

| Provider path | Source behavior observed | Live status in this Phase 0 run |
|---|---|---|
| General search | Brave Context/Brave/Tavily raced with `Promise.any`; if none succeeds, DuckDuckGo and Wikipedia fallbacks race. Success cache around three minutes; provider timeouts around 5.5–6 seconds. | NOT VERIFIED. No DNS/live HTTP route available from this session. |
| GDELT/news | GDELT request bounded around 4.5 seconds and cached; self-test explicitly tries Google News when GDELT fails. Google News RSS has 4.5s request timeout and bounded retries. | NOT VERIFIED. |
| Weather | Open-Meteo geocode and forecast calls cached; wttr.in fallback on geocode/forecast failure. | NOT VERIFIED. |
| CoinGecko | 6.5s timeout; errors including rate limit fall through to Coinbase Exchange spot data. | NOT VERIFIED. |
| ESPN | 5s scoreboard timeout; on exception fallback to TheSportsDB with explicit “not live scores” label. | NOT VERIFIED. |

**Render evidence limitations:** the Render service metadata is readable, but Render request/latency metrics and request/app logs returned empty result sets for the inspected period. Direct HTTP requests to production/staging could not resolve from this execution environment. Empty observability results are not proof of zero traffic or absence of errors. No external provider is marked “passing” without a successful live probe.

## CI run evidence

- The initial Phase-0 PR head `211c369387f7835cb1cffca00813492e181592f1` passed the full existing verification workflow (run `43710627218`); PR-event live Render, live provider and live image probes were skipped as designed.
- The follow-up browser suite on validated source/test head `06d1a7ebe4dbf3ce8bcc85f361c6cfd57c06133e` passed exact-head CI: main verification [run #3951](https://github.com/s85960833-byte/NovaAI/actions/runs/43716609879) and account/browser verification [run #1452](https://github.com/s85960833-byte/NovaAI/actions/runs/43716609875), both **success**. The new test explicitly covers pre-upgrade saved-chat retrieval, streamed standard-chat response, memory/custom-instruction persistence and request context, rename, pin/unpin, deletion of a separate disposable chat, and reload persistence.
- The later `docs/FEATURE_INVENTORY.md` and `docs/PROGRESS.md` additions are documentation-only changes; the final PR head must still be revalidated after those commits.
- Green CI is necessary but does not complete the Phase-0 production behavior gate while live providers/Render are unavailable, the backup tag is absent and physical Android remains untested.
