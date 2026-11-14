# India Privacy & DPDP Readiness Review — NOVA

**Review date:** 12 November 2026  
**Product:** NOVA AI  
**Scope:** Preliminary product/data-flow review against official Indian DPDP Act commencement notifications and DPDP Rules, 2025.  
**Status:** NOT LEGAL ADVICE; NOT A COMPLIANCE CERTIFICATION. Qualified Indian privacy counsel must review the actual processing, operator identity, user age profile, contracts and final notices before public customer onboarding.

## 1. Official phased commencement — important dates

The commencement notification G.S.R. 843(E) is dated 13 November 2025 (Gazette issue No. 757).

- From publication: the provisions listed in paragraph (a) came into force.
- One year from publication: section 6(9) and section 27(1)(d) are scheduled to commence on **13 November 2026**.
- Eighteen months from publication: sections 3–5, section 6(1)–(8) and (10), sections 7–10, 11–17, 27 except clause (d) of sub-section (1), sections 28–34, 36–37 and section 44(2) are scheduled to commence on **13 May 2027**.

Official source: https://egazette.gov.in/WriteReadData/2025/267647.pdf

The DPDP Rules, 2025, G.S.R. 846(E), are dated 13 November 2025 (Gazette issue No. 760):

- Rules 1, 2 and 17–21 commenced on publication.
- Rule 4 is scheduled one year after publication: **13 November 2026**.
- Rules 3, 5–16, 22 and 23 are scheduled eighteen months after publication: **13 May 2027**.

Official sources:
- https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- MeitY's official DPDP Rules page (also lists a 16 December 2025 corrigendum): https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa

Do not describe every substantive obligation as already commenced on 12 November 2026. Build now for the published future commencement dates and obtain legal advice on any other laws or obligations already applicable.

## 2. Current NOVA data flows found in code and drafts

- Local browser chat history and local preferences.
- Optional Supabase Auth account and session.
- Optional cloud sync, OFF by default, stores up to 40 chats (up to 150 messages each), extracted document text, saved memory and custom instructions. Images themselves are excluded. RLS is enabled for per-user access.
- Company Cloud preview: organization membership, dataset metadata, analyses, workflow proposals, invitations, approvals/audit events and branding.
- Chat, files, image prompts, audio and transcription may be sent through NOVA backend to configured AI/search/image/speech providers.
- Hosting and third-party services process technical request information.
- Current draft identifies Render in Singapore and Supabase in Ireland; verify exact project/service regions and every provider's processing location in the account dashboards/contracts.

## 3. Known gaps before customer onboarding

1. **No self-service account deletion.** The existing “Delete cloud backup” removes the workspace snapshot, not the Supabase Auth account or all related provider/backup/log copies.
2. **No published retention schedule.** Do not invent a fixed deletion deadline until logs, backups, provider retention and legal retention obligations are mapped.
3. **No final standalone privacy notice.** Existing notice is explicitly a draft and lacks operator legal identity, verified privacy/support contact, postal address, effective date, final subprocessors and response process.
4. **No complete consent/rights workflow.** Cloud sync opt-in is explicit, but there is no complete published process for access, correction, erasure, grievance and consent withdrawal across all data categories.
5. **Children's data.** The Act's sections 9 and associated Rules 10–11 are in the eighteen-month commencement group. NOVA must decide its intended age range and build a legally reviewed age/parental-consent policy before allowing child accounts or processing children's personal data. Do not assume a simple checkbox is verifiable parental consent.
6. **Processor/vendor contracts.** No complete data-processing agreement, subprocessor inventory, breach notification SLA, deletion assurance or cross-border review was available in this audit.
7. **Breach response.** Runbook is a draft; incident roles, evidence preservation, user communications, Board notification process and time limits need legal/operational approval.
8. **Data minimisation.** Cloud sync currently includes extracted document text, memory and custom instructions. Review whether each field is necessary, provide field-level controls and consider shorter retention.
9. **Company Cloud.** Do not accept real employee, customer, student, health, financial or confidential business records until tenancy, deletion, backups, access logs and contracts have passed live security review.
10. **AI provider forwarding.** The UI must clearly explain when prompts, files, images or audio are sent to third-party processors, and provide feature-level choice where practicable.

## 4. Minimum engineering work to prepare

- Implement authenticated account deletion that removes the Auth user and associated NOVA data, with a documented cascade/deletion verification procedure.
- Create a data inventory with purpose, fields, system, region, processor, retention, access and deletion method.
- Create user rights request handling with identity verification, request tracking and response ownership.
- Add an explicit, granular notice before enabling optional cloud sync and external file/audio processing; store consent version/time and withdrawal.
- Implement a retention and purge policy for application logs, image jobs, temporary files, database backups and vendor copies.
- Add a documented incident response process and test a tabletop scenario.
- Review all cross-border transfers and vendor DPAs.
- Keep privacy notice and terms versioned; record acceptance only when the final documents are approved.
- Provide a guardian/parent flow if the product is intended for users under 18, as determined by counsel.

## 5. Owner/legal evidence required

- Correct legal operator (person/entity) and contact address.
- Verified support/privacy email and monitored grievance process.
- Target audience and age policy.
- Approved purposes and data minimisation decisions.
- Approved retention periods and deletion exceptions.
- Processor/subprocessor list and contract/DPA copies.
- Region and cross-border transfer assessment.
- IP assignment/contractor ownership documents.
- Qualified Indian legal review of final Privacy Notice, Terms, consent UI, children policy and grievance workflow.

## 6. Release decision

**Do not launch paid subscriptions or onboard customer/confidential data yet.** The current privacy and terms documents remain drafts. The existence of a phased commencement schedule does not remove the need to prepare before the relevant provisions take effect, nor does it certify compliance with other applicable laws.

## 7. Evidence references

- G.S.R. 843(E), DPDP Act commencement: https://egazette.gov.in/WriteReadData/2025/267647.pdf
- G.S.R. 846(E), DPDP Rules: https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- MeitY official DPDP Rules listing and corrigendum: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
- MeitY explanatory note (helpful summary, not the Rules themselves): https://www.meity.gov.in/writereaddata/files/Explanatory-Note-DPDP-Rules-2025.pdf


## Live account-deletion foreign-key finding — 12 November 2026

A read-only catalog query on project `qrfwsewppafhxibdboam` found eight public-table foreign keys to `auth.users(id)`: six RESTRICT, one SET NULL and one CASCADE. RESTRICT covers NOVA BI analyses, datasets, memberships, organisation creators, workflow approvals and proposals. The only CASCADE is the optional `nova_user_workspaces` row; the audit-event actor uses SET NULL.

The account UI's **Delete cloud backup** action deletes only the optional workspace snapshot. It does not delete the Auth identity or BI tenant data. A generic Auth-delete call can fail while RESTRICT relationships remain; cascading organisation deletion could destroy other members' information. A complete safe deletion workflow, session revocation, ownership transfer, audit treatment, Storage deletion and retention policy are **not implemented or verified**. See [ACCOUNT_DELETION_REVIEW.md](ACCOUNT_DELETION_REVIEW.md). Do not claim full deletion or onboard confidential/customer data.


## 8. Date-sensitive commencement check — 12 November 2026

This review is dated **12 November 2026**. The following provisions are therefore scheduled for the next day, not treated in this review as already commenced:

- DPDP Act section 6(9) and section 27(1)(d): scheduled for **13 November 2026** under G.S.R. 843(E).
- DPDP Rules rule 4: scheduled for **13 November 2026** under G.S.R. 846(E).

The main eighteen-month group is scheduled for **13 May 2027**. In particular, Act section 9 (children's personal data) is in the sections 7–10 group, and Rules 10–11 (verifiable parental consent) are in the rules 5–16 group. They should be treated as near-term product-readiness requirements, not as a reason to collect children's data before the required safeguards exist.

MeitY's official listing records a corrigendum to the 2025 Rules published on 16 December 2025. Read the corrected Rules together with the original G.S.R. 846(E); do not rely on an uncorrected copy for detailed clause wording. The corrigendum's listed corrections include wording in rule 1's commencement paragraph; they do not change the one-year / eighteen-month phased schedule.

Official source links:
- [G.S.R. 843(E) — DPDP Act commencement notification, 13 November 2025](https://egazette.gov.in/WriteReadData/2025/267647.pdf)
- [G.S.R. 846(E) — DPDP Rules, 13 November 2025](https://egazette.gov.in/WriteReadData/2025/267650.pdf)
- [MeitY official DPDP Rules page, including the corrigendum listing published 16 December 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa)

This timing note is a statutory commencement summary, not an opinion on whether NOVA is a Data Fiduciary, Significant Data Fiduciary, processor, Consent Manager or otherwise subject to a particular duty. That classification depends on actual product operations, contracts, purposes and scale and must be confirmed by qualified Indian privacy counsel. Other applicable Indian laws and platform/provider contracts may apply independently.
