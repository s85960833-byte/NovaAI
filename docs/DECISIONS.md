# NOVA 2.0 Decisions

| Date | Decision | Reason / alternatives | Owner approval |
|---|---|---|---|
| 2026-11-17 | Gate 0 passed; all 12 recommended defaults approved. | Owner's explicit approval in chat. | Yes |
| 2026-11-17 | Use a TypeScript modular monolith: Vite/React PWA, Node 22 API, PostgreSQL/Supabase, Drizzle, Zod, Vitest and Playwright. | Lower operational complexity than microservices; matches ADR-001. | Yes |
| 2026-11-17 | Launch scope is Darbar + Sakha + Diwan; other ministers are staged. | Keeps first release focused and preserves legacy access. | Yes |
| 2026-11-17 | Keep NOVA Business Intelligence separate. | Avoids mixing tenant data and release boundaries. | Yes |
| 2026-11-17 | Use free-only isolated staging and synthetic data. | Production remains read-only; no paid resource activation. | Yes |
| 2026-11-17 | Wallet/payment development uses a mock provider and test fixtures only. | No real payment account, real payment, KYC, settlement or money movement. | Yes |
| 2026-11-17 | Scheme data and final UI/icon/Hindi copy remain pending owner review. | Build safe structure and validation; no unreviewed content presented as official. | Pending owner review |
| 2026-11-17 | Do not modify repository settings, `main`, production Render or production Supabase. | Explicit instruction from owner. | Yes |
| 2026-11-17 | Phase 7 is prohibited until exact text `APPROVE RELEASE`. | Release safety rule. | Yes |
