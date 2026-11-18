# NOVA 2.0 — Owner actions

These are the only actions reserved for the owner or a qualified reviewer. None authorises release by itself.

## REQUIRED BEFORE RELEASE

1. **Physical Android acceptance (about 5 minutes).**
   - Open https://nova-2-staging.onrender.com on the target Android phone.
   - Complete the 10 synthetic-only steps in `docs/PHONE_TEST.md`.
   - Open /perf, capture the one-screen result and attach the screenshot plus phone/browser version to PR #103.
   - Do not upload real IDs, statements or private documents.

2. **Choose an isolated hosted staging identity project (about 2 minutes plus setup).**
   - Select/create a separate Free Supabase project for NOVA 2.0 staging; never use production project `qrfwsewppafhxibdboam`.
   - Configure only that project's Auth/Storage URL and keys in Render staging secrets. Never paste secrets into chat, GitHub files or logs.
   - Run hosted synthetic export/download, account deletion and object-storage erasure tests. Until this is evidenced, hosted account lifecycle remains NOT VERIFIED.

3. **Visual, language, price and scheme review (about 5 minutes).**
   - Review Midnight/Ivory identity and Hindi/English labels using staging.
   - Confirm price placeholders are design-only, or provide approved public price decisions.
   - Keep `data/schemes/approved.json` empty unless every record has a current primary government source, eligibility evidence and last-verified date.

4. **Privacy and legal review (professional review required).**
   - Have a qualified Indian privacy/legal professional review DPDP/children's data, privacy notice, terms, grievance contact and consumer disclosures.
   - Record their written findings before public release.

5. **Repository protection (about 2 minutes).**
   - In GitHub Settings → Branches, protect `main`: require pull requests, require the final CI checks, and block force pushes and branch deletion.
   - This repository's `main` protection was observed disabled; no setting has been changed here.

6. **Production rollback readiness (owner-operated; NOT VERIFIED).**
   - Follow the production-only dashboard instructions in `docs/runbooks/rollback.md`.
   - Record the prior production deploy SHA and confirm the owner/operator can perform and verify a rollback. Do not execute a production rollback during this staging task.

7. **Release gate (only when all required reviews are complete).**
   - Review PR #103, current-head evidence, unresolved risks and the release checklist.
   - Phase 7 remains locked until you type exactly `APPROVE RELEASE`.

## OPTIONAL / LATER

- **Free live-AI provider key and model evaluation.** Mock mode is the default and is sufficient for staging checks. Add a provider only when a genuinely free quota is confirmed; keep the kill switch enabled until reviewed.
- **Additional ministers, integrations and expanded marketing.** These are post-MVP work and are not release prerequisites for the current Darbar/Sakha/Diwan scope.
