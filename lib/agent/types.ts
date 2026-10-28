import type { Brief } from "@/lib/validation/brief";
import type { Recommendation } from "@/lib/validation/results";
import type { Demographics } from "@/lib/qloo/types";

export type StepStatus = "pending" | "running" | "ok" | "empty" | "partial" | "error" | "skipped";

export const STEP_IDS = [
  "resolveProject",
  "getProjectTasteProfile",
  "getProjectDemographics",
  "recommendArtists",
  "scoreAndRank",
  "generateExplanations",
  // description mode (no named project)
  "analyzeBrief",
  "searchArtists",
  "inferAudience",
] as const;

export type StepId = (typeof STEP_IDS)[number];

export interface StepDefinition {
  id: StepId;
  label: string;
  description: string;
  /** Qloo endpoint this step calls, or null for non-Qloo steps. Shown for transparency. */
  qlooEndpoint: string | null;
  /** Shown while the step runs. */
  runningText: string;
  /** Typical duration in ms, used only to pace the progress bar. */
  expectedMs: number;
}

export interface ResearchStep {
  id: StepId;
  label: string;
  status: StepStatus;
  qlooEndpoint: string | null;
  /** One-line human summary, e.g. "12 artists returned". Only set from real results. */
  summary?: string;
  durationMs?: number;
  error?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  kind: string;
  imageUrl: string | null;
}

export interface TasteTagView {
  id: string;
  name: string;
  category: string;
  source: "search" | "insights";
}

export interface TasteGraphDomain {
  /** Lowercase domain key, matching qlooDomains: tv, film, podcasts, books, games, brands, people. */
  key: string;
  entities: string[];
}

export interface ResearchResult {
  id: string;
  brief: Brief;
  project: ProjectInfo | null;
  tasteProfile: TasteTagView[];
  demographics: Demographics | null;
  /** Set when `demographics` was estimated by the language model from the brief (description mode), not read from Qloo. */
  inferredAudience?: { reasoning: string };
  steps: ResearchStep[];
  /** Qloo domains that actually returned data for this run (lowercase keys: tv, film, brands, games, music). Absent on older cached results. */
  qlooDomains?: string[];
  /** "description" when artists were found from the brief's own words instead of a Qloo project. Absent on older cached results (entity). */
  mode?: "entity" | "description";
  /** Genre terms read from the brief (description mode). */
  searchTerms?: string[];
  /** What Qloo's taste graph links the project to in other domains (up to 5 names each). Absent on older cached results and shared links. */
  tasteGraph?: TasteGraphDomain[];
  /** How creative fit was produced; null when it was not scored. Absent on older cached results. */
  creative?: { model: string; evaluated: number; candidates: number } | null;
  recommendations: Recommendation[];
  /** Non-fatal problems (failed or empty steps) that the UI should surface. */
  warnings: string[];
}

/** Events pushed over SSE to the research timeline. */
export type ResearchEvent =
  | { type: "step"; step: ResearchStep }
  | { type: "done"; resultId: string; result: ResearchResult }
  | { type: "error"; message: string };
