# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. The current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

The integrated three-workspace candidate is on `pitch-readiness-20261106` in Draft PR #66. It is not the Production release. The Production app is served from:

https://novaai-4auo.onrender.com

The inspected Production branch head is `48e12a68af656b471853ac2a4509da0e3df7ab24`. No merge or deployment of the candidate was performed during the 6 November 2026 audit.

## Architecture

- Frontend: `index.html` plus modular browser JavaScript.
- Backend: Express server in `nova-server.txt`.
- Runtime: Node.js 22.
- Start command: `node nova-server.txt`.
- Existing chat/settings data uses browser-local storage. Do not describe it as cloud-synced.
- Provider keys belong in server-side environment variables, never in browser code or commits.

## Verification — integrated three-workspace candidate

The application code snapshot is `344f46ad4b4b08fae035adf0a52a5049548cf58f`; the documentation-integrated branch head is `d3c2ad6a45b6442bfc71363e942b3269c6874200`. Its latest GitHub Actions run, [#896](https://github.com/s85960833-byte/NovaAI/actions/runs/42226220598), passed the verification job. Checks included:

- Backend/frontend syntax and isolated mode registry.
- 60-case AI evaluation fixture structure (not a live model accuracy score).
- Production dependency vulnerability audit.
- Local server routes, PWA assets, and local security-header assertions.
- Chromium workspace interaction tests.
- Responsive layout, drawer, Settings, and sidebar checks at 360, 390, 412, 760, and 1280 CSS-pixel widths.
- Devanagari font installation and browser screenshot artifact upload.

CI #894 **skipped** live provider and free-provider image-generation smoke tests by design. A separate read-only Render audit confirmed Production is live on commit `48e12a68af656b471853ac2a4509da0e3df7ab24`; the Draft candidate is not deployed. Physical Android testing was not performed. These checks do not prove that the candidate is error-free.

## Separate NOVA Business Intelligence candidate

NOVA BI is a separate Draft PR #46 and is not part of the three-workspace release candidate. Its latest branch head is `c64887340cebf4f0ca18d6f83ca300e2cd3d0c19`; push-triggered [CI #887](https://github.com/s85960833-byte/NovaAI/actions/runs/42222549923) passed PostgreSQL migration/RLS integration, Deno type-check, deployed Edge Function auth/CORS checks, calculation/CSV tests and the Company Cloud mobile browser flow. PR #46 remains non-mergeable (196 commits ahead / 18 behind the inspected main head). Keep BI separate until merge conflicts, real-account/email tests, retention/backup, privacy and device checks are closed.

The NOVA BI Supabase project has 12 migrations, 10 RLS-enabled tables, and an ACTIVE JWT-protected Edge Function v13. The latest Security and Health Advisors reported zero findings. Performance Advisor reported 13 unused-index INFO notices. Auth user, organization, and membership counts are currently zero. These database checks are not an enterprise certification or a public-launch approval.

## Honest product limitations

- Provider availability, free-tier quotas, latency, and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login and cloud chat sync are not established by the current Production baseline.
- Do not use the separate NOVA BI feature branch with sensitive or regulated company data before its release gates are complete.
- Automated checks are not a security certification or a guarantee of zero errors.

See [PITCH_READINESS.md](PITCH_READINESS.md) for the current pitch scope, verified evidence, safe claims, and remaining release gates. See [PITCH_SCRIPT.md](PITCH_SCRIPT.md) for the short pitch and demo flow.
