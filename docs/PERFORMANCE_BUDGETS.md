# NOVA 2.0 Performance Budgets

These thresholds are copied from Master Prompt sections 4.1–4.3 and 10.1.

| Metric | Required budget | Evidence |
|---|---:|---|
| 120 Hz frame | ≤ 8.3 ms | browser instrumentation; physical 120 Hz device NOT VERIFIED |
| 90 Hz frame | ≤ 11.1 ms | browser instrumentation |
| 60 Hz frame | ≤ 16.7 ms | browser instrumentation |
| Main-thread work per animation frame | ≤ 4 ms | Chrome trace |
| Long task | none > 8 ms | Long Animation Frame observer / DevTools |
| Lighthouse mobile Performance | ≥ 90 | LHCI, Slow 4G + 4× CPU |
| Lighthouse Accessibility | ≥ 95 | LHCI + axe/manual review |
| Lighthouse Best Practices | ≥ 95 | LHCI |
| Lighthouse SEO | ≥ 90 | LHCI |
| LCP | ≤ 2.5 s | LHCI |
| INP | ≤ 200 ms | field data / real interaction; lab-only result is not proof |
| CLS | ≤ 0.1 | LHCI |
| App-shell JavaScript | ≤ 170 KB gzip | bundle-budget script |
| Touch targets | ≥ 48 px | CSS + mobile E2E |
| Contrast | ≥ 4.5:1 | axe + manual review in both themes |
| Money/auth/limits/Diwan test coverage | ≥ 80% | coverage report required |
| Critical/high dependency vulnerabilities | 0 | npm audit |

Frame-time report must include p50/p95 and dropped-frame counts for chat scroll, drawer, page transitions and entry animation. If a real 120 Hz device is unavailable, browser metrics must be labelled emulated; a 60 Hz emulator cannot prove 120 FPS.