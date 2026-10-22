import { cn } from "@/lib/utils";

/**
 * One score on a single line: label left, thin bar in the middle, number right.
 * Null means "no data" and renders a dash (used for real dimensions that came back empty).
 */
export function ScoreBar({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number | null;
  strong?: boolean;
}) {
  const pct = value == null ? 0 : Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className={cn("w-[4.75rem] shrink-0 text-xs", strong ? "font-medium text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <div
        className="h-0.5 flex-1 overflow-hidden bg-[#ececec]"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value == null ? undefined : pct}
      >
        <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("w-8 shrink-0 text-right font-mono tabular-nums", strong ? "text-sm font-semibold" : "text-xs")}>
        {value == null ? "—" : pct}
      </span>
    </div>
  );
}

export interface ScoreSet {
  /** Hidden unless the LLM step has produced a value. */
  creativeFit?: number | null;
  culturalFit: number | null;
  audienceRelevance: number | null;
  composite: number;
}

/** Cultural, Audience and Composite; Creative appears only once it has a real value. */
export function ScoreStack({ scores, className }: { scores: ScoreSet; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {scores.creativeFit != null && <ScoreBar label="Creative" value={scores.creativeFit} />}
      <ScoreBar label="Cultural" value={scores.culturalFit} />
      <ScoreBar label="Audience" value={scores.audienceRelevance} />
      <ScoreBar label="Composite" value={scores.composite} strong />
    </div>
  );
}
