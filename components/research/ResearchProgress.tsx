import type { ResearchStep, StepId } from "@/lib/agent/types";
import { STEP_DEFINITIONS } from "@/lib/agent/catalogue";
import type { StepDefinition } from "@/lib/agent/types";

const SLOW_STEP_MS = 8_000;
const SLOW_TOTAL_MS = 25_000;
const FINISHED = new Set(["ok", "partial", "empty", "error", "skipped"]);

/** Share of the run complete, paced by each step's typical duration. Never reaches 100 until the run is done. */
export function progressPercent(
  steps: ResearchStep[],
  startedAt: Partial<Record<StepId, number>>,
  now: number,
  done: boolean,
  defs: StepDefinition[] = STEP_DEFINITIONS,
): number {
  if (done) return 100;
  const byId = new Map(steps.map((s) => [s.id, s]));
  let complete = 0;
  const total = defs.reduce((sum, d) => sum + d.expectedMs, 0);
  for (const d of defs) {
    const s = byId.get(d.id);
    if (s && FINISHED.has(s.status)) complete += d.expectedMs;
    else if (s?.status === "running") {
      const elapsed = Math.max(0, now - (startedAt[d.id] ?? now));
      complete += d.expectedMs * Math.min(elapsed / d.expectedMs, 0.95);
    }
  }
  return Math.min(99, Math.round((complete / total) * 100));
}

/** Bar, what is happening right now, and a reassurance line when a step or the whole run is slow. */
export function ResearchProgress({
  steps,
  startedAt,
  runStartedAt,
  now,
  done,
  defs = STEP_DEFINITIONS,
}: {
  defs?: StepDefinition[];
  steps: ResearchStep[];
  startedAt: Partial<Record<StepId, number>>;
  runStartedAt: number;
  now: number;
  done: boolean;
}) {
  const running = steps.find((s) => s.status === "running");
  const def = running ? defs.find((d) => d.id === running.id) : undefined;
  const stepElapsed = running ? now - (startedAt[running.id] ?? now) : 0;
  const totalElapsed = now - runStartedAt;
  const pct = progressPercent(steps, startedAt, now, done, defs);

  const message = done ? "Complete" : running?.summary === "Retrying…" ? "That took too long, retrying once…" : def?.runningText ?? "Starting your research…";
  const reassurance = done
    ? null
    : totalElapsed > SLOW_TOTAL_MS
      ? "Almost there. The scoring step is thorough."
      : stepElapsed > SLOW_STEP_MS
        ? "This step is taking a bit longer than usual. Hang tight."
        : null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-black/70" aria-live="polite">
          {message}
        </p>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]"
        role="progressbar"
        aria-label="Research progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Reserve the line so the layout doesn't jump when the message appears. */}
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {reassurance}
      </p>
    </div>
  );
}
