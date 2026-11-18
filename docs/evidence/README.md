# NOVA 2.0 Verification Evidence

This directory is populated by the CI workflow on each current pull-request head.

- Test logs: typecheck, lint, formatting, unit tests, i18n, schemes, secret scan, mock evaluations, dependency audit and build.
- Browser logs: Playwright report and `artifacts/frame-time-metrics.json`.
- Database logs: clean migration reset/list, schema/RLS, export/delete isolation, wallet/webhook/spend-cap tests and backup/restore.
- Staging logs: read-only health/home requests and the public `/perf` route HTTP check.

The workflow uploads these files as named GitHub Actions artifacts. They are not treated as committed current-head evidence until the artifact is inspected and the corresponding evidence files are copied here in a follow-up commit. Historical CI #513 evidence is not a substitute for a current-head run.
