import { z } from "zod";

export const PROJECT_TYPES = [
  "tv_series",
  "film",
  "advertising",
  "trailer",
  "video_game",
  "documentary",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  tv_series: "TV series",
  film: "Film",
  advertising: "Ad campaign",
  trailer: "Trailer",
  video_game: "Video game",
  documentary: "Documentary",
};

/** Comma/newline separated free text -> trimmed, non-empty list. */
const listFromText = z
  .string()
  .max(500, "Keep this under 500 characters")
  .transform((s) =>
    s
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean),
  );

export const briefInputSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(2, "Enter the show, film or brand name")
    .max(120),
  projectType: z.enum(PROJECT_TYPES, { error: "Choose a project type" }),
  sceneDescription: z
    .string()
    .trim()
    .min(20, "Describe the scene in at least a sentence")
    .max(2000),
  targetAudience: z.string().trim().min(3, "Who is this for?").max(500),
  geographicMarket: z.string().trim().min(2, "Enter a market, e.g. United States").max(200),
  mood: z.string().trim().min(2, "Describe the mood or emotion").max(300),
  genrePreferences: listFromText,
  culturalReferences: listFromText,
  exclusions: listFromText,
});

/** Raw form values (strings) before parsing. */
export type BriefFormValues = z.input<typeof briefInputSchema>;
/** Parsed brief with list fields split into arrays. */
export type Brief = z.output<typeof briefInputSchema>;

export const EXAMPLE_BRIEF: BriefFormValues = {
  projectName: "Stranger Things",
  projectType: "tv_series",
  sceneDescription:
    "Season 5 transition scene: the group drives out of Hawkins at dusk after a loss. Quiet, wide shots; the music should carry grief and fragile hope without tipping into melodrama.",
  targetAudience: "Adults 18-34, existing fans of 80s-set sci-fi and coming-of-age drama",
  geographicMarket: "United States",
  mood: "Melancholy, nostalgic, quietly hopeful",
  genrePreferences: "indie rock, synth-pop, dream pop",
  culturalReferences: "Drive (2011), Kate Bush, John Hughes films",
  exclusions: "No lyrics about romance, nothing already used in a previous season",
};
