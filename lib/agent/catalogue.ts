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
    runningText: "Resolving your brief in Qloo…",
    expectedMs: 2000,
  },
  {
    id: "getProjectTasteProfile",
    label: "Read taste profile",
    description: "Genre, theme and audience tags from the project, plus what its audience also loves in TV, film, podcasts, books, games, brands and people",
    qlooEndpoint: "GET /v2/insights (tags + 7 domains)",
    runningText: "Mapping your project's taste across domains…",
    expectedMs: 2500,
  },
  {
    id: "getProjectDemographics",
    label: "Read audience demographics",
    description: "Age and gender affinity for the project's audience",
    qlooEndpoint: "GET /v2/insights (urn:demographics)",
    runningText: "Reading who watches your project…",
    expectedMs: 500,
  },
  {
    id: "recommendArtists",
    label: "Find culturally aligned artists",
    description: "Artists whose audiences overlap with the project's",
    qlooEndpoint: "GET /v2/insights (urn:entity:artist)",
    runningText: "Finding artists whose audiences match your project…",
    expectedMs: 5000,
  },
  {
    id: "scoreAndRank",
    label: "Score and rank",
    description: "Score creative fit against the brief, rescale cultural fit, compare each artist's audience to the project's, and rank",
    qlooEndpoint: "GET /v2/insights (urn:demographics)",
    runningText: "Scoring creative fit against your brief…",
    expectedMs: 6500,
  },
  {
    id: "generateExplanations",
    label: "Write evidence summaries",
    description: "A specific explanation per artist, written from the brief and the retrieved data",
    qlooEndpoint: null,
    runningText: "Writing the evidence for each artist…",
    expectedMs: 300,
  },
];

const entityStep = (id: StepDefinition["id"]) => STEP_DEFINITIONS.find((d) => d.id === id)!;

/**
 * The shorter track for a brief with no named project: read the brief, match its genres to artists in
 * Qloo, estimate the target audience from the brief, then the same scoring and write-up. No project means
 * no taste graph and no Qloo audience to read, so the audience is inferred instead.
 */
export const DESCRIPTION_STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: "analyzeBrief",
    label: "Analyze brief",
    description: "Read the brief for the genres and artists it points to",
    qlooEndpoint: null,
    runningText: "Reading your brief for genres and artists…",
    expectedMs: 2000,
  },
  {
    id: "searchArtists",
    label: "Search for matching artists",
    description: "Match each genre to Qloo's taste graph and collect the artists it connects to",
    qlooEndpoint: "GET /v2/tags + GET /v2/insights (urn:entity:artist)",
    runningText: "Searching Qloo for matching artists…",
    expectedMs: 4500,
  },
  {
    id: "inferAudience",
    label: "Infer target audience",
    description: "Estimate the project's likely age and gender audience from the project type and scene",
    qlooEndpoint: null,
    runningText: "Inferring your target audience…",
    expectedMs: 1500,
  },
  {
    ...entityStep("scoreAndRank"),
    description: "Score creative fit against the brief, rescale cultural fit, compare each artist's audience to the inferred one, and rank",
    expectedMs: 8000,
  },
  entityStep("generateExplanations"),
];

export const stepDefinitionsFor = (mode: "entity" | "description"): StepDefinition[] =>
  mode === "description" ? DESCRIPTION_STEP_DEFINITIONS : STEP_DEFINITIONS;
