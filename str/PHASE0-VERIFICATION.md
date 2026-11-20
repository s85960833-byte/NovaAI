# STR Phase 0 Verification
Research date: 2026-11-20
Prompt: STR Final Prompt v3
Branch: feature/str-phase0-foundation-20261119
Base: main

## Render service
- Existing service: NovaAI; service ID: srv-dbidhpc9v7es73d6ia80.
- Repository: s85960833-byte/NovaAI; branch: main.
- Runtime: Node; build command: npm install; start command: node nova-server.txt.
- Plan: Free; auto deploy enabled on main commits.
- Existing URL: https://novaai-4auo.onrender.com.
- No service settings, environment variables, deploys or production files were changed.
- Official Render docs: free web services spin down after 15 minutes without inbound traffic; wake-up takes about one minute; 512 MB RAM / 0.1 CPU; 750 free instance hours per workspace per month; filesystem is ephemeral. Paid web services are listed from $7/month on the current Render page.
- Consequence: client-side build state and IndexedDB are mandatory; do not rely on server memory or filesystem for build recovery.

## Groq
- Official rate-limit page checked on 2026-11-19.
- Limits are model/organization-specific; dashboard shows exact account values. Public page's displayed table is not a safe substitute for the owner's account limits.
- Official data controls: inference inputs/outputs are not retained by default, but may be temporarily logged for reliability or suspected abuse, up to 30 days according to official data documentation.
- Official FAQ also states no model training on customer data for Groq's own purposes.
- Classification remains unverified for customer routing. Owner-only non-personal test data only until account settings and applicable agreement are reviewed.

## Cerebras
- Official pricing page checked on 2026-11-19.
- Free tier exists with lower rate limits and an 8192-token free-tier context length; exact free-tier RPM/TPM/RPD/TPD values were not published on the checked page.
- Official Terms of Service and Privacy Policy checked. Terms state Service Content may be used to provide the service and do not grant rights to train/fine-tune models. Privacy policy says inference/training/chatbot inputs and outputs are not retained, with logs deleted when no longer necessary.
- Classification remains unverified for customer routing until the exact API product terms and account tier are reviewed.

## Gemini
- Official Gemini API pricing page checked on 2026-11-19.
- Free tier: submitted content may be used to improve Google products.
- Paid tier: content is stated not to be used to improve products.
- Quotas are model/project-specific and need to be read from the account.
- Free tier classified unpaid; owner-only non-personal test data only. A paid project must be separately confirmed before any customer data can be routed.

## Google Play
- Official Android Developers requirement checked on 2026-11-19.
- Starting 2026-08-31, new apps and updates must target Android 16 (API 36) or higher, with platform-specific exceptions.
- STR only prepares guides and packages; the customer performs account creation, payment, identity checks, uploads, testing and submission.

## STR implementation verification (2026-11-20)
- Server-side owner gate verifies the active Supabase session against `/auth/v1/user`, then compares the returned UUID against the `STR_OWNER_USER_IDS` allow-list. Invalid configuration, invalid sessions, non-owner accounts and upstream failures all fail closed.
- The owner UUID is intentionally not guessed, scraped from unrelated records, or committed to source control. A real owner session cannot pass staging until the owner UUID is configured in the existing Render service's environment. No token or secret value is requested or stored in this repository.
- Local spec input is bounded to 1,000 characters; validated project specs are capped at 48 KiB and 60 total sections; local preview output is capped at 250,000 UTF-8 bytes; ZIP archives are capped at 400,000 bytes.
- Build checkpoints now skip repeated retention scans; expiry cleanup still runs on draft open/read. Browser tests cover pause/resume, restore, approval binding, safe preview sandbox, ZIP contents and 7-day expiry.
- Latest completed baseline before the resource-limit hardening: both backend and account/browser workflows passed on commit `1b546bef318e1150593cab89babf87bc03e1c09f`. New resource-limit and UTF-8 byte-cap changes are being revalidated on the current branch head.

## Decisions applied provisionally
- Business model: Model 1 — owner-only free (owner authorized all project defaults on 2026-11-19).
- Customer builds: disabled.
- Retention: 7 days (owner authorized the v3 default on 2026-11-19).
- No provider API keys added or read.
- No customer data may be routed to any provider at this stage.

## Blockers / open items
1. Real owner staging sign-in is blocked until the exact owner UUID is added to the existing Render service as `STR_OWNER_USER_IDS`. The service metadata does not expose configured environment variable names/values; the UUID must come from the owner's own NOVA account session. Do not infer or substitute another account.
2. Browser-side draft retention is implemented at 7 days. No STR prompts or drafts are persisted on the server; server-side application logs do not intentionally store request bodies.
3. Groq/Cerebras account-specific quotas need owner dashboard verification before exact capacity scheduling can be enabled.
4. A paid provider has not been selected; this is not required for Model 1.
5. No real-provider call or customer-data flow is enabled.

## Official source URLs
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/your-data
- https://trust.groq.com/faq
- https://inference-docs.cerebras.ai/support/pricing
- https://www.cerebras.ai/terms-of-service
- https://www.cerebras.ai/privacy-policy
- https://ai.google.dev/gemini-api/docs/pricing
- https://render.com/docs/free
- https://render.com/docs/compute-plans
- https://render.com/hosting/django
- https://developer.android.com/google/play/requirements/target-sdk