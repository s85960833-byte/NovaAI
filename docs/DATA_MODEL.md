# NOVA 2.0 Data Model

**Status:** Phase 1 design; migrations apply only to an isolated synthetic test database.

## Entities
- users: auth subject, email, display name, language, theme, created/deleted timestamps, legacy identity mapping.
- sessions: user, device hash, created/expiry.
- chats/messages: user-owned conversations and messages; ownership must be enforced in every query.
- files: owner, MIME, size, storage key, consent time, expiry and deletion time; content is never logged.
- wallets: current derived balance; ledger_entries are append-only signed credit deltas.
- payments: mock provider order/payment identifiers, amount in paise, state and event IDs.
- usage_events: feature/model/token units/cost/latency/outcome.
- diwan_jobs: task kind/status, input reference, validated output, PDF reference and expiry.
- schemes: reviewed structured eligibility, official URL, last_verified and status.
- audit_log and feature_flags: sensitive action metadata and controlled rollout.

## Money invariants
1. Ledger entries are immutable; corrections use compensating entries.
2. A wallet balance is the sum of posted ledger deltas and cannot fall below zero.
3. A webhook event ID is processed once; a duplicate is a no-op.
4. Payment amount/currency/order ownership are verified against the server-created mock order.
5. Real gateway credentials and live money movement are disabled.

## Ownership invariants
Every user-owned row has an owner identifier. All reads, writes, exports and deletions must be scoped to the authenticated subject. Staging uses synthetic accounts only.
