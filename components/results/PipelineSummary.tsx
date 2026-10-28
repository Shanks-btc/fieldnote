import type { ResearchResult } from "@/lib/agent/types";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_LENS, briefTitle } from "@/lib/validation/brief";
import { MonoValue } from "@/components/shared/MonoValue";
import { ALL_DOMAINS, DomainPills } from "./ReasoningPanel";

const TAGS_SHOWN = 8;
const GRAPH_NAMES_SHOWN = 3;
const LABELS = Object.fromEntries(ALL_DOMAINS.map((d) => [d.toLowerCase(), d])) as Record<string, string>;

/** What the run resolved and queried, at a glance, above the ranked list. Only states things the run actually did. */
export function PipelineSummary({ result }: { result: ResearchResult }) {
  const { tasteProfile, steps, creative, recommendations, brief } = result;
  const described = result.mode === "description";
  const title = result.project?.name ?? briefTitle(brief);
  const projectLabel = `${described ? `“${title}”` : title} (${PROJECT_TYPE_LABELS[brief.projectType]})`;
  const lens = PROJECT_TYPE_LENS[brief.projectType];
  const domains = result.qlooDomains ?? [];
  const graph = result.tasteGraph ?? [];
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

      <p className="text-sm leading-relaxed text-black/75">
        Scored as: <span className="font-medium">{PROJECT_TYPE_LABELS[brief.projectType]}</span>
        <span className="text-black/55"> · {lens.short}</span>
      </p>

      {!described && (
      <div className="space-y-1.5">
        <p className="text-xs text-black/45">
          {domains.length > 0 ? (
            <>
              Queried <span className="font-medium text-black/70">{domains.length} Qloo domains</span> for this project
            </>
          ) : (
            "Domains queried"
          )}
        </p>
        <DomainPills domains={domains} />
      </div>
      )}

      {graph.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-black/45">Across the taste graph, this project's audience also loves</p>
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {graph.map((g) => (
              <div key={g.key} className="flex gap-2">
                <dt className="w-16 shrink-0 text-black/40">{LABELS[g.key] ?? g.key}</dt>
                <dd className="min-w-0 text-black/75">{g.entities.slice(0, GRAPH_NAMES_SHOWN).join(", ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="text-sm text-black/55">
        {creative
          ? `${recommendations.length} artists scored for ${projectLabel} · ${creative.evaluated} of ${creative.candidates} candidates evaluated for creative fit`
          : `${recommendations.length} artists ranked for ${projectLabel}, creative fit not scored`}
        {qlooSteps > 0 && <> · {qlooSteps} Qloo-backed step{qlooSteps === 1 ? "" : "s"}</>}
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
