# NOVA 2.0 Build State

**Updated:** 2026-11-17  
**Branch:** `nova-2.0/rebuild`  
**Base:** `main` (Gate 0 baseline SHA recorded in Phase 0 report)  
**Current phase:** Phase 1 — Foundation

## Completed
- Gate 0 approved by owner (all 12 defaults).
- Rebuild branch created from `main`.
- Plain-language audit and research log drafted.
- Phase 0 document set being copied into `docs/`.

## Gates
- Gate 0: PASS (owner approval received).
- Gate 1: NOT YET PASSED.
- Gates 2–6: NOT STARTED.

## Hard boundaries
- Never modify `main`, repository settings, production Render, production environment variables or production Supabase.
- Never use production secrets or real user data.
- Free resources only; no paid activation.
- Synthetic data only.
- Mock payment provider only; no real payment account, payment, KYC or settlement.
- Never start Phase 7 without exact owner message `APPROVE RELEASE`.

## Current blockers / NOT VERIFIED
- A separate Supabase test project requires owner-created credentials; do not reuse production credentials.
- Physical Infinix Android 16 and real 120 Hz device tests are NOT VERIFIED.
- Render staging URL is not yet created.
- Current exact research on cybercrime helpline, RTI fee/state rules, OTP provider, model costs/privacy and iOS/TWA remains open.

## NEXT ACTION
Create the modular-monolith foundation and CI on this branch, then run CI and resolve failures before building the UI shell.

## Evidence rule
Only record a test as PASS when its command or hosted result has actually been run and inspected. Emulated frame metrics must be labelled emulated.
