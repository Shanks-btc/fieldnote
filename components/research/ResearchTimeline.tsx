import type { ResearchStep } from "@/lib/agent/types";
import { STEP_DEFINITIONS } from "@/lib/agent/catalogue";
import { ResearchStepRow } from "./ResearchStep";

/** Renders steps in catalogue order as a hairline-divided list. Statuses come from real step events only. */
export function ResearchTimeline({ steps }: { steps: ResearchStep[] }) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  return (
    <ol className="divide-y divide-border border-y border-border">
      {STEP_DEFINITIONS.map((def) => {
        const step: ResearchStep = byId.get(def.id) ?? {
          id: def.id,
          label: def.label,
          status: "pending",
          qlooEndpoint: def.qlooEndpoint,
        };
        return <ResearchStepRow key={def.id} step={step} description={def.description} />;
      })}
    </ol>
  );
}
