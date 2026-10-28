import { qlooGet } from "./client";
import { fromSearchEntity } from "./normalize";
import type { Entity, EntityTypeUrn, QlooResult, SearchResponse } from "./types";

/**
 * GET /search. Returns every candidate so callers can resolve ambiguity (needs_input);
 * use pickBestMatch() from ./normalize for the common "take the obvious one" case.
 * Search results carry popularity but no affinity score.
 */
export async function searchEntities(
  query: string,
  type?: EntityTypeUrn,
  take = 5,
): Promise<QlooResult<Entity[]>> {
  const endpoint = "/search";
  const t0 = Date.now();
  try {
    const res = await qlooGet<SearchResponse>(endpoint, { query, types: type, take });
    const entities = (res.results ?? []).map(fromSearchEntity);
    return {
      status: entities.length ? "ok" : "empty",
      endpoint,
      data: entities,
      durationMs: Date.now() - t0,
    };
  } catch (e) {
    return { status: "error", endpoint, data: [], durationMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}
