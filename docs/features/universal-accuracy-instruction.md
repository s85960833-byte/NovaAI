# Feature Brief — Universal Accuracy Instruction (always on)

**Reviewed:** 14 November 2026 (Asia/Kolkata)  
**Status:** BUILT; live model behavior not yet VERIFIED  
**Primary files:** nova-app.js, index.html, scripts/accuracy-instruction.test.cjs

## Goal and user story
Every Nova chat system prompt must include the Universal Accuracy Rules, even when an older local profile contains an opt-out. The interface shows this safeguard as always-on and read-only.

## Research and source review
- **VERIFIED — 14 Nov 2026:** Source inspection found ACC in nova-app.js, but ACCP appended it only when S.acc !== false.
- **VERIFIED — 14 Nov 2026:** The top-bar control and Settings checkbox previously allowed users to switch it off; an old localStorage value could preserve that choice.
- **VERIFIED — 14 Nov 2026:** The prompt is assembled by the existing client before sending it to the configured model. This patch adds no dependency, endpoint or telemetry.
- **UNKNOWN:** Incremental token cost and answer-quality impact depend on a live provider/model. Staging has no approved provider configured.
- **UNKNOWN:** A system prompt does not guarantee factual correctness; evidence retrieval, deterministic tools and model evaluations remain separate controls.
- **Device review:** No hardware or device APIs are added. CI cannot replace physical Android verification.

## Chosen approach
- Include ACC unconditionally inside ACCP.
- Migrate legacy S.acc=false to true and persist the correction.
- Keep the top-bar and Settings controls as accessible, checked, disabled indicators.
- Preserve the separate optional S.ult extended-history preference.
- Add 9 automated source-contract tests and wire them into Main CI.

## Rejected alternatives
- User toggle: conflicts with the explicit always-on requirement.
- Admin kill-switch: would allow disabling a required invariant.
- Prompt analytics: no analytics backend is configured; no prompt or personal data is collected by this patch.

## Privacy, security and cost
- No additional personal data is collected or transmitted.
- No dependency or API route is added.
- The prompt continues to be sent to the configured AI provider; vendor retention/data terms still require review.
- Incremental token cost remains UNKNOWN until measured.
- The prompt is not a guarantee of factual accuracy.

## Acceptance criteria
1. ACC is in every chat system prompt.
2. Legacy acc:false migrates to true.
3. Neither accuracy control can be toggled.
4. English and Hindi labels say always-on.
5. Extended-history preference remains independent.
6. Nine contract tests pass.
7. No new analytics endpoint is used.

## Test plan
Run `npm run test:accuracy-instruction`, Main CI and Browser CI. Exercise a fresh profile and a profile with acc:false. Verify both UI languages and both light/dark themes; physical Android visual verification remains an owner/device test.

## Rollback
Revert the source commit only after a product decision changes the always-on requirement. Do not restore a user off-switch while this requirement remains in force.

## Feature Definition of Done
**Not met.** Live model answer, measured token cost, answer-quality score, live bilingual output, visual Android confirmation and production rollout remain outstanding.
