import { qlooGet } from "./client";
import { fromInsightEntity, fromInsightTag } from "./normalize";
import { filterCultureTags } from "./tagFilter";
import {
  ENTITY_TYPES,
  INSIGHT_FILTER_TYPES,
  type Demographics,
  type Entity,
  type EntityTypeUrn,
  type HeatmapPoint,
  type InsightsDemographicsResponse,
  type InsightsEntitiesResponse,
  type InsightsHeatmapResponse,
  type InsightsParams,
  type InsightsTagsResponse,
  type QlooResult,
  type Tag,
} from "./types";

const ENDPOINT = "/v2/insights";

async function run<R, T>(
  params: InsightsParams,
  pick: (res: R) => T,
  isEmpty: (data: T) => boolean,
  empty: T,
): Promise<QlooResult<T>> {
  const t0 = Date.now();
  try {
    const res = await qlooGet<R>(ENDPOINT, params);
    const data = pick(res);
    return { status: isEmpty(data) ? "empty" : "ok", endpoint: ENDPOINT, data, durationMs: Date.now() - t0 };
  } catch (e) {
    return { status: "error", endpoint: ENDPOINT, data: empty, durationMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

const pickEntities = (res: InsightsEntitiesResponse): Entity[] =>
  (res.results?.entities ?? []).map(fromInsightEntity);
const noEntities = (d: Entity[]) => d.length === 0;
const ids = (xs: string[]) => xs.join(",");

export interface RecommendOptions {
  take?: number;
  excludeEntityIds?: string[];
  tagIds?: string[];
  popularityMin?: number;
  popularityMax?: number;
  trends?: "low" | "medium" | "high";
  /** Request per-seed contribution scores (query.explainability). */
  explain?: boolean;
}

/** Recommend entities of `targetType` seeded by `seedIds`. */
export function recommendEntities(
  seedIds: string[],
  targetType: EntityTypeUrn = ENTITY_TYPES.artist,
  o: RecommendOptions = {},
) {
  return run<InsightsEntitiesResponse, Entity[]>(
    {
      "filter.type": targetType,
      "signal.interests.entities": ids(seedIds),
      "filter.exclude.entities": o.excludeEntityIds?.length ? ids(o.excludeEntityIds) : undefined,
      "filter.tags": o.tagIds?.length ? ids(o.tagIds) : undefined,
      "filter.popularity.min": o.popularityMin,
      "filter.popularity.max": o.popularityMax,
      "bias.trends": o.trends,
      "feature.explainability": o.explain || undefined,
      take: o.take ?? 15,
    },
    pickEntities,
    noEntities,
    [],
  );
}

/**
 * Taste profile for the seed entities, restricted to music/entertainment/culture tags.
 * Qloo returns tags for every entity type (restaurants, brands...), so we over-fetch and
 * filter; the result may hold fewer than `take` tags, or none, in which case status is "empty".
 */
export function getTasteTags(seedIds: string[], take = 15) {
  return run<InsightsTagsResponse, Tag[]>(
    { "filter.type": INSIGHT_FILTER_TYPES.tag, "signal.interests.entities": ids(seedIds), take: Math.max(take * 3, 30) },
    (res) => filterCultureTags((res.results?.tags ?? []).map(fromInsightTag)).slice(0, take),
    (d) => d.length === 0,
    [],
  );
}

/** Age/gender affinity for the first seed. Values are signed (-1..1); see scoring/normalize. */
export function getAudienceDemographics(seedIds: string[]) {
  return run<InsightsDemographicsResponse, Demographics | null>(
    { "filter.type": INSIGHT_FILTER_TYPES.demographics, "signal.interests.entities": ids(seedIds) },
    (res) => res.results?.demographics?.[0]?.query ?? null,
    (d) => d == null,
    null,
  );
}

/**
 * Demographics for several entities in ONE call (verified: the response holds one
 * { entity_id, query } per requested ID). Returns a map keyed by entity ID; entities Qloo
 * has no data for are simply absent.
 */
export function getDemographicsBatch(entityIds: string[]) {
  return run<InsightsDemographicsResponse, Map<string, Demographics>>(
    { "filter.type": INSIGHT_FILTER_TYPES.demographics, "signal.interests.entities": ids(entityIds) },
    (res) => new Map((res.results?.demographics ?? []).map((d) => [d.entity_id, d.query] as const)),
    (d) => d.size === 0,
    new Map(),
  );
}

/** Rank a fixed shortlist against the seed using filter.results.entities. */
export function rankShortlist(
  seedIds: string[],
  optionIds: string[],
  optionType: EntityTypeUrn = ENTITY_TYPES.artist,
) {
  return run<InsightsEntitiesResponse, Entity[]>(
    {
      "filter.type": optionType,
      "signal.interests.entities": ids(seedIds),
      "filter.results.entities": ids(optionIds),
    },
    pickEntities,
    noEntities,
    [],
  );
}

/** Wrap a lon/lat box as the WKT POLYGON that `filter.location` expects. */
export function boundingBoxWkt(b: { west: number; south: number; east: number; north: number }): string {
  const { west: w, south: s, east: e, north: n } = b;
  return `POLYGON((${w} ${s}, ${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s}))`;
}

/** Affinity heatmap for a bounding box (verified: filter.location with a WKT POLYGON; ~1.9k points for a small NYC box). */
export function getHeatmap(entityId: string, boundingBoxWktString: string) {
  return run<InsightsHeatmapResponse, HeatmapPoint[]>(
    {
      "filter.type": INSIGHT_FILTER_TYPES.heatmap,
      "signal.interests.entities": entityId,
      "filter.location": boundingBoxWktString,
    },
    (res) => res.results?.heatmap ?? [],
    (d) => d.length === 0,
    [],
  );
}

/** Artists associated with a city, via signal.location.query. */
export function getLocationArtists(city: string, o: RecommendOptions = {}) {
  return run<InsightsEntitiesResponse, Entity[]>(
    {
      "filter.type": ENTITY_TYPES.artist,
      "signal.location.query": city,
      "bias.trends": o.trends,
      take: o.take ?? 10,
    },
    pickEntities,
    noEntities,
    [],
  );
}
