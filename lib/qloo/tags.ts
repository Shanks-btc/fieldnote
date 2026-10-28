import { qlooGet } from "./client";
import { fromTagSearchResult } from "./normalize";
import type { QlooResult, Tag, TagSearchResponse } from "./types";

/**
 * GET /v2/tags — resolve free text ("indie rock") to tag IDs for filter.tags.
 * Response is { results: { tags: [...] } } and tags use `id` (not `tag_id`).
 * Free text can match non-music categories (e.g. "urn:tag:decor:qloo:indie_rock"); pass
 * results through filterCultureTags or check `category` before using them.
 */
export async function searchTags(query: string, take = 5): Promise<QlooResult<Tag[]>> {
  const endpoint = "/v2/tags";
  const t0 = Date.now();
  try {
    const res = await qlooGet<TagSearchResponse>(endpoint, { "filter.query": query, take });
    const tags = (res.results?.tags ?? []).map(fromTagSearchResult);
    return { status: tags.length ? "ok" : "empty", endpoint, data: tags, durationMs: Date.now() - t0 };
  } catch (e) {
    return { status: "error", endpoint, data: [], durationMs: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}
