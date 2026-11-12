# NOVA AI — Transfer Pack (Draft)

**Status:** Preparation checklist only. Not legal advice, not an offer to sell, and not evidence that all assets are currently transferable. Any ownership, contract, payment, account-control or IP assignment step must be handled by a responsible adult and qualified legal counsel.

## 1. Asset inventory to verify before any handover

| Asset | Current known location | Evidence / status |
|---|---|---|
| Source repository | https://github.com/s85960833-byte/NovaAI | Existing repository; confirm owner/admin rights and branch protections in GitHub. |
| Production hosting | https://dashboard.render.com/web/srv-dbidhpc9v7es73d6ia80 | Existing Production service; verify account ownership, team permissions and billing. |
| Production app | https://novaai-4auo.onrender.com | Existing URL; current Production release must remain protected during review. |
| Staging hosting | https://dashboard.render.com/web/srv-dbqm035g1s2s73eogao0 | Free staging service; not current PR head at last verification. |
| Database/Auth | Supabase project referenced by repository configuration | Project ID, owner, region, plan, backups and transferability must be confirmed by the account owner. |
| Domain/DNS | No custom domain verified in this review | No domain ownership claim. |
| Email, analytics, payments | No production provider verified | Do not claim configured or transferable. |
| Third-party AI/search providers | Names and environment-variable keys are documented in `.env.example` | Provider contracts, account ownership, commercial use and assignment terms must be individually verified. |

## 2. Before any transfer

- Freeze releases and create a dated rollback tag after the final approved release; record the exact commit and deployment IDs.
- Export the repository, issues, pull requests, release history and CI artifacts.
- Generate a dependency SBOM and a complete source, asset, font, icon, model and dataset provenance inventory.
- Export database schema and data using the provider-supported backup process; encrypt the export and verify a restore in an isolated environment.
- Inventory environment-variable **names only**. Never put secret values in this document, an email, a data room, or Git.
- List all external accounts, owners, billing plans, regions, data processors, contractual restrictions, renewal dates and transfer rules.
- Identify all contributors and obtain appropriate written IP assignments/licences reviewed by counsel. Do not assume a GitHub commit alone proves copyright ownership.
- Review user-data deletion, consent, retention, processor notices, and any data that must not be transferred.
- Have a qualified adult and lawyer review the proposed transaction, privacy implications, IP chain of title, tax and applicable Indian law.

## 3. One-day handover sequence (only after legal approval)

1. **Repository:** buyer creates/identifies its organization; transfer the repository using GitHub's supported ownership-transfer workflow; verify default branch, tags, issues, actions, secrets, deploy keys, branch protections and webhook destinations.
2. **Hosting:** buyer creates or accepts the relevant Render team/service ownership using Render's supported team/service process; verify service region, instance plan, health check, environment variables, custom domains and deployment permissions. Do not transfer passwords.
3. **Database/Auth:** buyer accepts the Supabase project through supported organization ownership controls, or provision a new project and restore a verified backup. Rotate all database, service-role, JWT, SMTP and storage credentials.
4. **Domain/DNS:** if a verified domain exists, transfer registrar ownership using its official process, then update DNS and validate TLS, redirects and email records. No custom domain is currently evidenced.
5. **Third-party providers:** each provider account must be transferred or recreated only where its current contract permits. Otherwise the buyer must supply its own account and keys. Re-check API rights, quotas, privacy terms and billing.
6. **Secrets:** buyer generates new credentials and enters them directly into the buyer-controlled secret manager. Revoke old tokens, OAuth grants, webhooks, deploy keys and personal access tokens after cutover.
7. **Verification:** run CI, staging smoke tests, database restore tests, auth/RLS checks, browser/mobile tests and production health checks. Record evidence and rollback procedure.
8. **Acceptance:** both parties' authorized adult representatives sign a counsel-reviewed asset schedule, IP schedule, data-processing schedule and acceptance record.

## 4. Environment-variable inventory

See `.env.example` for the current variable-name list. It is a template, not proof every integration is configured. Values must be generated and stored by the receiving operator. No secret values belong in the Data Room.

## 5. Rollback and continuity

- Keep the previous known-good Production commit and deployment available until acceptance.
- Record database backup timestamps and tested restore instructions.
- Preserve DNS TTL and a rollback window before changing domains.
- Keep incident contacts and support obligations explicit in the transaction documents.
- Never delete the source account, database or prior backups until the buyer verifies access and restoration.

## 6. Current handover blockers

- No verified custom domain, payment account, email delivery provider or analytics account in this review.
- Full license and asset provenance audit is incomplete.
- Supabase backup/restore and account deletion/retention are not verified end-to-end.
- Staging does not yet run the latest PR revision; Health Check Path remains blank.
- Commercial provider rights and account-transfer terms remain unverified.
- No signed contributor IP-assignment schedule or legal review is available.
