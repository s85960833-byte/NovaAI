# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. Its current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

The three-workspace bilingual experience is being prepared on the `pitch-readiness-20261106` branch. It is not the Production release. The Production app is served from:

https://novaai-4auo.onrender.com

Do not merge or deploy feature branches without reviewing the combined changes and receiving release approval.

## Architecture

- Frontend: `index.html` plus modular browser JavaScript.
- Backend: Express server in `nova-server.txt`.
- Runtime: Node.js 22.
- Start command: `node nova-server.txt`.
- Existing chat/settings data uses browser-local storage. Do not describe it as cloud-synced.
- Provider keys belong in server-side environment variables, never in browser code or commits.

## Verification

The integrated release candidate in Draft PR #66 has a successful combined GitHub Actions run (#878), covering syntax, mode registry, the 60-case evaluation fixture, dependency audit, local routes/PWA, security headers, Chromium workspace interactions, five-viewport responsive layout and drawer/settings/sidebar regression tests. The separate candidate PRs also had their own successful runs:
- PR #65: syntax, mode registry, evaluation fixture, dependency audit, local routes/PWA, Chromium workspace interaction checks.
- PR #64: syntax, mode registry, evaluation fixture, dependency audit, local routes/PWA, mobile browser layout/drawer checks.
- PR #46 (separate Business Intelligence candidate): PostgreSQL migration/RLS integration, Deno type-check, Edge Function auth/CORS checks, calculations/CSV validation, and Playwright Company Cloud flow.

These are separate runs; they do not prove the PRs work together or that the exact candidate is live in Production. Live provider and physical Android verification remain separate release gates.

## Honest product limitations

- Provider availability, free-tier quotas, latency, and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login/cloud chat sync is not established by this repository's current production baseline.
- Do not use the separate NOVA Business Intelligence feature branch with sensitive or regulated company data before its documented release gates are completed.
- Automated checks are not a security certification or a guarantee of zero errors.

See [PITCH_READINESS.md](PITCH_READINESS.md) for the approved demo narrative, safe claims, and release checklist.
