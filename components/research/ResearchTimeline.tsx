import type { ResearchStep, StepDefinition, StepId } from "@/lib/agent/types";
import { STEP_DEFINITIONS } from "@/lib/agent/catalogue";
import { ResearchStepRow } from "./ResearchStep";

/** Renders steps in catalogue order as a hairline-divided list. Statuses come from real step events only. */
export function ResearchTimeline({
  steps,
  startedAt,
  now,
  defs = STEP_DEFINITIONS,
}: {
  defs?: StepDefinition[];
  steps: ResearchStep[];
  startedAt: Partial<Record<StepId, number>>;
  now: number;
}) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  return (
    <ol className="divide-y divide-border border-y border-border">
      {defs.map((def) => {
        const step: ResearchStep = byId.get(def.id) ?? {
          id: def.id,
          label: def.label,
          status: "pending",
          qlooEndpoint: def.qlooEndpoint,
        };
        const elapsedMs = step.status === "running" && startedAt[def.id] ? Math.max(0, now - startedAt[def.id]!) : undefined;
        return (
          <ResearchStepRow
            key={def.id}
            step={step}
            description={step.status === "running" ? def.runningText : def.description}
            elapsedMs={elapsedMs}
          />
        );
      })}
    </ol>
  );
}
