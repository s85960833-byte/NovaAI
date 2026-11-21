# NOVA 2.0 Gate 0 Report

**Date:** 2026-11-17  
**Owner decision:** PASSED — all 12 recommended defaults approved explicitly in chat.

## Evidence table

| Item | Evidence | Result | Notes |
|---|---|---|---|
| Master Prompt scope | `NOVA_2.0_MASTER_PROMPT.md`, sections 5, 7–14 | Reviewed | Launch: Darbar + Sakha + Diwan; staged later ministers |
| GitHub baseline | `s85960833-byte/NovaAI`, `main` SHA `bdbeb20881f9b6cef51ff5a9d8a3b80131079a50` | Read-only inspected | 96 tracked files recorded in Phase 0 pack |
| Runtime | `package.json`, `nova-server.txt`, `index.html` | Verified by source | Node 22, Express 4, `node nova-server.txt` |
| Legacy modes | `mode-registry.js` | Verified by source | 13 modes |
| CI | Actions run `43199071222`; `nova-entry.js`, `scripts/check.mjs` | Fail at audit time | Intro marker migration regression |
| Render production | service `srv-dbidhpc9v7es73d6ia80`; live SHA `c3cee61906b88ff111b3a645db55c9c2503cd8f7` | SHA mismatch | Production not changed |
| Branch protection | settings audit | Off at audit time | Owner requested settings untouched |
| Supabase | project `qrfwsewppafhxibdboam`; 17 migrations; 11 public tables RLS-enabled | Read-only inspected | Three local/remote migration timestamp mismatches |
| Cloud sync | `nova-sync-merge.js`, README | Known risk | Same chat ID can overwrite newer remote state |
| Account deletion | `nova-account.js`, README/privacy draft | NOT VERIFIED | Full Auth + DB + storage deletion not proven |
| Render Free | official docs/pricing | Risk confirmed | Sleep, ephemeral FS, free DB expires and has no backups |
| Supabase Free | Phase 0 research | Risk recorded | Free-tier constraints; recheck before staging creation |
| AI pricing/privacy | provider documentation in `RESEARCH_LOG.md` | Snapshot only | Model prices/policies change; do not activate paid APIs |
| Physical Android | no device run in Phase 0 | NOT VERIFIED | Infinix X6873 Android 16 is primary candidate |
| Real user data/payments | not used | Excluded | No production data, real payments or payment accounts |

## Hindi summary

- Architecture: TypeScript modular monolith — PWA + Node API + PostgreSQL/Supabase + Zod/Drizzle.
- Launch scope: Darbar + Sakha + Diwan; other ministers later.
- Legacy modes are preserved; BI stays separate.
- Main CI failure, production SHA mismatch, migration timestamp mismatches, sync conflict and deletion gaps remain risks to address in the rebuild.
- Free services are staging-only; no production data or secrets.
- Payment features will be mock-only in this build.
- No production resource or setting is authorised for modification.

## Approved decisions

1. Approve ADR-001 architecture.
2. Launch Darbar + Sakha + Diwan.
3. Keep seven Learn modes in Legacy until Guru passes.
4. Keep builder in Legacy until Shilpi passes.
5. Keep BI separate.
6. Use free isolated staging and a separate synthetic test DB.
7. AI provider candidates only; mocks/fixtures until explicit future approval.
8. Pricing placeholders only; no real payment activation.
9. Use owner's Infinix X6873 Android 16 as primary physical test candidate; do not buy devices.
10. Preserve legacy local keys and identity compatibility; cloud sync opt-in.
11. Require CI, migration, sync, deletion/export, security and mobile evidence before release.
12. No production changes before Phase 7; exact `APPROVE RELEASE` required.

## Later blockers

Real-money payment account, KYC, settlement, tax/invoice and SMS sender setup require responsible adult ownership and qualified professional review. Public handling of children's personal data requires qualified privacy/legal review. These do not block mock-only implementation and synthetic testing.

## Verdict

**GATE 0: PASS — owner approval received.**  
**Phase 1 is authorised. Phases 1–6 may proceed on `nova-2.0/rebuild` only. Phase 7 is not authorised.**
