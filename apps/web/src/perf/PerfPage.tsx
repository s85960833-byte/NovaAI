import { useCallback, useEffect, useMemo, useState } from "react";

type RefreshRate = 60 | 90 | 120;

type Result = {
  refreshRate: RefreshRate;
  budgetMs: number;
  p50Ms: number;
  p95Ms: number;
  droppedFrames: number;
  droppedPercent: number;
  samples: number;
  pass: boolean;
};

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

function measureCadence(frames: number[]): Result {
  const median = percentile(frames, 50);
  const refreshRate: RefreshRate = median <= 9.5 ? 120 : median <= 13.8 ? 90 : 60;
  const budgetMs = ({ 60: 16.7, 90: 11.1, 120: 8.3 } as const)[refreshRate];
  const droppedFrames = frames.reduce((total, frame) => {
    return total + (frame > budgetMs * 1.5 ? Math.max(1, Math.round(frame / budgetMs) - 1) : 0);
  }, 0);
  const droppedPercent = frames.length ? (droppedFrames / frames.length) * 100 : 100;
  const p50Ms = percentile(frames, 50);
  const p95Ms = percentile(frames, 95);

  return {
    refreshRate,
    budgetMs,
    p50Ms,
    p95Ms,
    droppedFrames,
    droppedPercent,
    samples: frames.length,
    pass: p95Ms <= budgetMs && droppedPercent <= 5,
  };
}

export function PerfPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const device = useMemo(
    () => ({
      viewport: String(window.innerWidth) + " × " + String(window.innerHeight),
      screen: String(window.screen.width) + " × " + String(window.screen.height),
      dpr: window.devicePixelRatio || 1,
      cores: navigator.hardwareConcurrency || "unknown",
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "unknown",
    }),
    [],
  );

  const runMeasurement = useCallback(() => {
    setResult(null);
    setMeasuring(true);
    setStartedAt(new Date().toISOString());

    const frames: number[] = [];
    let first = 0;
    let previous = 0;
    let raf = 0;

    const tick = (now: number) => {
      if (!first) first = now;
      if (previous) frames.push(now - previous);
      previous = now;

      if (now - first >= 5000 && frames.length >= 90) {
        setResult(measureCadence(frames));
        setMeasuring(false);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const stop = runMeasurement();
    return () => stop?.();
  }, [runMeasurement]);

  const value = result;
  const verdictClass = value
    ? value.pass
      ? "perf-verdict pass"
      : "perf-verdict fail"
    : "perf-verdict";

  return (
    <main className="perf-page">
      <section className="perf-card" aria-labelledby="perf-title">
        <a className="perf-back" href="/">
          ← NOVA
        </a>
        <p className="perf-kicker">DEVICE PERFORMANCE · LOCAL MEASUREMENT</p>
        <h1 id="perf-title">NOVA Frame Check</h1>
        <p className="perf-intro">
          Keep this page open in the foreground for five seconds. It measures the frame cadence
          delivered to this browser on this device.
        </p>
        <div className="perf-device">
          <span>Viewport</span>
          <strong>{device.viewport}</strong>
          <span>Screen / DPR</span>
          <strong>
            {device.screen} · {device.dpr}×
          </strong>
          <span>CPU cores / memory</span>
          <strong>
            {device.cores} / {device.memory} GB
          </strong>
        </div>
        {measuring && (
          <div className="perf-status" role="status" aria-live="polite">
            <span className="perf-pulse" /> Measuring frame cadence…
          </div>
        )}
        {value && (
          <>
            <div className={verdictClass} role="status" aria-live="polite">
              <strong>{value.pass ? "PASS" : "FAIL"}</strong>
              <span>
                {value.refreshRate} Hz observed cadence · {value.budgetMs.toFixed(2)} ms budget
              </span>
            </div>
            <div className="perf-metrics">
              <div>
                <span>p50 frame</span>
                <strong>{value.p50Ms.toFixed(2)} ms</strong>
              </div>
              <div>
                <span>p95 frame</span>
                <strong>{value.p95Ms.toFixed(2)} ms</strong>
              </div>
              <div>
                <span>Dropped frames</span>
                <strong>{value.droppedFrames}</strong>
              </div>
              <div>
                <span>Dropped rate</span>
                <strong>{value.droppedPercent.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Frame samples</span>
                <strong>{value.samples}</strong>
              </div>
              <div>
                <span>Budget threshold</span>
                <strong>p95 ≤ {value.budgetMs.toFixed(2)} ms</strong>
              </div>
            </div>
          </>
        )}
        {!measuring && value && (
          <button className="perf-rerun" onClick={runMeasurement}>
            Measure again
          </button>
        )}
        <p className="perf-caveat">
          Refresh rate is an estimate inferred from requestAnimationFrame timing, not a direct
          hardware-panel reading. Browser throttling, power saver, background tabs and variable
          refresh rate can affect it. This page does not certify 90/120 Hz hardware.
        </p>
        <p className="perf-time">
          Started: {startedAt ? new Date(startedAt).toLocaleTimeString() : "—"}
        </p>
      </section>
    </main>
  );
}
