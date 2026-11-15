# NOVA Support and Incident Runbook — Draft

 > Internal draft. This runbook is not an operational support service. A responsible adult/operator, verified support contact and escalation owner must be established before any customer onboarding.

## Required owner decisions

- Support inbox and monitored contact channel: **Not configured. No customer onboarding.**
- Named incident owner and backup: **Not assigned. A responsible adult operator must be named before onboarding.**
- Support hours and response targets: **Not approved. Do not promise a response SLA.**
- Privacy/data deletion request owner: **Not assigned. Do not collect customer personal data until the process is staffed and tested.**
- Hosting/Supabase account recovery and billing owner: **Not verified. Account ownership and recovery must be checked by the responsible adult operator.**

## Before each preview

1. Confirm the app and /health are responding.
2. Use synthetic, non-sensitive sample data only.
3. Explain provider quota and accuracy limits.
4. Do not collect payment or promise an SLA.
5. Record feedback only with the participant's consent.

## Incident handling

1. Record time, affected feature, visible error and deployment commit.
2. Stop the affected workflow if data exposure or unauthorized access is suspected.
3. Preserve relevant operational logs without copying passwords, API keys or customer content into tickets.
4. Notify the named incident owner and hosting/database operator.
5. Rotate exposed credentials using the provider's approved process; do not paste secrets into chat or Git.
6. Confirm containment, fix and regression tests before reopening the feature.
7. Assess notification duties with qualified legal/privacy support.

## Launch blockers

Do not accept confidential company data until tenant isolation, retention/deletion, backups/restore, support ownership and incident procedures are verified.
