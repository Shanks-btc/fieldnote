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
] as const;

export type StepId = (typeof STEP_IDS)[number];

export interface StepDefinition {
  id: StepId;
  label: string;
  description: string;
  /** Qloo endpoint this step calls, or null for non-Qloo steps. Shown for transparency. */
  qlooEndpoint: string | null;
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

export interface ResearchResult {
  id: string;
  brief: Brief;
  project: ProjectInfo | null;
  tasteProfile: TasteTagView[];
  demographics: Demographics | null;
  steps: ResearchStep[];
  recommendations: Recommendation[];
  /** Non-fatal problems (failed or empty steps) that the UI should surface. */
  warnings: string[];
}

/** Events pushed over SSE to the research timeline. */
export type ResearchEvent =
  | { type: "step"; step: ResearchStep }
  | { type: "done"; resultId: string; result: ResearchResult }
  | { type: "error"; message: string };
