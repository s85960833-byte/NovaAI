# NOVA Keyless Core Contract

Status: engineering contract on `feature/keyless-main-chat-no-key-test-20261118`.

## Existing Core requirements

1. Main chat and all existing assistant answers use `NovaLocalAI.generate()` in the browser. No hosted chat-completions route, bearer token or paid LLM fallback is permitted.
2. Voice transcription uses local Whisper through `NovaLocalAI.transcribe()`. No hosted transcription provider is permitted.
3. Photo text extraction and scanned-PDF OCR use local Tesseract. The UI must say OCR extracts text and is not general image/scene understanding.
4. Supported PDFs and text documents are parsed locally.
5. Current/time-sensitive questions in main chat default to live research through `/api/live`. NOVA retrieves public no-key evidence; the local model writes the answer from that context and cites only supplied sources.
6. NOVA Learn / Build / Agents use the same local model. Every submitted question in those workspaces uses the same `/api/live` evidence service.
7. Old provider keys/config are discarded. Hosted chat and hosted speech endpoints stay disabled.
8. Image generation stays disabled until a genuinely on-device model is integrated and validated. Do not call an anonymous public token or public remote image endpoint “zero-key”.
9. Optional Supabase Account/Company Cloud remains a distinct data feature with an existing publishable project key; it must not be used for AI inference or public live retrieval.

## Boundary for the upcoming user-supplied feature file

- Preserve the feature specification's behaviour and user-visible requirements as written, subject to safety, legal, feasibility and security review.
- Any API key required by the new feature is isolated in that feature's server-side environment variable and route/module. It must never enter browser code, local storage, chat history, source text, URL query parameters or logs.
- Existing chat, voice, OCR, PDF, Learn/Build/Agents answers and live search must never read the new feature key or call its provider route.
- Invoke the new route only when the user explicitly opens/uses that new feature, not for ordinary existing questions.
- Add regression tests proving the Core stays keyless even when the new feature key is present in the server environment.
- Add separate tests for the new feature's credential handling, timeouts, rate limits, error handling, data permissions and cost disclosure.
- Do not merge or deploy until exact-head CI, browser tests, real local model inference, live no-key research checks and target-Android verification pass.

## Reliability and cost boundaries

- The Core does not incur hosted AI-model inference charges.
- Public search/data services may throttle, block, change policy or become unavailable; no SLA is implied.
- Render hosting, bandwidth, storage, phone data and model downloads are not guaranteed to be free.
- Model quality and latency depend on the device; Qwen3-0.6B is smaller than frontier hosted models.
- First use downloads model/runtime assets. After caching, local inference may work offline; live research still requires internet.
