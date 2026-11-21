# Incident Runbook

1. Disable the affected feature with the staging kill switch.
2. Preserve non-sensitive technical logs and request IDs; never copy document contents or secrets into logs.
3. Determine affected synthetic accounts, routes and commits.
4. Rotate any exposed staging credential through its owner dashboard; do not paste secrets into chat or source.
5. Patch the root cause and add a regression test.
6. Re-run CI, security checks and staging smoke tests.
7. Record impact, timeline, evidence and owner action required.
8. If a real personal-data incident is ever suspected, stop processing and refer to the responsible adult and qualified privacy/legal professional. No public data processing is authorised by this build.
