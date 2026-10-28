import { z } from "zod";

/**
 * Zod schemas for Qloo API responses, matched to scripts/fixtures/.
 * Objects use .loose() so new upstream fields don't break parsing; only fields the app
 * reads are required. scripts/validate-fixtures.mjs parses every fixture through these.
 */

const score = z.number();

const externalSchema = z
  .object({
    spotify: z.array(z.object({ id: z.string() }).loose()).optional(),
    musicbrainz: z.array(z.object({ id: z.string() }).loose()).optional(),
  })
  .loose();

const imageProps = z.object({ image: z.object({ url: z.string() }).optional() }).loose();

// ---- GET /search ----
export const searchEntitySchema = z
  .object({
    name: z.string(),
    entity_id: z.string(),
    types: z.array(z.string()),
    // Absent on some low-profile entities (e.g. "Stranger Things: Tales from 85").
    popularity: score.optional(),
    disambiguation: z.string().optional(),
    properties: imageProps,
    tags: z.array(z.object({ name: z.string(), tag_id: z.string(), type: z.string() }).loose()).default([]),
  })
  .loose();

export const searchResponseSchema = z.object({ results: z.array(searchEntitySchema) }).loose();

// ---- GET /v2/insights (entities) ----
export const explainabilityEntrySchema = z.object({ entity_id: z.string(), score: z.number() });

export const insightEntitySchema = z
  .object({
    name: z.string(),
    entity_id: z.string(),
    type: z.string(),
    subtype: z.string(),
    popularity: score,
    disambiguation: z.string().optional(),
    properties: imageProps,
    // A few tags arrive as {type} only, with no id or name.
    tags: z.array(z.object({ id: z.string().optional(), name: z.string().optional(), type: z.string() }).loose()).default([]),
    query: z
      .object({
        affinity: score,
        measurements: z.object({ audience_growth: z.number().optional() }).loose().optional(),
        explainability: z
          .object({ "signal.interests.entities": z.array(explainabilityEntrySchema).optional() })
          .loose()
          .optional(),
      })
      .loose(),
    external: externalSchema.default({}),
  })
  .loose();

export const insightsEntitiesResponseSchema = z
  .object({
    success: z.boolean(),
    results: z.object({ entities: z.array(insightEntitySchema) }).loose(),
  })
  .loose();

// ---- GET /v2/insights (urn:tag) ----
export const insightTagSchema = z
  .object({
    tag_id: z.string(),
    name: z.string(),
    types: z.array(z.string()),
    subtype: z.string(),
    tag_value: z.string(),
    popularity: score,
    query: z.object({ affinity: score }).loose(),
  })
  .loose();

export const insightsTagsResponseSchema = z
  .object({ success: z.boolean(), results: z.object({ tags: z.array(insightTagSchema) }).loose() })
  .loose();

// ---- GET /v2/tags ----
export const tagSearchResultSchema = z
  .object({ id: z.string(), name: z.string(), type: z.string(), popularity: score })
  .loose();

export const tagSearchResponseSchema = z
  .object({ success: z.boolean(), results: z.object({ tags: z.array(tagSearchResultSchema) }).loose() })
  .loose();

// ---- GET /v2/insights (urn:demographics) — values are signed, -1..1 ----
const signed = z.number().min(-1).max(1);

export const demographicsSchema = z.object({
  age: z.object({
    "24_and_younger": signed,
    "25_to_29": signed,
    "30_to_34": signed,
    "35_to_44": signed,
    "45_to_54": signed,
    "55_and_older": signed,
  }),
  gender: z.object({ male: signed, female: signed }),
});

export const insightsDemographicsResponseSchema = z
  .object({
    success: z.boolean(),
    results: z.object({
      demographics: z.array(z.object({ entity_id: z.string(), query: demographicsSchema })),
    }),
  })
  .loose();

// ---- GET /v2/insights (urn:heatmap) ----
export const heatmapPointSchema = z
  .object({
    location: z.object({ latitude: z.number(), longitude: z.number(), geohash: z.string() }),
    query: z.object({ affinity: score, affinity_rank: z.number(), popularity: z.number() }).loose(),
  })
  .loose();

export const insightsHeatmapResponseSchema = z
  .object({ success: z.boolean(), results: z.object({ heatmap: z.array(heatmapPointSchema) }) })
  .loose();

export type SearchEntityParsed = z.infer<typeof searchEntitySchema>;
export type InsightEntityParsed = z.infer<typeof insightEntitySchema>;
