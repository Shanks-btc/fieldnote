import type { Brief } from "@/lib/validation/brief";
import { stepDefinitionsFor } from "./catalogue";
import {
  analyzeBrief,
  generateExplanations,
  getProjectDemographics,
  getProjectTasteProfile,
  inferAudience,
  newContext,
  projectInfo,
  recommendArtists,
  resolveProject,
  scoreAndRank,
  searchArtists,
  type RunContext,
  type StepOutcome,
} from "./steps";
import type { ResearchEvent, ResearchResult, ResearchStep, StepId } from "./types";

type StepFn = (ctx: RunContext) => Promise<StepOutcome>;

/** Domains that returned data: the project's own, every one the taste graph reached, and music when artists came back. */
function queriedDomains(ctx: RunContext, steps: Map<StepId, ResearchStep>): string[] {
  const out = [...ctx.domains];
  if (USABLE.has(steps.get("recommendArtists")?.status ?? "") || USABLE.has(steps.get("searchArtists")?.status ?? "")) out.push("music");
  return out;
}

const IMPLEMENTATIONS: Record<StepId, StepFn> = {
  analyzeBrief,
  searchArtists,
  inferAudience,
  resolveProject,
  getProjectTasteProfile,
  getProjectDemographics,
  recommendArtists,
  scoreAndRank,
  generateExplanations,
};

/**
 * Which earlier steps must have produced usable output. If one of these failed, the step
 * is skipped (not attempted). Demographics and the taste profile are NOT hard requirements:
 * the run continues without them and reports a warning.
 */
const REQUIRES: Partial<Record<StepId, StepId[]>> = {
  getProjectTasteProfile: ["resolveProject"],
  getProjectDemographics: ["resolveProject"],
  recommendArtists: ["resolveProject"],
  scoreAndRank: ["recommendArtists"],
  generateExplanations: ["scoreAndRank"],
};

/** The description-mode track has its own dependencies: search needs the analysis, scoring needs the search. */
const REQUIRES_DESCRIPTION: Partial<Record<StepId, StepId[]>> = {
  searchArtists: ["analyzeBrief"],
  inferAudience: ["searchArtists"],
  scoreAndRank: ["searchArtists"],
  generateExplanations: ["scoreAndRank"],
};

const USABLE = new Set(["ok", "partial"]);

/** Steps whose failure leaves the run with nothing to show. */
const RETRY_ONCE = new Set<StepId>(["resolveProject", "recommendArtists", "searchArtists"]);

/**
 * Runs the research workflow for a brief, emitting one event per step transition
 * (running, then ok/partial/empty/error) so the timeline reflects real progress.
 * Partial failures never abort the run; the result carries warnings instead.
 */
export async function runResearch(
  id: string,
  brief: Brief,
  emit: (event: ResearchEvent) => void,
): Promise<ResearchResult> {
  const ctx = newContext(brief);
  const steps = new Map<StepId, ResearchStep>();
  // Which track the run starts on. A named project that matches nothing switches to description mode partway
  // (ctx.mode), but the steps shown stay the six it began with.
  const defs = stepDefinitionsFor(ctx.mode);
  const requires = ctx.mode === "description" ? REQUIRES_DESCRIPTION : REQUIRES;

  const publish = (step: ResearchStep) => {
    steps.set(step.id, step);
    emit({ type: "step", step });
  };

  for (const def of defs) {
    const base: ResearchStep = { id: def.id, label: def.label, status: "pending", qlooEndpoint: def.qlooEndpoint };

    const blocked = (requires[def.id] ?? []).find((dep) => !USABLE.has(steps.get(dep)?.status ?? ""));
    if (blocked) {
      const depLabel = defs.find((d) => d.id === blocked)!.label;
      publish({ ...base, status: "skipped", summary: `Skipped: "${depLabel}" did not produce usable data` });
      continue;
    }

    publish({ ...base, status: "running" });
    const t0 = Date.now();
    const attempt = async (): Promise<StepOutcome> => {
      try {
        return await IMPLEMENTATIONS[def.id](ctx);
      } catch (e) {
        return { status: "error", error: e instanceof Error ? e.message : String(e) };
      }
    };
    let out = await attempt();
    // The run is useless without a project or artists, and Qloo failures are usually transient: try once more.
    if (out.status === "error" && RETRY_ONCE.has(def.id)) {
      publish({ ...base, status: "running", summary: "Retrying…" });
      out = await attempt();
    }
    publish({
      ...base,
      status: out.status,
      qlooEndpoint: out.endpoint ?? def.qlooEndpoint,
      summary: out.summary,
      error: out.error,
      durationMs: Date.now() - t0,
    });
  }

  // Steps that add their own warning to ctx (taste profile, demographics, scoring) are
  // covered already; surface the two steps whose failure leaves the run without results.
  const fatal = (defs[0].id === "analyzeBrief" ? (["analyzeBrief", "searchArtists"] as const) : (["resolveProject", "recommendArtists"] as const))
    .map((id) => steps.get(id)!)
    .filter((s) => s.status === "error" || s.status === "empty")
    .map((s) => `${s.label}: ${s.error ?? s.summary ?? s.status}`);
  const warnings = [...ctx.warnings, ...fatal];

  const result: ResearchResult = {
    id,
    brief,
    project: projectInfo(ctx),
    tasteProfile: ctx.tasteProfile,
    demographics: ctx.demographics,
    inferredAudience: ctx.inferredAudience ?? undefined,
    steps: defs.map((d) => steps.get(d.id)!),
    mode: ctx.mode,
    searchTerms: ctx.mode === "description" ? ctx.searchTerms : undefined,
    qlooDomains: queriedDomains(ctx, steps),
    tasteGraph: ctx.tasteGraph,
    creative: ctx.creative,
    recommendations: ctx.recommendations,
    warnings: [...new Set(warnings)],
  };
  return result;
}
