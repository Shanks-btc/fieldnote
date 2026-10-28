import type { ResearchStep as Step } from "@/lib/agent/types";
import { cn } from "@/lib/utils";
import { StepStatusIcon } from "./StepStatus";

/** One step, terminal-style: mono endpoint, duration and result line; a 2px black rule marks the running step. */
export function ResearchStepRow({ step, description, elapsedMs }: { step: Step; description?: string; elapsedMs?: number }) {
  const running = step.status === "running";
  return (
    <li
      className={cn(
        "relative flex gap-5 py-7",
        // 2px accent in the gutter (a pseudo-element, so the row's own hairlines keep their colour)
        running && "before:absolute before:inset-y-3 before:-left-4 before:w-0.5 before:bg-foreground",
      )}
    >
      <div className="pt-0.5">
        <StepStatusIcon status={step.status} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <p className={cn("font-medium", step.status === "pending" && "text-muted-foreground", running && "animate-pulse motion-reduce:animate-none")}>
            {step.label}
          </p>
          {running && elapsedMs != null && (
            <span className="font-mono text-xs tabular-nums text-foreground">{(elapsedMs / 1000).toFixed(1)}s…</span>
          )}
          {!running && step.durationMs != null && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{(step.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-[#555]">{description}</p>}
        {step.qlooEndpoint && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            <span className="select-none text-foreground/40">$ </span>
            {step.qlooEndpoint}
          </p>
        )}
        {step.summary && (
          <p className="mt-1.5 font-mono text-[13px] text-foreground">
            <span className="select-none text-foreground/40">→ </span>
            {step.summary}
          </p>
        )}
        {step.error && <p className="mt-1.5 font-mono text-[13px] text-destructive">! {step.error}</p>}
      </div>
    </li>
  );
}
