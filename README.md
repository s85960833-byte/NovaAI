# NOVA AI

NOVA is an India-oriented, Hindi-and-English AI web application. The current product direction organizes work into three workspaces:

- **NOVA Learn** — study and learning workflows.
- **NOVA Build** — digital creation workflows.
- **NOVA Agents** — everyday assistant and agent workflows.

## Project status

The unified NOVA candidate (three-workspace UI + Business Intelligence) is on `feature/nova-integrated-release-20261106` in Draft PR #73. It is not the Production release. The Production app is served from:

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

The unified application, UI and BI documentation are maintained on Draft PR #73. Its combined CI is running; see the PR for the latest exact-head status. Checks included:

- Backend/frontend syntax and isolated mode registry.
- 60-case AI evaluation fixture structure (not a live model accuracy score).
- Production dependency vulnerability audit.
- Local server routes, PWA assets, and local security-header assertions.
- Chromium workspace interaction tests.
- Responsive layout, drawer, Settings, and sidebar checks at 360, 390, 412, 760, and 1280 CSS-pixel widths.
- Devanagari font installation and browser screenshot artifact upload.

CI #894 **skipped** live provider and free-provider image-generation smoke tests by design. A separate read-only Render audit confirmed Production is live on commit `48e12a68af656b471853ac2a4509da0e3df7ab24`; the Draft candidate is not deployed. Physical Android testing was not performed. These checks do not prove that the candidate is error-free.

## NOVA Business Intelligence in the unified candidate

NOVA BI is included in unified Draft PR #73. It remains unlaunched and must not be used with sensitive company data until real-account, privacy, retention and backup/restore gates are completed. BI-only PR #67 is a predecessor; PR #46 is an older divergent branch. The unified PR #73 CI is the authoritative verification for the combined candidate.

The NOVA BI Supabase project has 12 migrations, 10 RLS-enabled tables, and an ACTIVE JWT-protected Edge Function v13. The latest Security and Health Advisors reported zero findings. Performance Advisor reported 13 unused-index INFO notices. Auth user, organization, and membership counts are currently zero. These database checks are not an enterprise certification or a public-launch approval.

## Honest product limitations

- Provider availability, free-tier quotas, latency, and output quality can vary.
- Browser-local saved chats can be lost if site data is cleared.
- General NOVA account login and cloud chat sync are not established by the current Production baseline.
- Do not use NOVA BI with sensitive or regulated company data before its release gates are complete.
- Automated checks are not a security certification or a guarantee of zero errors.

See [PITCH_READINESS.md](PITCH_READINESS.md) for the current pitch scope, verified evidence, safe claims, and remaining release gates. See [PITCH_SCRIPT.md](PITCH_SCRIPT.md) for the short pitch and demo flow.
