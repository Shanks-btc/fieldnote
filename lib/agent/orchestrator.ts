import type { Brief } from "@/lib/validation/brief";
import { STEP_DEFINITIONS } from "./catalogue";
import {
  generateExplanations,
  getProjectDemographics,
  getProjectTasteProfile,
  newContext,
  projectInfo,
  recommendArtists,
  resolveProject,
  scoreAndRank,
  type RunContext,
  type StepOutcome,
} from "./steps";
import type { ResearchEvent, ResearchResult, ResearchStep, StepId } from "./types";

type StepFn = (ctx: RunContext) => Promise<StepOutcome>;

const PROJECT_DOMAIN: Record<string, string> = {
  "urn:entity:tv_show": "tv",
  "urn:entity:movie": "film",
  "urn:entity:brand": "brands",
  "urn:entity:videogame": "games",
};

/** Domains that actually returned data: the project's own domain, plus music when artists came back. */
function queriedDomains(ctx: RunContext, steps: Map<StepId, ResearchStep>): string[] {
  const out: string[] = [];
  const own = ctx.project ? PROJECT_DOMAIN[ctx.project.kind] : undefined;
  if (own) out.push(own);
  if (USABLE.has(steps.get("recommendArtists")?.status ?? "")) out.push("music");
  return out;
}

const IMPLEMENTATIONS: Record<StepId, StepFn> = {
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

const USABLE = new Set(["ok", "partial"]);

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

  const publish = (step: ResearchStep) => {
    steps.set(step.id, step);
    emit({ type: "step", step });
  };

  for (const def of STEP_DEFINITIONS) {
    const base: ResearchStep = { id: def.id, label: def.label, status: "pending", qlooEndpoint: def.qlooEndpoint };

    const blocked = (REQUIRES[def.id] ?? []).find((dep) => !USABLE.has(steps.get(dep)?.status ?? ""));
    if (blocked) {
      const depLabel = STEP_DEFINITIONS.find((d) => d.id === blocked)!.label;
      publish({ ...base, status: "skipped", summary: `Skipped: "${depLabel}" did not produce usable data` });
      continue;
    }

    publish({ ...base, status: "running" });
    const t0 = Date.now();
    try {
      const out = await IMPLEMENTATIONS[def.id](ctx);
      publish({
        ...base,
        status: out.status,
        qlooEndpoint: out.endpoint ?? def.qlooEndpoint,
        summary: out.summary,
        error: out.error,
        durationMs: Date.now() - t0,
      });
    } catch (e) {
      publish({ ...base, status: "error", error: e instanceof Error ? e.message : String(e), durationMs: Date.now() - t0 });
    }
  }

  // Steps that add their own warning to ctx (taste profile, demographics, scoring) are
  // covered already; surface the two steps whose failure leaves the run without results.
  const fatal = (["resolveProject", "recommendArtists"] as const)
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
    steps: STEP_DEFINITIONS.map((d) => steps.get(d.id)!),
    qlooDomains: queriedDomains(ctx, steps),
    creative: ctx.creative,
    recommendations: ctx.recommendations,
    warnings: [...new Set(warnings)],
  };
  return result;
}
