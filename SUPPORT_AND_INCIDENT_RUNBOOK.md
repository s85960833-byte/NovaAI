# NOVA Support and Incident Runbook — Draft

> Internal draft. Assign a responsible adult/operator, verified support contact and escalation owner before accepting customers.

## Required owner decisions

- Support inbox and monitored contact channel: **[OWNER TO COMPLETE]**
- Named incident owner and backup: **[OWNER TO COMPLETE]**
- Support hours and response targets: **[OWNER TO APPROVE]**
- Privacy/data deletion request owner: **[OWNER TO APPROVE]**
- Hosting/Supabase account recovery and billing owner: **[OWNER TO APPROVE]**

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
