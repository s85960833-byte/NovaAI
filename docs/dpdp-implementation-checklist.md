# NOVA AI — India Privacy / DPDP Implementation Checklist

> Draft engineering checklist only. This is not legal advice, a compliance certificate or a determination that NOVA is compliant. The data fiduciary/operator and qualified Indian privacy counsel must confirm applicability, notices, age handling, lawful basis, roles and operational duties before release.

## Product and data map

- [ ] Identify the legal entity/person operating NOVA, its contact address and privacy/grievance contact.
- [ ] Map data by feature: local browser chats, optional Supabase cloud-sync chats, Auth email/session data, Company Cloud organization/membership/dataset metadata, uploaded files, image/audio prompts, provider request content, logs, backups and analytics.
- [ ] Document purpose, lawful basis/consent flow, collection point, destination, processor, region, access roles and retention/deletion procedure for every category.
- [ ] Separate optional cloud sync from local storage; keep sync opt-in and explain that disabling sync does not erase an existing cloud copy.
- [ ] Record AI/search/image/speech vendors, subprocessors, storage/retention/training terms and transfer locations. Disable any provider whose terms or rights are unverified.

## Notice, consent and user controls

- [ ] Publish a plain-language privacy notice in supported languages, identifying the operator and contact.
- [ ] Explain data types, purposes, recipients/processors, cross-border processing, retention, grievance/contact channels and user-request process.
- [ ] Capture a purpose-specific, affirmative cloud-sync opt-in and make withdrawal practical.
- [ ] Provide tested access/correction/erasure and grievance workflows with accountable owners and response tracking.
- [ ] Define how children/minors are handled, including age assurance, parental consent where required and restrictions on tracking/targeted advertising. Do not assume an age rule without counsel's review.
- [ ] Do not promise provider-side or backup deletion without contractual and technical evidence.

## Security and operations

- [ ] Apply least-privilege access, server-only secrets, RLS, secure transport, request limits, audit trails and incident monitoring.
- [ ] Review vendor contracts and processor instructions; maintain a subprocessor register.
- [ ] Define breach response, escalation contacts, evidence preservation, notification assessment and a tabletop exercise.
- [ ] Test encrypted backup restore, deletion tombstones and rollback in an isolated project.
- [ ] Create an operator- and counsel-approved retention schedule.
- [ ] Perform a documented risk assessment before processing sensitive/company/employee/student information.
- [ ] Keep evidence of policy versions, consent flows, security tests, access reviews, deletion requests and incidents.

## Release evidence required

| Evidence | Owner | Status |
|---|---|---|
| Approved legal identity and contact | Operator / counsel | UNVERIFIED |
| Approved privacy notice and terms | Counsel | UNVERIFIED |
| Data inventory and vendor/transfer register | Engineering / operator | UNVERIFIED |
| Age and parental-consent decision | Counsel / operator | UNVERIFIED |
| Retention and deletion workflow | Operator / counsel / engineering | UNVERIFIED |
| Incident and grievance process | Operator | UNVERIFIED |
| Backup-restore and deletion-tombstone test | Engineering / operator | UNVERIFIED |

