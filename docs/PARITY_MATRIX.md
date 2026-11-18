# NOVA 1.0 → NOVA 2.0 Parity Matrix

**Baseline:** `main` SHA `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50` · **Audit:** 2026-11-17  
Status meanings: **Works** = code/test assertion exists, not universal proof; **Unknown** = not end-to-end verified; **Broken** = known defect/gap; **Not implemented** = no matching implementation found.

## Screens and capabilities

| ID | Feature | Existing implementation / evidence | Status | NOVA 2.0 destination and test |
|---|---|---|---|---|
| UI-01 | Home/navigation | `index.html`, `nova-reference.js`; single-page shell/sidebar | Unknown | Darbar; mobile/desktop navigation and back |
| UI-02 | Learn/Build/Agents groups | `nova-reference.js`, `mode-registry.js` | Unknown | staged ministers; verify every launcher |
| UI-03 | Chat workspace | `index.html`, `nova-app.js` | Unknown | Sakha; send/reload/reopen |
| UI-04 | Conversation history | local key `nova` | Unknown | Sakha; create/rename/delete/reload |
| UI-05 | Chat search | UI and app search code | Unknown | Sakha; exact/partial search |
| UI-06 | Message actions | copy/edit/regenerate controls | Unknown | Sakha; test every action |
| UI-07 | Streaming | server-side provider proxy | Unknown | Sakha; TTFT/cancel/timeout |
| UI-08 | Hindi/English UI | dictionaries and language switch | Unknown | shared shell; full translation audit |
| UI-09 | Reply language | separate reply-language control | Unknown | Sakha; cross-language combinations |
| UI-10 | Theme | saved theme preference | Unknown | shared shell; reload/contrast |
| UI-11 | Memory/instructions | local preferences and account code | Unknown | Sakha/Smriti; save/edit/clear and payload check |
| UI-12 | Backup import/export | local backup controls | Unknown | Sakha; malformed-file and round-trip tests |
| UI-13 | BYOK/provider setup | browser UI and provider config | Unknown | provider layer; key exposure/security tests |
| UI-14 | Shareable config | `scripts/check.mjs` asserts personal key omission | Works at assertion level | Sakha; inspect actual exported file |
| UI-15 | Privacy notice | app notice and privacy draft | Unknown | shared privacy; reconcile with actual data flows |
| UI-16 | Photo panel | camera/gallery/preview | Unknown | Sakha; permission/upload/failure |
| UI-17 | Image understanding | vision input, server limit noted as 3 images | Unknown | Sakha; rotated/poor-light/unsupported |
| UI-18 | Image generation | async jobs and polling | Unknown | Sakha; lifecycle/cancel/timeout |
| UI-19 | Voice input | SpeechRecognition/webkitSpeechRecognition | Unknown | Sakha; physical Chrome/Samsung Hindi test |
| UI-20 | Voice output | speechSynthesis | Unknown | Sakha; Hindi pronunciation/cancel |
| UI-21 | Live voice | live voice controls/transcription fallback | Unknown | Sakha; interruption/fallback |
| UI-22 | PDF/document explainer | `mode-workspace.js` | Unknown | Sakha; text/scanned/large/malformed |
| UI-23 | TXT/MD/CSV | text parser and size limits | Unknown | Sakha; supported/unsupported files |
| UI-24 | Scheme finder | government-domain web search, no deterministic curated dataset | Broken vs target | Diwan; reviewed dataset matching |
| UI-25 | Shopkeeper | GST helper/business-message mode | Unknown | Legacy shelf; scope decision later |
| UI-26 | Learn modes | math/photo/NCERT/board/SSC/UPSC/English | Unknown | Legacy until Guru; per-mode Hindi/English tests |
| UI-27 | Builder | app/website/SaaS guidance | Unknown | Legacy until Shilpi; sandboxed tests later |
| UI-28 | Business Intelligence | separate BI modules | Unknown for core | Keep separate; synthetic BI suite only |
| UI-29 | Offline chats | local saved chats; new AI replies require internet | Unknown | Sakha; offline reopen/send |
| UI-30 | Low Data Mode | smaller file/image/history budgets | Unknown | shared settings; inspect request payload |
| UI-31 | Accessibility | keyboard/text-size/accessibility controls | Unknown | shared shell; WCAG/keyboard/screen-reader |
| UI-32 | PWA | manifest, service worker, icons | Unknown | PWA; install/update/offline tests |
| UI-33 | Entry animation | entry gate/video; legacy marker migration defect | Broken / CI regression | Darbar entry; fresh/legacy/skip/reduced-motion |
| UI-34 | Account dialog | account UI in settings | Unknown | shared account; all dialog states |
| UI-35 | Sign-up/sign-in | Supabase email/password client paths | Unknown | shared account; synthetic accounts |
| UI-36 | Password recovery | reset/resend/recovery paths | Unknown | shared account; expiry and update tests |
| UI-37 | Cloud sync | opt-in Supabase workspace; same-ID overwrite risk | Broken for concurrent edits | Sakha; versioned sync/conflict-copy tests |
| UI-38 | Cloud backup deletion | workspace-row delete control | Unknown | shared account; synthetic row deletion |
| UI-39 | Full account deletion | Auth + DB + storage deletion not proven | Broken / missing | Sakha; full lifecycle test |
| UI-40 | Data export | local export; server-side account export not proven | Unknown / incomplete | Sakha; complete account export |

## Legacy specialist modes (all 13)

| Mode ID | Current group | Current function | NOVA 2.0 treatment |
|---|---|---|---|
| `general` | Agents | general chat | Sakha |
| `voice` | Agents | voice chat | Sakha |
| `document` | Agents | document explainer | Sakha; Diwan Paper Reader remains distinct |
| `schemes` | Agents | scheme search | Diwan deterministic dataset |
| `shopkeeper` | Agents | shopkeeper assistant | Legacy shelf |
| `math` | Learn | math help | Legacy until Guru |
| `photo` | Learn | solve from photo | Legacy until Guru |
| `ncert` | Learn | NCERT | Legacy until Guru |
| `board` | Learn | board exam | Legacy until Guru |
| `ssc` | Learn | SSC exam | Legacy until Guru |
| `upsc` | Learn | UPSC exam | Legacy until Guru |
| `english` | Learn | English learning | Legacy until Guru |
| `builder` | Build | app/website builder | Legacy until Shilpi |

## Backend endpoint inventory

| ID | Endpoint | Purpose | Phase / test |
|---|---|---|---|
| API-01 | `GET /health` | health/readiness | P1; isolated staging |
| API-02 | `GET /api/config` | public config/flags | P1/P3; no secrets |
| API-03 | `POST /api/chat/completions` | LLM proxy/stream | P3; valid/invalid/429/timeout |
| API-04 | `POST /api/transcribe` | speech transcription | P3; Hindi/English/failure |
| API-05 | `POST /api/search` | web search | P3; citations/freshness/outage |
| API-06 | `POST /api/image` | image job creation | P3; size/lifecycle |
| API-07 | `GET /api/image/status/:id` | image job status | P3; unknown/expired IDs |
| API-08 | `POST /api/live` | live data | P3; provider outage |
| API-09 | `GET /api/live/selftest` | provider self-test | P1/P3; disabled safely |
| API-10 | `GET /api/feed` | feed aggregation | P3; source/date/staleness |
| API-11 | `GET /manifest.webmanifest` | PWA manifest | P2; manifest validation |
| API-12 | `GET /sw.js` | service worker | P2; cache/update/offline |
| API-13 | `GET /nova-config.js` | browser config | P1; public values only |
| API-14 | `GET /nova-app.js` | app runtime | P2/P3; browser regression |
| API-15 | `GET /nova-reference.js` | dashboard rendering | P2; navigation |
| API-16 | `GET /mode-registry.js` | mode registry | P3; unique IDs/bilingual metadata |
| API-17 | `GET /mode-workspace.js` | mode workspace | P3; history/upload/voice |
| API-18 | `GET /nova-account.js` | account/Auth client | P3; synthetic accounts |
| API-19 | `GET /nova-sync-merge.js` | sync merge | P3; conflict regression |
| API-20 | `GET /nova-entry.js` | entry animation | P2; intro migration |
| API-21 | `GET /s-tier.js` | optional UI bundle | P2; lazy load/interactions |
| API-22 | `GET /nova-suite.js` | Learn/Build/Agents bundle | P2/P3; launcher coverage |
| API-23 | `GET /nova-business-core.js` | BI engine | separate product |
| API-24 | `GET /nova-business.js` | BI UI | separate product |
| API-25 | `GET /nova-business-cloud.js` | BI Supabase bridge | separate product |
| API-26 | `GET /icons/nova-emblem.svg` | brand asset | P2; rendering/license |
| API-27 | `GET /assets/nova-entry.mp4` | entry media | P2; verify use/transfer |

## Auth and data operations

| ID | Operation | Finding | Status |
|---|---|---|---|
| AUTH-01 | email sign-up | Supabase Auth client | Unknown E2E |
| AUTH-02 | email/password sign-in | Supabase Auth client | Unknown E2E |
| AUTH-03 | sign-out | Supabase Auth client | Unknown E2E |
| AUTH-04 | password reset | Supabase Auth client | Unknown E2E |
| AUTH-05 | confirmation resend | Supabase Auth client | Unknown E2E |
| AUTH-06 | phone OTP | no verified working flow | Not implemented |
| DATA-01 | cloud sync | optional workspace table | Broken on concurrent edits |
| DATA-02 | cloud backup delete | row delete control | Unknown |
| DATA-03 | full account deletion | Auth/DB/storage lifecycle not proven | Missing |
| DATA-04 | full server export | not proven | Unknown |
| DATA-05 | wallet/ledger | no NOVA 1.0 wallet API found | Not implemented |
| DATA-06 | payment/webhook | no NOVA 1.0 payment API found | Not implemented |

## Diwan gaps

| ID | Capability | Existing overlap | Required work |
|---|---|---|---|
| DIW-01 | Paper Reader | generic document explainer | strict output schema, confidence, dates, amounts, actions, flags, unreadable fields |
| DIW-02 | Scam check | no dedicated flow | rubric, safe actions, verified contacts |
| DIW-03 | RTI draft | generic document mode | central/state flow and official submission/appeal sources |
| DIW-04 | Complaint letter | generic document mode | categories, evidence checklist and official escalation |
| DIW-05 | Scheme finder | search-based mode | deterministic matching against reviewed official records |
| DIW-06 | official contacts | no curated verified file found | source URL and last-verified date |
| DIW-07 | consent/24-hour deletion | generic upload | consent, expiry job and deletion evidence |
| DIW-08 | PDF/DOCX | not fully proven | generation and validity tests |
| DIW-09 | AI evals | assertions exist, not task eval suite | ≥30 Hindi/English/Hinglish cases per task |
| DIW-10 | source freshness | no governed dataset | source URL and last-verified dates |

## Compatibility contracts

| ID | Contract | Required handling |
|---|---|---|
| COMP-01 | local key `nova` | preserve; no destructive rename |
| COMP-02 | `nova_t` | preserve legacy probe compatibility |
| COMP-03 | `nova_modes_v1` | preserve/migrate per-mode history |
| COMP-04 | `nova_mode_cache_v1` | preserve only when schema-compatible |
| COMP-05 | `nova-cloud-sync-enabled` | never silently enable sync |
| COMP-06 | user identity | reviewed `legacy_nova1_id` mapping and dry run |
| COMP-07 | provider secrets | never export/log/commit |
| COMP-08 | cloud sync | version-aware conflict handling |

## Reuse / rebuild

**Reuse after tests:** local storage/backup logic, bilingual mode metadata, provider URL validation, server-side key proxy patterns, image job lifecycle, request-size/rate helpers, PWA shell and Supabase Auth only after deletion/data-flow review.

**Rebuild:** coupled SPA shell, conflict-unsafe sync, search-only scheme matching, incomplete deletion/export, intro marker migration, stale provider/model assumptions.

**Keep separate:** NOVA Business Intelligence.

## Evidence limitations

This matrix records source inspection, not fresh production or physical-device testing. Android behaviour, email delivery, full deletion/export, concurrent sync and backup restore remain NOT VERIFIED.


## Unified-shell bridge status — 2026-11-18

The new Darbar home now exposes three real shortcuts that load the existing Learn, Build and Agents groups inside a same-origin `/classic?workspace=...` iframe. The existing `mode-workspace.js` handles the group query and the original mode registry/history remain in place. The `/classic` route alone returns `X-Frame-Options: SAMEORIGIN` and a CSP with `frame-ancestors 'self'`; all other routes retain `DENY` / `frame-ancestors 'none'`.

Automated Playwright coverage added for:
- selecting each Learn / Build / Agents group from the new Darbar home;
- checking the iframe URL and visible original group header;
- checking same-origin framing response headers;
- checking the embedded viewport at 390 × 844 CSS pixels with no horizontal overflow.

**Interpretation:** this is compatibility availability, not native migration or end-to-end feature parity. The original chat/history, voice, search/citations, file/image, login/account and specialist-mode workflows remain individually unverified until their specific parity tests pass. Do not mark them complete because the old page is embedded.
