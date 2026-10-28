import type { Entity, InsightEntity, InsightTag, SearchEntity, Tag, TagSearchResult } from "./types";

/** /search entity -> app Entity. Search results carry no affinity. */
export function fromSearchEntity(e: SearchEntity): Entity {
  const ext = e.properties?.external as Record<string, { id?: string }> | undefined;
  return {
    id: e.entity_id,
    name: e.name,
    kind: e.types?.[0] ?? "",
    affinity: null,
    popularity: e.popularity ?? null,
    imageUrl: e.properties?.image?.url ?? null,
    spotifyId: ext?.spotify?.id ?? null,
    tags: (e.tags ?? []).map((t) => ({ id: t.tag_id, name: t.name, type: t.type })),
    explainability: [],
  };
}

/** /v2/insights entity -> app Entity. The real type lives in `subtype`; `type` is just "urn:entity". */
export function fromInsightEntity(e: InsightEntity): Entity {
  return {
    id: e.entity_id,
    name: e.name,
    kind: e.subtype,
    affinity: typeof e.query?.affinity === "number" ? e.query.affinity : null,
    popularity: e.popularity ?? null,
    imageUrl: e.properties?.image?.url ?? null,
    spotifyId: e.external?.spotify?.[0]?.id ?? null,
    tags: (e.tags ?? []).flatMap((t) => (t.id && t.name ? [{ id: t.id, name: t.name, type: t.type }] : [])),
    explainability: e.query?.explainability?.["signal.interests.entities"] ?? [],
  };
}

export function fromInsightTag(t: InsightTag): Tag {
  return {
    id: t.tag_id,
    name: t.name.trim(),
    category: t.subtype,
    appliesTo: t.types,
    affinity: typeof t.query?.affinity === "number" ? t.query.affinity : null,
  };
}

/** /v2/tags result -> app Tag. Uses `id` and carries no affinity. */
export function fromTagSearchResult(t: TagSearchResult): Tag {
  return { id: t.id, name: t.name.trim(), category: t.type, appliesTo: t.parents?.map((p) => p.type) ?? [], affinity: null };
}

/**
 * Pick the best match for a name from /search results. Search can return several entities
 * with the same name (e.g. two "Stranger Things" with popularity 0.9999 and 0.42), so
 * prefer exact name matches, then the most popular.
 */
export function pickBestMatch(candidates: Entity[], query: string): Entity | null {
  if (!candidates.length) return null;
  const q = query.trim().toLowerCase();
  const exact = candidates.filter((c) => c.name.trim().toLowerCase() === q);
  const pool = exact.length ? exact : candidates;
  return [...pool].sort((a, b) => (b.popularity ?? -1) - (a.popularity ?? -1))[0];
}
