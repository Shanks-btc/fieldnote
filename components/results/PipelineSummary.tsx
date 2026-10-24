import type { ResearchResult } from "@/lib/agent/types";
import { MonoValue } from "@/components/shared/MonoValue";
import { DomainPills } from "./ReasoningPanel";

const TAGS_SHOWN = 8;

/** What the run resolved and queried, at a glance, above the ranked list. Only states things the run actually did. */
export function PipelineSummary({ result }: { result: ResearchResult }) {
  const { tasteProfile, steps, creative, recommendations } = result;
  const tags = tasteProfile.map((t) => t.name);
  const totalMs = steps.reduce((s, st) => s + (st.durationMs ?? 0), 0);
  // Steps that call Qloo and weren't skipped (the product page's "five of the six steps").
  const qlooSteps = steps.filter((s) => s.qlooEndpoint && s.status !== "skipped" && s.status !== "pending").length;

  return (
    <section aria-label="Pipeline summary" className="space-y-4 rounded-[24px] bg-white p-5 sm:p-6">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">Pipeline summary</h2>

      {tags.length > 0 && (
        <p className="text-sm leading-relaxed text-black/75">
          Brief resolved to: {tags.slice(0, TAGS_SHOWN).join(", ")}
          {tags.length > TAGS_SHOWN && <span className="text-black/40"> and {tags.length - TAGS_SHOWN} more</span>}
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-xs text-black/45">Domains queried</p>
        <DomainPills domains={result.qlooDomains ?? []} />
      </div>

      <p className="text-sm text-black/55">
        {creative
          ? `${creative.evaluated} of ${creative.candidates} candidate artists evaluated for creative fit, ${recommendations.length} shown`
          : `${recommendations.length} artists ranked, creative fit not scored`}
        {qlooSteps > 0 && <> · {qlooSteps} Qloo-backed steps</>}
        {totalMs > 0 && (
          <>
            {" "}
            · completed in <MonoValue>{(totalMs / 1000).toFixed(1)}s</MonoValue>
          </>
        )}
      </p>
    </section>
  );
}
