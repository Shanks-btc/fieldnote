import { z } from "zod";
import { demographicsSchema } from "./qloo";

const score01 = z.number().min(0).max(1);

export const evidenceSchema = z.object({
  /** Qloo tags describing the artist (genre, style, theme). */
  artistTags: z.array(z.string()),
  /** Tags present on both the project's taste profile and the artist. Often empty. */
  sharedTags: z.array(z.string()),
  /** Qloo's raw affinity between project and artist (0-1, clustered). */
  rawAffinity: z.number().nullable(),
  /** Qloo popularity (0-1). */
  popularity: z.number().nullable(),
  /** The artist's own audience demographics (signed -1..1), when Qloo returned them. Absent on older cached results. */
  demographics: demographicsSchema.nullable().optional(),
  /** Free-text summary of geographic overlap, or null when no data was retrieved. */
  geographicOverlap: z.string().nullable(),
  /** Qloo reports audience_growth = 0 for everything seen so far, so this is usually "unknown". */
  trendDirection: z.enum(["rising", "stable", "declining", "unknown"]),
});

export const recommendationSchema = z.object({
  rank: z.number().int().positive(),
  qlooEntityId: z.string(),
  artistName: z.string(),
  trackName: z.string().nullable(),
  /** Qloo-hosted artist image (Spotify album art comes later). */
  imageUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  spotifyArtistId: z.string().nullable(),
  spotifyUrl: z.string().nullable(),
  scores: z.object({
    /** LLM judgement of fit to the brief; null when the LLM step was unavailable or failed for this artist. */
    creativeFit: score01.nullable(),
    /** Qloo affinity, min-max rescaled within the shortlist. */
    culturalFit: score01.nullable(),
    /** Similarity of the artist's audience demographics to the project's, rescaled within the shortlist. */
    audienceRelevance: score01.nullable(),
    /** Weighted over the dimensions that have data. */
    composite: score01,
  }),
  evidence: evidenceSchema,
  explanation: z.string(),
  /** The LLM's reasoning behind creativeFit. Absent when creative fit was not scored (and on older cached results). */
  reasoning: z
    .object({ toneMatch: z.string(), genreRelevance: z.string(), placementFit: z.string(), risks: z.string() })
    .nullable()
    .optional(),
});

export const recommendationListSchema = z.array(recommendationSchema);

export type Evidence = z.infer<typeof evidenceSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
