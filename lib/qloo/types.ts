/**
 * Qloo API types, matched to real responses captured in scripts/fixtures/
 * (scripts/test-qloo-endpoints.js, run 2026-10-22 against hackathon.api.qloo.com).
 */

export const QLOO_BASE_URL = "https://hackathon.api.qloo.com";

/** Values the API accepts for `types` (taken from its own 400 error message). */
export const ENTITY_TYPES = {
  actor: "urn:entity:actor",
  album: "urn:entity:album",
  artist: "urn:entity:artist",
  author: "urn:entity:author",
  book: "urn:entity:book",
  brand: "urn:entity:brand",
  destination: "urn:entity:destination",
  director: "urn:entity:director",
  locality: "urn:entity:locality",
  movie: "urn:entity:movie",
  person: "urn:entity:person",
  place: "urn:entity:place",
  podcast: "urn:entity:podcast",
  /** Verified. `show`, `tv` and `tv_series` all return 400. */
  tvShow: "urn:entity:tv_show",
  videoGame: "urn:entity:videogame",
} as const;

export type EntityTypeUrn = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/** `filter.type` values for GET /v2/insights (entity types plus the three below). */
export const INSIGHT_FILTER_TYPES = {
  demographics: "urn:demographics",
  tag: "urn:tag",
  heatmap: "urn:heatmap",
} as const;

export type InsightFilterType =
  | EntityTypeUrn
  | (typeof INSIGHT_FILTER_TYPES)[keyof typeof INSIGHT_FILTER_TYPES];

// ---------- request params ----------

export interface InsightsParams {
  "filter.type": InsightFilterType;
  /** Comma-separated entity IDs. */
  "signal.interests.entities"?: string;
  /** Comma-separated tag IDs. */
  "signal.interests.tags"?: string;
  /** Free-text place name, e.g. "Los Angeles". Verified. */
  "signal.location.query"?: string;
  /** WKT point, e.g. "POINT(-118.24 34.05)". */
  "signal.location"?: string;
  /** Heatmap bounding area as a WKT POLYGON. Verified for urn:heatmap. */
  "filter.location"?: string;
  /** Restrict results to this comma-separated set (ranks a shortlist). Verified. */
  "filter.results.entities"?: string;
  "filter.tags"?: string;
  "filter.exclude.entities"?: string;
  "filter.exclude.tags"?: string;
  "filter.popularity.min"?: number;
  "filter.popularity.max"?: number;
  "filter.release_year.min"?: number;
  "filter.release_year.max"?: number;
  /** Not yet exercised. */
  "operator.filter.tags"?: "union" | "intersection";
  /** `high` verified (HTTP 200, lowers top-artist affinity 0.935 -> 0.727). Other values unverified. */
  "bias.trends"?: "low" | "medium" | "high";
  /** Adds query.explainability to each entity. Verified. */
  "feature.explainability"?: boolean;
  take?: number;
}

// ---------- raw response shapes ----------

export interface ExternalIds {
  spotify?: { id: string; verified?: boolean; followers?: number; monthly_listeners?: number }[];
  musicbrainz?: { id: string; artist_type?: string }[];
  lastfm?: { id: string; listeners?: number; scrobbles?: number }[];
  imdb?: { id: string }[];
  wikidata?: { id: string }[];
  [k: string]: unknown;
}

/** Tag embedded on an entity returned by GET /search. */
export interface SearchEntityTag {
  name: string;
  tag_id: string;
  type: string;
  value: string;
}

/** Tag embedded on an entity returned by GET /v2/insights. Note `id`, not `tag_id`. */
export interface InsightEntityTag {
  /** Absent on a few tags that carry only `type`. */
  id?: string;
  name?: string;
  type: string;
}

/**
 * GET /search entity. Has `types` (array) and a nested `external` inside `properties`;
 * no `query.affinity`, no `subtype`.
 */
export interface SearchEntity {
  name: string;
  entity_id: string;
  types: string[];
  /** 0-1. Missing on some low-profile entities. */
  popularity?: number;
  disambiguation: string;
  properties: {
    image?: { url: string };
    short_description?: string;
    external?: Record<string, { id?: string; [k: string]: unknown }>;
    [k: string]: unknown;
  };
  tags: SearchEntityTag[];
}

export interface SearchResponse {
  results: SearchEntity[];
}

export interface ExplainabilityEntry {
  entity_id: string;
  /** Contribution of this seed to the entity's recommendation. */
  score: number;
}

/**
 * GET /v2/insights entity. Has `subtype` (the real entity type) and `type: "urn:entity"`;
 * no `types` array. `external` is top-level here, unlike /search.
 */
export interface InsightEntity {
  name: string;
  entity_id: string;
  type: string;
  subtype: string;
  /** 0-1. */
  popularity: number;
  disambiguation: string;
  properties: {
    image?: { url: string };
    [k: string]: unknown;
  };
  tags: InsightEntityTag[];
  query: {
    /** 0-1 but tightly clustered (e.g. 0.924-0.935 across a top-10). Rescale before use. */
    affinity: number;
    measurements?: { audience_growth?: number };
    /** Only present with feature.explainability=true. */
    explainability?: { "signal.interests.entities"?: ExplainabilityEntry[] };
  };
  external: ExternalIds;
}

export interface InsightsEntitiesResponse {
  success: boolean;
  results: { entities: InsightEntity[] };
  /** Present for location queries (query.localities.signal) and with explainability. */
  query?: Record<string, unknown>;
}

/** GET /v2/insights?filter.type=urn:tag. Tags of ANY entity type come back (places, brands...). */
export interface InsightTag {
  tag_id: string;
  name: string;
  /** Entity types this tag applies to, e.g. ["urn:entity:place"]. */
  types: string[];
  /** Tag category, e.g. "urn:tag:genre:music" or "urn:tag:specialty_dish:place". */
  subtype: string;
  tag_value: string;
  popularity: number;
  query: { affinity: number };
}

export interface InsightsTagsResponse {
  success: boolean;
  results: { tags: InsightTag[] };
}

/** GET /v2/tags entity. Note `id` here (vs `tag_id` on insights tags) and no `types`. */
export interface TagSearchResult {
  id: string;
  name: string;
  type: string;
  popularity: number;
  parents: { type: string }[];
  properties: Record<string, unknown>;
  tags: SearchEntityTag[];
}

export interface TagSearchResponse {
  duration: number;
  success: boolean;
  /** Wrapped in `results.tags`, not a bare `results` array. */
  results: { tags: TagSearchResult[] };
}

/**
 * Demographic affinities are SIGNED (-1..1, 0 = average). Positive means the audience
 * over-indexes in that group. Verified keys below.
 */
export interface DemographicsAge {
  "24_and_younger": number;
  "25_to_29": number;
  "30_to_34": number;
  "35_to_44": number;
  "45_to_54": number;
  "55_and_older": number;
}

export interface Demographics {
  age: DemographicsAge;
  gender: { male: number; female: number };
}

export interface InsightsDemographicsResponse {
  success: boolean;
  results: { demographics: { entity_id: string; query: Demographics }[] };
}

export interface HeatmapPoint {
  location: { latitude: number; longitude: number; geohash: string };
  query: {
    /** 0-1. */
    affinity: number;
    affinity_rank: number;
    popularity: number;
    /** Per-seed-type keys (e.g. entity_tv_show_affinity) also appear; not modelled. */
    [k: string]: number;
  };
}

export interface InsightsHeatmapResponse {
  success: boolean;
  results: { heatmap: HeatmapPoint[] };
}

// ---------- normalized app-level types ----------

export interface Entity {
  id: string;
  name: string;
  /** Entity type URN, e.g. "urn:entity:artist". */
  kind: string;
  /** Raw Qloo affinity (0-1, clustered). Null for /search results, which carry none. */
  affinity: number | null;
  popularity: number | null;
  /** Qloo-hosted image. Usable as album-art fallback. */
  imageUrl: string | null;
  /** Spotify artist ID straight from Qloo (external.spotify[0].id). No name matching needed. */
  spotifyId: string | null;
  tags: { id: string; name: string; type: string }[];
  /** Per-seed contribution; only populated when explainability was requested. */
  explainability: ExplainabilityEntry[];
}

export interface Tag {
  id: string;
  name: string;
  /** Category URN, e.g. "urn:tag:genre:music". */
  category: string;
  /** Entity types the tag applies to. Empty for /v2/tags results. */
  appliesTo: string[];
  affinity: number | null;
}

export type QlooCallStatus = "ok" | "empty" | "error";

export interface QlooResult<T> {
  status: QlooCallStatus;
  /** Which endpoint was hit, shown on the research timeline. */
  endpoint: string;
  data: T;
  durationMs: number;
  error?: string;
}

export class QlooError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "QlooError";
  }
}
