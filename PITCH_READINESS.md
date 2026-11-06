# NOVA — Pitch Readiness Pack

**Document status:** Internal working draft  
**Product status:** Demo candidate; not yet approved as a public production release  
**Reference build:** `pitch-readiness-20261106` (based on the bilingual three-workspace candidate)  
**Production branch:** `main` — unchanged by this document  
**Production URL:** https://novaai-4auo.onrender.com

## 1. One-sentence pitch

NOVA is an India-oriented, Hindi-and-English AI workspace that brings learning, building, and everyday AI assistance into one mobile-first experience.

## 2. The user problem

People often switch between separate AI tools for studying, creating digital projects, asking questions, working with files, and using voice. NOVA's product direction is to make these workflows easier to discover from one interface, with clear separation between Learn, Build, and Agents.

Do not claim that this problem is solved for every user segment. Validate the message with actual demos and customer interviews.

## 3. Product story

- **NOVA Learn:** guided learning and study-oriented tools, including photo-based questions.
- **NOVA Build:** a workspace for creating and working on digital projects, including the Image Studio.
- **NOVA Agents:** the everyday assistant workspace, including voice interaction, agent tools, and saved history.

The bilingual candidate labels the three workspaces in Hindi and English. Existing chat, settings, and mode-history storage is intended to remain backward-compatible.

## 4. Demo sequence (about 5 minutes)

1. Open the app on a phone-sized screen and show the three workspaces.
2. Switch the interface language and show that the workspace labels remain understandable.
3. Open Learn and demonstrate one study/photo-question workflow using a harmless sample question.
4. Return home, open Build, and show the Image Studio entry point. If the free image provider is queued or unavailable, explain that provider availability can vary; do not fake a completed result.
5. Open Agents, demonstrate a short chat, then show the voice entry point. Only claim live voice works after a real microphone/speaker test on the demo device.
6. Show saved history and explain where the user's browser-local data is stored.
7. Close by describing the next step as a guided pilot, not a fully scaled enterprise rollout.

## 5. Claims that are safe to make

- NOVA is designed around three distinct workspaces: Learn, Build, and Agents.
- The candidate UI provides Hindi/English labels.
- The app is built as a mobile-first web application.
- Existing AI workflows include chat and selected study, file, voice, image, and search capabilities, subject to the configured provider and browser.
- The team is validating reliability and mobile behavior before public rollout.

## 6. Claims that must NOT be made yet

- Do not say that the latest three-workspace candidate is live in Production. It is on a feature branch.
- Do not promise 100% uptime, zero errors, guaranteed answers, guaranteed image generation, or unlimited free usage.
- Do not describe browser-local chat history as cloud-synced or account-backed.
- Do not claim full account login/authentication for the general NOVA assistant.
- Do not claim enterprise security certification, compliance, or audited production readiness.
- Do not present NOVA Business Intelligence as a launched customer feature. Its separate PR is a Draft and has real-account/email/retention/backup release gates.
- Do not claim the AI always cites sources or never hallucinates; users should verify important answers.
- Do not publish pricing, service limits, or provider guarantees until the owner has approved the exact commercial terms.

## 7. Known release gates

| Area | Evidence available | Still required before a production pitch/demo promise |
|---|---|---|
| Three-workspace UI | PR #65 Chromium CI passed desktop and 412px mobile workspace checks | Merge/release approval and physical Android visual/touch check |
| Security headers and image input hardening | PR #64 CI passed syntax, dependency audit, route and browser checks | Integrate with the UI candidate, run combined CI, deploy and inspect live response headers |
| AI chat/search/voice/image providers | Existing server routes and local smoke checks | Live provider smoke on the exact release; microphone/speaker/camera check on the actual phone |
| Saved data | Existing local storage contract preserved by design | Verify old saved chats/settings on the actual device and explain browser-local storage clearly |
| General NOVA authentication | Not established for the general assistant | Do not sell as account-based until implemented and tested |
| NOVA Business Intelligence | Separate feature branch with automated DB/RLS and browser tests | Keep out of launch scope until real signup, email invitations, retention, backup/restore, monitoring and privacy review pass |
| Production deployment | Current Production branch remains separate from candidate PRs | Explicit release approval, deploy, verify exact commit and run production smoke tests |

## 8. Recommended first-pilot format

- Start with a small, supervised demonstration using synthetic or non-sensitive sample prompts/files.
- Ask participants to evaluate clarity, usefulness, response quality, and mobile usability.
- Do not upload confidential company, student, employee, financial, or personal data.
- Record issues and user feedback without collecting unnecessary personal information.
- Avoid paid usage or provider commitments until costs and limits have been checked and approved.

## 9. Questions to answer before taking payment or making a delivery promise

1. Which exact features are included in the first offer?
2. What usage limits and provider costs apply?
3. What is the support and incident-response process?
4. What data is stored locally versus sent to AI providers?
5. What happens when a provider is down or rate-limited?
6. What refund, cancellation, and privacy terms will apply?

## 10. Release decision

**Current decision: Not yet production-pitch-ready as a guaranteed, error-free customer product.**

The candidate has successful automated checks, but PR #64 and PR #65 remain separate Draft PRs, live Production checks have not run on their combined code, and physical Android/provider tests remain outstanding. Use this pack only for an honest prototype/demo conversation until those gates are closed.
