# Payment and Wallet — Mock-Only Design

## Current implementation
- Wallet ledger is append-only in the mock provider adapter.
- Mock order creation records an amount in paise and synthetic credits.
- Webhook signature verification uses HMAC-SHA256 and constant-time comparison.
- Duplicate event IDs are no-ops.
- Capture, failure, spend and refund paths are unit-tested.
- A refund is a compensating ledger row; ledger rows are never edited or deleted.
- The staging UI simulates capture/refund entirely inside the mock API. It never opens a checkout page or contacts a payment network.

## Razorpay test-mode design (not connected)
A future test-only adapter may map a provider test order/payment event into the same validated internal event contract. The server must verify the provider signature against the exact raw request body, fetch/verify the order amount and currency, enforce order ownership, deduplicate provider event IDs, and append a ledger entry in one database transaction. The client must never choose the amount or credit count. Test and live credentials must be separate.

## Hard boundary
No Razorpay account has been created or activated. No live key, real checkout, payment capture, payout, bank settlement or money movement is enabled. Do not add payment credentials or switch to a live provider during Phases 1–6. Any real-money operations, provider account ownership, refunds, taxes, consumer disclosures and financial compliance require responsible-adult ownership and qualified professional review.
