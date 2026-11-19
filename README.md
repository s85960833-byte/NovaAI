# NOVA AI

NOVA is an India-oriented Hindi-English AI web workspace organized into three areas:

- **NOVA Learn** — learning and study workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — assistant and agent workflows.

Production preview: https://novaai-4auo.onrender.com

## Release status — 8 November 2026

<badge>Limited discovery only</badge>

- Current main commit: `94be54b3e94f2dbccb039425b51d936565ab9eed`.
- Current Render deployment: `dep-dbo5sdbm8hqs73fkvnrg`, status `live`, serving commit `94be54b3e94f2dbccb039425b51d936565ab9eed`.
- Render build succeeded, `node nova-server.txt` started and reported port 10000. The prior main verification run [#42476098568](https://github.com/s85960833-byte/NovaAI/actions/runs/42476098568) passed all CI steps, including source/security checks, PostgreSQL RLS integration, Deno and Edge Function checks, local runtime/PWA, dependency audit, Chromium browser tests, mobile layout checks and live smoke against the then-current production release.
- A new post-deployment verification run is still required to prove the latest deployment's live HTTP behaviour. Direct HTTP verification from the current review environment was unavailable.
- Physical Android testing, real Auth email delivery, redirect allow-list, two-real-account cloud-sync isolation, complete account deletion, backup/restore and full live AI accuracy/latency/cost evaluation are not yet verified.

## Data and privacy notes

- Chat history remains browser-local by default.
- Optional account cloud sync is OFF by default and requires explicit opt-in.
- If enabled, the current snapshot stores up to 40 recent chats (up to 150 messages per chat), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Users should avoid syncing sensitive information.
- Disabling sync stops future uploads but does not delete an existing cloud backup. The user must use the separate delete-cloud-backup control.
- Real signup/confirmation/reset email delivery, Auth redirects and two-account isolation have not been verified end to end.
- A complete self-service account deletion and a published retention schedule are not available yet.

## Commercial and operational limits

- No paying customers, revenue, traction, valuation or certification are represented.
- Paid checkout, server-side subscription entitlements, cancellation/refunds, tax invoices and customer support operations are not ready.
- Render uses a Free plan in Singapore with one instance and no always-on guarantee or SLA.
- NOVA BI / Company Cloud is an early preview only. Use synthetic data; do not submit confidential, personal, employee, student, regulated or customer data.
- AI outputs and third-party provider availability can be inaccurate, delayed, rate-limited or unavailable.
- Privacy and Terms documents are drafts, not approved legal policies.

## Discovery boundary

Only non-paid, adult-supervised buyer-interest conversations and synthetic-data previews are appropriate. Do not accept payments, deposits, customer data or confidential information. Any ownership, IP transfer, payment, contract or sale discussion must be handled by a responsible adult with qualified legal review.

## Key documents

- [Buyer interest brief](BUYER_INTEREST_BRIEF.md)
- [Pitch readiness checklist](PITCH_READINESS.md)
- [Privacy notice draft](PRIVACY_NOTICE_DRAFT.md)
- [Terms of use draft](TERMS_OF_USE_DRAFT.md)
- [Support and incident runbook](SUPPORT_AND_INCIDENT_RUNBOOK.md)

## Keyless AI runtime

NOVA's existing assistant and answer-generation features are designed to use **no hosted AI-model API key and no paid LLM inference**.

- **Chat and reasoning:** Qwen3-0.6B ONNX runs locally in the browser through Transformers.js; WebGPU first, CPU/WASM fallback.
- **Voice transcription:** Whisper Base ONNX runs locally in the browser; WebGPU first, CPU/WASM fallback. Text-to-speech uses the browser speech engine.
- **Photo text reading and scanned-PDF OCR:** Tesseract.js runs locally for English and Hindi. This extracts readable text; it is not general scene/object understanding.
- **PDF/text/document handling:** PDF.js and browser file APIs parse supported files locally; extracted text is passed to the local model on the current device.
- **Current answers:** main chat always checks live public sources before local-model generation. The NOVA server retrieves evidence from public no-key sources such as DuckDuckGo, GDELT, Google News RSS and Wikipedia, plus public feeds/data services for weather, time, markets, science, statistics, natural events and sports.
- **NOVA Learn / Build / Agents:** each submitted question uses the same no-key live research route before local-model generation.
- **Image generation:** deliberately disabled until a genuinely on-device image model is integrated and validated. No AI Horde, Pollinations or other remote image-generation request is made.
- **Local storage:** chats and files remain browser-local unless the user explicitly enables the separate account/cloud feature.

First use downloads model/runtime/OCR files. After successful caching, local inference can work without internet, but **new live research requires internet**. Browser storage may be cleared or evicted, and low-memory phones may fail to load models. Qwen3-0.6B is a small on-device model, not equivalent to a frontier hosted model. Public search/data services can rate-limit, block traffic, change policies or return incomplete/stale evidence. If live retrieval fails, NOVA must disclose that it cannot verify current facts rather than inventing an answer.

### Key boundary for the upcoming feature file

The existing NOVA Core must not read, store or send a hosted LLM, speech, search or image-provider key. New functionality described in the later user-supplied specification must be added as an isolated module/route. If that new feature needs an API key, its key must be feature-scoped and server-side only; it must never be placed in browser code, local storage, chat history, URLs or logs. Existing chat, voice, OCR, PDF, Learn/Build/Agents answers and live search must keep using the local model and no-key public retrieval, even after the new feature is added. Add regression tests proving the Core never invokes the new paid route.

### Existing optional account/cloud exception

Optional NOVA Account / Company Cloud still uses the existing Supabase publishable project key for authentication and cloud data only. This is separate from AI generation and is not sent to the local model or public live-research connectors. Removing that cloud credential entirely would require a separate, reviewed migration to a first-party account/database service; it is not part of this keyless AI-Core change. Therefore the current guarantee is **no hosted AI-provider key or inference spend for existing AI answers**, not “no credential anywhere in every optional cloud feature.”

Hosting, bandwidth, device data usage and model downloads may still have costs. “No AI API key” does not mean “no internet” or “all infrastructure is free.”

## Cloud-sync limitation to disclose

A code review found that local chats with the same ID overwrite remote versions during sync, so newer messages from another device can be lost. Saved memory and custom instructions are imported only when the local values are empty. Cloud sync is therefore not conflict-safe yet; do not rely on it for important data or present it as production-ready. This must be fixed and regression-tested before customer onboarding.
