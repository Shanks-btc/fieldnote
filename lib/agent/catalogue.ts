import type { StepDefinition } from "./types";

/**
 * Step catalogue (pure data, safe to import from client components). The timeline renders
 * from this list, so the labels and endpoints users see match what the orchestrator calls.
 */
export const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: "resolveProject",
    label: "Resolve project",
    description: "Find the show, film or brand in Qloo",
    qlooEndpoint: "GET /search",
  },
  {
    id: "getProjectTasteProfile",
    label: "Read taste profile",
    description: "Genre, theme and audience tags from the project, plus Qloo's audience tags (food, place and brand tags dropped)",
    qlooEndpoint: "GET /v2/insights (urn:tag)",
  },
  {
    id: "getProjectDemographics",
    label: "Read audience demographics",
    description: "Age and gender affinity for the project's audience",
    qlooEndpoint: "GET /v2/insights (urn:demographics)",
  },
  {
    id: "recommendArtists",
    label: "Find culturally aligned artists",
    description: "Artists whose audiences overlap with the project's",
    qlooEndpoint: "GET /v2/insights (urn:entity:artist)",
  },
  {
    id: "scoreAndRank",
    label: "Score and rank",
    description: "Score creative fit against the brief, rescale cultural fit, compare each artist's audience to the project's, and rank",
    qlooEndpoint: "GET /v2/insights (urn:demographics)",
  },
  {
    id: "generateExplanations",
    label: "Write evidence summaries",
    description: "A specific explanation per artist, written from the brief and the retrieved data",
    qlooEndpoint: null,
  },
];
