# NOVA AI — Buyer and Technical FAQ

**Status:** Internal diligence FAQ for a supervised, non-paid preview. Not a sales offer, purchase contract, valuation opinion, SLA or legal advice. Any transaction or account/IP discussion must be handled by a responsible adult and qualified counsel.

## Product and technology

**What is NOVA?**  
A Hindi-English web workspace with NOVA Learn, NOVA Build and NOVA Agents. It also contains an early NOVA BI module for deterministic CSV analysis and tenant-scoped business workflows.

**What makes it different?**  
No unique market position is proven. Paddlewheel, NavBharatAI and BooDoo publicly advertise overlapping Hindi/Indian-language app-building, preview/publish, code-export and payment features. NOVA's potential differentiators—change-budget accountability, portable proof bundle, learning-to-working-artifact and source-backed decision trace—remain hypotheses pending implementation and identical-task benchmarking.

**Is NOVA production-ready?**  
No. PR #98 is Draft/unmerged; Staging still serves old commit `195739a`; latest candidate has not been verified live. Production remains on its earlier deployment.

**What tests have passed?**  
On exact candidate `c3ddc3e32423a219c2c456cd92c1cba42b87ed88`, Main CI passed 45/45 steps and Browser CI passed 16/16. Main skips live/Production release checks while the PR is unmerged. Chromium is not physical Android testing.

## Data and privacy

**Does NOVA store chats in the cloud by default?**  
No. Chat history remains browser-local by default. Optional cloud sync is OFF unless the user opts in.

**What happens when cloud sync is enabled?**  
The current snapshot stores up to 40 recent chats (up to 150 messages each), message text, extracted text from attached documents, saved memory and custom instructions. Image attachments themselves are excluded. Avoid syncing sensitive content. Disabling sync stops future uploads but does not delete an existing backup; the separate delete-backup control is required.

**Can I upload company/customer/employee data to NOVA BI?**  
Not in this preview. Use only fictional or non-sensitive synthetic CSV data. The sample files are explicitly labelled demo data and do not represent customers or outcomes.

**Is full account deletion and retention implemented?**  
No. Complete self-service account deletion and a published retention schedule are not available yet. Do not use NOVA for confidential customer or regulated data.

## Security and operations

**Is the Express API authenticated?**  
The candidate includes optional Supabase JWT middleware, but `NOVA_API_AUTH_REQUIRED` defaults to `0`. Do not treat the core Express API as authenticated until it is enabled on Staging and live valid/invalid/expired-token tests pass.

**Is NOVA Business Intelligence multi-tenant?**  
The Supabase BI schema includes RLS and role-based tenant controls; read-only inspection found 11/11 public tables RLS-enabled and the BI Edge Function ACTIVE v14 with JWT verification. Live two-account testing remains outstanding. This is not an enterprise security certification.

**Are quotas and spend limits enforced?**  
NOVA BI has database-backed per-user rate limits. Core Express rate windows are process-local and are not durable monthly quotas, plan entitlements or hard provider spend caps.

**Can the project be restored from backup?**  
No restore drill has been performed. The runbook documents a CLI backup/isolated restore process. Standard Supabase CLI dumps do not include Auth users or Storage objects; they require separate handling.

**Is availability guaranteed?**  
No. Current Render Free hosting has no always-on guarantee or SLA.

## Commercial and ownership

**Can I subscribe or pay today?**  
No. Checkout, subscription enforcement, invoices, refunds and tax workflows are not production-ready. No payment or deposit should be accepted.

**Are provider keys and licences transferable?**  
Not established. The receiving operator may need their own provider accounts and keys; commercial rights and assignment terms must be checked vendor by vendor.

**Is the source/IP fully cleared for resale?**  
No. npm lockfile metadata has a preliminary permissive-license scan; Deno, CDN artefacts, fonts, media/video/audio, copied source and contributor IP assignments are not fully cleared.

**What is NOVA worth today?**  
No reliable fair market value has been established. The ₹15–20 lakh target is unsupported. The replacement-labour model is not fair value; comparable deal data and customer traction are absent.

**Can I speak to an acquisition contact?**  
A verified adult-managed buyer/contact process is not established. Current outreach templates are for non-paid product feedback only, not acquisition or purchase negotiation.
