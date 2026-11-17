# NOVA 2.0 Build State

**Updated:** 2026-11-17 15:32 UTC  
**Branch:** `nova-2.0/rebuild`  
**Current phase:** Phase 1 — Foundation / CI repair and staging bootstrap

## Completed and evidenced
- Gate 0 passed by explicit owner approval of all 12 defaults.
- Rebuild branch exists; read the latest branch SHA from GitHub before each continuation.
- Phase 0 pack is represented in `docs/`: AUDIT, RESEARCH_LOG, PARITY_MATRIX, RISK_REGISTER, MODEL_COST_COMPARISON, ADR-001 and GATE_0_REPORT.
- Phase 1 TypeScript workspace, API, web app, schema, local Supabase CLI config, tests, eval fixtures, runbooks and docs exist on the rebuild branch.
- 30 synthetic eval cases exist for each Diwan task (Paper Reader, Scam Check, RTI, Complaint, Schemes), in Hindi, English and Hinglish.
- Wallet provider is mock-only; no real payment provider is connected.
- A free Render staging service and free Render Postgres instance were created. First service build failed because Render omitted devDependencies while `prepare` invoked `simple-git-hooks`; corrected service build command is required.
- Latest Render build for exact head `067ac2fca212ed638924bdbc63796bea84c7f007` succeeded; npm install reported 0 vulnerabilities. Deployment is still in progress pending staging migration/startup and health verification.
- The prior deploy at `a8c460650a15b8fdfe5fb0c38a1b02ead39f424b` built but failed startup with PostgreSQL syntax error `42601` at an invalid single-dollar `DO # NOVA 2.0 Build State

**Updated:** 2026-11-17 15:32 UTC  
**Branch:** `nova-2.0/rebuild`  
**Current phase:** Phase 1 — Foundation / CI repair and staging bootstrap

## Completed and evidenced
- Gate 0 passed by explicit owner approval of all 12 defaults.
- Rebuild branch exists; read the latest branch SHA from GitHub before each continuation.
- Phase 0 pack is represented in `docs/`: AUDIT, RESEARCH_LOG, PARITY_MATRIX, RISK_REGISTER, MODEL_COST_COMPARISON, ADR-001 and GATE_0_REPORT.
- Phase 1 TypeScript workspace, API, web app, schema, local Supabase CLI config, tests, eval fixtures, runbooks and docs exist on the rebuild branch.
- 30 synthetic eval cases exist for each Diwan task (Paper Reader, Scam Check, RTI, Complaint, Schemes), in Hindi, English and Hinglish.
- Wallet provider is mock-only; no real payment provider is connected.
- A free Render staging service and free Render Postgres instance were created. First service build failed because Render omitted devDependencies while `prepare` invoked `simple-git-hooks`; corrected service build command is required.
 block. The current branch migration was corrected; the new deployment is testing that correction.
- GitHub Actions runs #44109011781 (NOVA 2.0 CI), #44109011798 (account/browser), and #44109011814 (legacy NovaAI verification) returned `action_required` with no jobs exposed. No green CI claim is made.

## Gates
- Gate 0: PASS.
- Gate 1: IN PROGRESS — Render build passes; startup/health and green CI still pending.
- Gate 2: NOT STARTED — visual approval and measured performance not yet evidenced.
- Gate 3: NOT STARTED — Sakha parity is incomplete; live providers unavailable.
- Gate 4: IN PROGRESS — mock wallet code/tests present; durable hosted ledger and complete webhook timing cases need verification.
- Gate 5: IN PROGRESS — Diwan mock forms/rules exist; OCR/PDF export/voice and official dataset remain incomplete.
- Gate 6: NOT STARTED — security/load/restore/mobile audit not yet evidenced.

## Hard boundaries
- `main`, NOVA 1.0, production Render, production environment variables, production Supabase and real user data remain read-only.
- No paid resources or provider calls; no real payment account, KYC, settlement or money movement.
- Synthetic data only. No real documents sent to providers.
- Phase 7 remains prohibited until exact text `APPROVE RELEASE`.

## Known blockers / NOT VERIFIED
- CI final run pending after lint fixes.
- Staging build failed on initial service because devDependencies were omitted; corrected staging build still needed.
- Hosted Supabase project not created. Local synthetic Supabase CI is the free fallback; hosted project creation requires an explicit organisation choice in the dashboard.
- Real AI model evals are not run; no staging API key.
- 120 Hz physical frame timing and Infinix phone checks are NOT VERIFIED.
- Full Sakha parity, voice, web citations, image generation, real auth, account export/deletion and full document OCR/PDF output remain incomplete.
- Load test, backup/restore drill, full security audit and Gate 6 numbers remain open.

## Latest measured build evidence
- Exact candidate SHA: `067ac2fca212ed638924bdbc63796bea84c7f007`.
- Render build: PASS; npm audit during install: 0 vulnerabilities.
- Web bundle: JS 203.97 kB (65.76 kB gzip); CSS 15.83 kB (3.94 kB gzip).
- Render deploy `dep-dbu755jrjlhs73af3fog`: build succeeded; deployment/startup was still in progress at 15:32 UTC. No health check is counted yet.

## NEXT ACTION
Verify deployment completion, `/api/health`, deployed SHA and synthetic Sakha/Diwan/mock-wallet API flows. Then rerun/obtain green CI evidence; action_required currently has no exposed jobs.
