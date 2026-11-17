export const FRAME_BUDGET_MS = { 120: 8.3, 90: 11.1, 60: 16.7 } as const;
export const MAIN_THREAD_FRAME_BUDGET_MS = 4;
export const LONG_TASK_BUDGET_MS = 8;
export function evaluateFrame(durationMs: number, refreshRate: 120 | 90 | 60 = 120) {
  const budget = FRAME_BUDGET_MS[refreshRate];
  return {
    durationMs,
    budgetMs: budget,
    withinBudget: Number.isFinite(durationMs) && durationMs <= budget,
  };
}
export function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}
export function startFrameBudgetMonitor(root: HTMLElement = document.documentElement) {
  let previous = 0;
  let raf = 0;
  const samples: number[] = [];
  const tick = (now: number) => {
    if (previous) {
      const delta = now - previous;
      samples.push(delta);
      if (samples.length > 240) samples.shift();
      root.dataset.frameP50 = percentile(samples, 50).toFixed(2);
      root.dataset.frameP95 = percentile(samples, 95).toFixed(2);
      root.dataset.frameBudget120 = String(evaluateFrame(delta, 120).withinBudget);
    }
    previous = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  let observer: PerformanceObserver | undefined;
  if (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")
  ) {
    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const count =
        Number(root.dataset.longAnimationFrames ?? "0") +
        entries.filter((entry) => entry.duration > LONG_TASK_BUDGET_MS).length;
      root.dataset.longAnimationFrames = String(count);
    });
    observer.observe({ type: "long-animation-frame", buffered: true });
  }
  return () => {
    cancelAnimationFrame(raf);
    observer?.disconnect();
  };
}
