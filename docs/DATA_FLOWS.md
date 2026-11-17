# NOVA 2.0 Data Flows

## Build/staging
Browser → staging API → isolated synthetic database (once configured). No production URL, secrets, database or real user records are used.

## Sakha
User input → schema validation → spend/kill-switch guard → provider adapter → response validation → browser. The default adapter is mock/disabled. No uploaded real documents or paid provider calls during this build.

## Diwan
User input/file → explicit consent → MIME/size validation → task parser → untrusted-content boundary → mock/disabled AI adapter → Zod output validation → result/PDF. Original uploads are temporary and require an expiry/deletion worker before public release. Document contents are never logged.

## Wallet
Browser → mock order endpoint → mock provider callback/webhook → HMAC verification and idempotency → append-only ledger. This is simulation only; it cannot contact a real payment provider or move money.

## Data controls
- Cloud sync remains off by default.
- Sensitive fields are optional and not stored unless strictly required.
- Provider retention and region must be disclosed before public document processing.
- Every document flow shows consent and a guidance-not-legal-advice notice.
- Full account deletion/export requires end-to-end proof before release.
