import { searchEntities } from "@/lib/qloo/search";
import { pickBestMatch } from "@/lib/qloo/normalize";
import { isCultureTag } from "@/lib/qloo/tagFilter";
import { getAudienceDemographics, getDemographicsBatch, getTasteTags, recommendByTags, recommendEntities } from "@/lib/qloo/insights";
import { searchTags } from "@/lib/qloo/tags";
import { ENTITY_TYPES, type Demographics, type Entity, type EntityTypeUrn, type QlooResult, type Tag } from "@/lib/qloo/types";
import { evaluateArtists, type LlmEvaluation } from "@/lib/llm/evaluate";
import { extractSearchTerms } from "@/lib/llm/terms";
import { inferAudience as inferAudienceFromBrief } from "@/lib/llm/audience";
import { compositeScore } from "@/lib/scoring/engine";
import { dedupeArtists } from "./dedupe";
import { demographicSimilarity, minMaxRescale } from "@/lib/scoring/normalize";
import { briefMode, briefTitle, type Brief, type ProjectType } from "@/lib/validation/brief";
import type { Recommendation } from "@/lib/validation/results";
import type { ProjectInfo, StepStatus, TasteGraphDomain, TasteTagView } from "./types";

/** Mutable state threaded through the steps. Each step reads what earlier steps produced. */
export interface RunContext {
  brief: Brief;
  project: Entity | null;
  tasteProfile: TasteTagView[];
  demographics: Demographics | null;
  /** Set when `demographics` was estimated from the brief (description mode) rather than read from Qloo. */
  inferredAudience: { reasoning: string } | null;
  candidates: Entity[];
  recommendations: Recommendation[];
  /** LLM creative-fit evaluations keyed by Qloo entity id (only artists whose call succeeded). */
  evaluations: Map<string, LlmEvaluation>;
  creative: { model: string; evaluated: number; candidates: number } | null;
  /** Qloo domains that returned data for the project ('tv', 'film', ...): its own plus every one the taste graph reached. */
  domains: string[];
  tasteGraph: TasteGraphDomain[];
  /**
   * "entity": the brief names a project and the run follows its Qloo entity. "description": no entity (none
   * named, or the name matched nothing plausible), so artists are found from the brief's own words.
   */
  mode: "entity" | "description";
  /** Genre terms read from the brief (description mode). */
  searchTerms: string[];
  /** Artists the brief names or points to (description mode); they seed similarity searches. */
  termArtists: string[];
  warnings: string[];
}

export interface StepOutcome {
  status: Exclude<StepStatus, "pending" | "running">;
  summary?: string;
  error?: string;
  /** Overrides the catalogue's endpoint label when the step learns which call it actually made. */
  endpoint?: string;
}

export function newContext(brief: Brief): RunContext {
  return { brief, project: null, tasteProfile: [], demographics: null, inferredAudience: null, candidates: [], recommendations: [], evaluations: new Map(), creative: null, domains: [], tasteGraph: [], mode: briefMode(brief), searchTerms: [], termArtists: [], warnings: [] };
}

export function projectInfo(ctx: RunContext): ProjectInfo | null {
  const p = ctx.project;
  return p ? { id: p.id, name: p.name, kind: p.kind, imageUrl: p.imageUrl } : null;
}

const SHORTLIST_SIZE = 10;
const CANDIDATE_POOL = 25;
/** Extra artists requested so the pool is still full after duplicates are merged. */
const DEDUPE_HEADROOM = 5;


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One more try for a Qloo call that errored (timeouts and 429s are usually transient). */
async function retryOnce<T extends { status: string }>(call: () => Promise<T>): Promise<T> {
  const first = await call();
  if (first.status !== "error") return first;
  await sleep(800);
  return call();
}

// ---------- 1. resolveProject ----------

/**
 * Domains searched for each project type, home domain first. A title is often in more than one
 * (a TV series with a same-named film), and the dropdown is only the user's guess, so the
 * neighbouring domain is searched too and the better-known match wins.
 */
const SEARCH_TYPES: Record<ProjectType, EntityTypeUrn[]> = {
  tv_series: [ENTITY_TYPES.tvShow, ENTITY_TYPES.movie],
  film: [ENTITY_TYPES.movie, ENTITY_TYPES.tvShow],
  advertising: [ENTITY_TYPES.brand],
  trailer: [ENTITY_TYPES.movie, ENTITY_TYPES.tvShow],
  video_game: [ENTITY_TYPES.videoGame],
  documentary: [ENTITY_TYPES.movie, ENTITY_TYPES.tvShow],
  podcast: [ENTITY_TYPES.podcast],
  music_video: [ENTITY_TYPES.artist],
  other: [ENTITY_TYPES.tvShow, ENTITY_TYPES.movie, ENTITY_TYPES.brand],
};

/** Searched, after the dropdown's own domains, when they hold no well-known match. */
const FALLBACK_TYPES: EntityTypeUrn[] = [
  ENTITY_TYPES.tvShow,
  ENTITY_TYPES.movie,
  ENTITY_TYPES.brand,
  ENTITY_TYPES.videoGame,
  ENTITY_TYPES.book,
  ENTITY_TYPES.podcast,
  ENTITY_TYPES.artist,
];

/** An exact match at least this well known is trusted without searching other domains. */
const CONFIDENT_POPULARITY = 0.6;

const DOMAIN_LABEL: Partial<Record<EntityTypeUrn, string>> = {
  [ENTITY_TYPES.book]: "books",
  [ENTITY_TYPES.podcast]: "podcasts",
  [ENTITY_TYPES.artist]: "music",
  [ENTITY_TYPES.tvShow]: "tv",
  [ENTITY_TYPES.movie]: "film",
  [ENTITY_TYPES.brand]: "brands",
  [ENTITY_TYPES.videoGame]: "games",
};

/** A match in another domain replaces the home-domain one only when it is clearly better known. */
const SWITCH_MARGIN = 0.2;

const normTitle = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * A near match counts only when it plausibly IS the title. Either it contains the whole title ("Stranger
 * Things: Tales from '85" for "Stranger Things"), or the title contains it and it is a name in its own right,
 * two words or more ("Stranger Things 5" holds "Stranger Things"). Sharing some words is not enough: "Beat"
 * and "Running Through The Beat" are both wrong for "Running afro beat".
 */
function looselyMatches(found: string, wanted: string): boolean {
  const a = normTitle(found);
  const b = normTitle(wanted);
  if (!a || !b) return false;
  if (a.includes(b)) return true;
  return b.includes(a) && a.split(" ").length >= 2;
}

const wordsOf = (x: string) => new Set(normTitle(x).split(" ").filter(Boolean));

/** Among plausible near matches, the one sharing the most words with the title wanted, then the most popular. */
function closestMatch(candidates: Entity[], wanted: string): Entity | null {
  const w = wordsOf(wanted);
  const scored = candidates
    .filter((c) => looselyMatches(c.name, wanted))
    .map((c) => ({ c, shared: [...wordsOf(c.name)].filter((t) => w.has(t)).length }))
    .sort((a, b) => b.shared - a.shared || (b.c.popularity ?? -1) - (a.c.popularity ?? -1));
  return scored[0]?.c ?? null;
}

const isExact = (e: Entity | null, name: string): e is Entity => !!e && e.name.trim().toLowerCase() === name.trim().toLowerCase();

interface DomainSearch {
  type: EntityTypeUrn;
  error?: string;
  exact: Entity | null;
  near: Entity | null;
}

async function searchDomain(name: string, type: EntityTypeUrn): Promise<DomainSearch> {
  let res = await searchEntities(name, type, 10);
  if (res.status === "error") return { type, error: res.error ?? "search failed", exact: null, near: null };
  let best = pickBestMatch(res.data, name);
  if (!isExact(best, name)) {
    // Before settling for a near match ("Stranger" for "Stranger Things"), cast a wider net for the exact title.
    const wider = await searchEntities(name, type, 25);
    if (wider.status !== "error" && wider.data.length) {
      res = wider;
      best = pickBestMatch(wider.data, name);
    }
  }
  if (isExact(best, name)) return { type, exact: best, near: null };
  return { type, exact: null, near: closestMatch(res.data, name) };
}

const typeName = (t: EntityTypeUrn) => t.replace("urn:entity:", "");

/**
 * Home domain wins unless another domain's exact match is clearly better known: the title is a
 * TV series, not the obscure film that happens to share its name.
 */
function chooseMatch(searches: DomainSearch[], homeType: EntityTypeUrn): DomainSearch | undefined {
  const exacts = searches.filter((x) => x.exact);
  const home = exacts.find((x) => x.type === homeType);
  const strongest = [...exacts].sort((x, y) => (y.exact!.popularity ?? 0) - (x.exact!.popularity ?? 0))[0];
  return home && strongest && strongest !== home && (strongest.exact!.popularity ?? 0) >= (home.exact!.popularity ?? 0) + SWITCH_MARGIN
    ? strongest
    : (home ?? strongest);
}

export async function resolveProject(ctx: RunContext): Promise<StepOutcome> {
  const name = ctx.brief.projectName;
  const types = SEARCH_TYPES[ctx.brief.projectType];
  const searches = await Promise.all(types.map((t) => searchDomain(name, t)));

  // The project-type dropdown is a hint, not a constraint: when its domains hold no well-known
  // match, look everywhere else too and take the best-known entity with that exact name.
  let chosen = chooseMatch(searches, types[0]);
  if (!chosen || (chosen.exact!.popularity ?? 0) < CONFIDENT_POPULARITY) {
    const rest = FALLBACK_TYPES.filter((t) => !types.includes(t));
    searches.push(...(await Promise.all(rest.map((t) => searchDomain(name, t)))));
    chosen = chooseMatch(searches, types[0]);
  }

  if (chosen) {
    const best = chosen.exact!;
    ctx.project = best;
    const other = searches.find((x) => x.exact && x !== chosen && types.includes(x.type));
    const note = !types.includes(chosen.type)
      ? `; not found as ${typeName(types[0])}, so other domains were searched`
      : other
        ? `; preferred over the ${typeName(other.type)} of the same name (popularity ${(other.exact!.popularity ?? 0).toFixed(2)})`
        : "";
    return {
      status: "ok",
      endpoint: `GET /search (${chosen.type})`,
      summary: `Matched "${best.name}" as ${typeName(chosen.type)}${best.popularity != null ? `, popularity ${best.popularity.toFixed(2)}` : ""}${note}`,
    };
  }

  const near = searches.find((x) => x.near);
  if (near) {
    ctx.project = near.near;
    ctx.warnings.push(`No exact match for "${name}" in Qloo; using the closest result, "${near.near!.name}".`);
    return {
      status: "partial",
      endpoint: `GET /search (${near.type})`,
      summary: `No exact match; using closest result "${near.near!.name}"`,
    };
  }
  const errors = searches.map((x) => x.error).filter((e): e is string => !!e);
  if (errors.length === searches.length) return { status: "error", error: errors[0] };
  // Qloo answered, but nothing in it plausibly is this title. Rather than build a run on a garbage match,
  // read what the user typed as a description of the sound they want.
  ctx.mode = "description";
  ctx.warnings.push(`"${name}" did not match a known title in Qloo, so artists were found from the brief's description instead.`);
  return { status: "partial", summary: `No Qloo match for "${name}"; using the brief as a description` };
}

// ---------- 2. getProjectTasteProfile ----------

const SEARCH_TAG_LIMIT = 24;
const SEARCH_TAGS_PER_CATEGORY = 4;

/**
 * Categories of the project's own /search tags worth showing, in priority order. Excluded on
 * purpose: urn:tag:keyword:media (a ~175-tag Wikipedia-style dump that includes slurs and
 * plot trivia) and urn:tag:character:qloo (character traits, not music-relevant).
 */
const SEARCH_TAG_CATEGORIES = [
  "urn:tag:style:qloo",
  "urn:tag:theme:qloo",
  "urn:tag:genre:qloo",
  "urn:tag:genre:media",
  "urn:tag:subgenre:qloo",
  "urn:tag:audience:qloo",
  "urn:tag:interests:qloo",
  "urn:tag:plot:qloo",
  "urn:tag:keyword:qloo",
  "urn:tag:archetype:qloo",
];

/**
 * Domains read for cross-domain taste. Music is the answer, so it is queried in step 4; these are the
 * rest of the graph. A project's own domain is included: its neighbours there are evidence too.
 * Qloo has data for each of these for well-known titles (verified for Stranger Things) and 400s
 * for types like album, author and director, which are left out.
 */
const TASTE_DOMAINS: { key: string; type: EntityTypeUrn }[] = [
  { key: "tv", type: ENTITY_TYPES.tvShow },
  { key: "film", type: ENTITY_TYPES.movie },
  { key: "podcasts", type: ENTITY_TYPES.podcast },
  { key: "books", type: ENTITY_TYPES.book },
  { key: "games", type: ENTITY_TYPES.videoGame },
  { key: "brands", type: ENTITY_TYPES.brand },
  { key: "people", type: ENTITY_TYPES.person },
];
const TASTE_GRAPH_TAKE = 5;
/** One slow domain must not hold the step: whatever has answered by then is used. */
const TASTE_GRAPH_BUDGET_MS = 6000;

async function exploreTasteGraph(project: Entity): Promise<TasteGraphDomain[]> {
  const found: TasteGraphDomain[] = [];
  const reads = TASTE_DOMAINS.map(async ({ key, type }) => {
    const res = await recommendEntities([project.id], type, { take: TASTE_GRAPH_TAKE + 1 });
    const entities = res.data.filter((e) => e.id !== project.id).map((e) => e.name).slice(0, TASTE_GRAPH_TAKE);
    if (entities.length) found.push({ key, entities });
  });
  await Promise.race([Promise.all(reads), sleep(TASTE_GRAPH_BUDGET_MS)]);
  // Report in catalogue order whatever finished first.
  return TASTE_DOMAINS.map((d) => found.find((f) => f.key === d.key)).filter((f): f is TasteGraphDomain => !!f);
}

export async function getProjectTasteProfile(ctx: RunContext): Promise<StepOutcome> {
  if (ctx.mode === "description") return { status: "skipped", summary: "Not applicable: no matching project, so there is no taste graph to read" };
  const project = ctx.project!;
  const seen = new Set<string>();
  const seenNames = new Set<string>();
  const profile: TasteTagView[] = [];

  // Primary: the project's own tags from /search, a few per curated category so the profile
  // is varied (style, theme, genre, audience...) rather than dominated by one noisy category.
  for (const category of SEARCH_TAG_CATEGORIES) {
    let taken = 0;
    for (const t of project.tags) {
      if (t.type !== category || taken >= SEARCH_TAGS_PER_CATEGORY || profile.length >= SEARCH_TAG_LIMIT) continue;
      const name = t.name?.trim();
      if (!name || seen.has(t.id) || seenNames.has(name.toLowerCase())) continue;
      if (!isCultureTag({ id: t.id, name, category: t.type, appliesTo: [], affinity: null })) continue;
      seen.add(t.id);
      seenNames.add(name.toLowerCase());
      profile.push({ id: t.id, name, category: t.type, source: "search" });
      taken++;
    }
  }
  const fromSearch = profile.length;

  // Supplement: Qloo's audience taste tags (already filtered to music/culture), read alongside the
  // project's neighbours in every other domain so the run uses the whole taste graph.
  const [res, graph] = await Promise.all([getTasteTags([project.id], 15), exploreTasteGraph(project)]);
  ctx.tasteGraph = graph;
  const own = DOMAIN_LABEL[project.kind as EntityTypeUrn];
  ctx.domains = [...new Set([...(own ? [own] : []), ...graph.map((g) => g.key)])];
  let fromInsights = 0;
  for (const t of res.data) {
    if (seen.has(t.id) || seenNames.has(t.name.toLowerCase())) continue;
    seen.add(t.id);
    seenNames.add(t.name.toLowerCase());
    profile.push({ id: t.id, name: t.name, category: t.category, source: "insights" });
    fromInsights++;
  }
  ctx.tasteProfile = profile;

  if (res.status === "error") {
    ctx.warnings.push("Qloo's audience taste tags could not be retrieved; using the project's own tags only.");
  }
  const summary = `${profile.length} tags (${fromSearch} from the project, ${fromInsights} from audience data); taste graph read in ${graph.length} other domain${graph.length === 1 ? "" : "s"}`;
  if (!profile.length) return { status: "empty", summary: "No usable taste tags returned" };
  return res.status === "error" ? { status: "partial", summary, error: res.error } : { status: "ok", summary };
}

// ---------- 3. getProjectDemographics ----------

export async function getProjectDemographics(ctx: RunContext): Promise<StepOutcome> {
  if (ctx.mode === "description") return { status: "skipped", summary: "Not applicable: audience demographics need a matching project" };
  const res = await retryOnce(() => getAudienceDemographics([ctx.project!.id]));
  if (res.data) {
    ctx.demographics = res.data;
    const age = res.data.age;
    const top = (Object.entries(age) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
    const female = res.data.gender.female;
    return {
      status: "ok",
      summary: `Over-indexes ${top[0].replace(/_/g, " ")} (${top[1] >= 0 ? "+" : ""}${top[1].toFixed(2)}); ${female >= 0 ? "female" : "male"} skew ${Math.abs(female).toFixed(2)}`,
    };
  }
  ctx.warnings.push("Audience demographics were unavailable, so audience relevance is not scored.");
  return res.status === "error"
    ? { status: "error", error: res.error }
    : { status: "empty", summary: "Qloo has no demographics for this project" };
}

// ---------- 4. recommendArtists ----------

export async function recommendArtists(ctx: RunContext): Promise<StepOutcome> {
  // The title matched nothing plausible: find artists from the brief's description instead.
  if (ctx.mode === "description") return describedArtists(ctx);
  const project = ctx.project!;
  const res = await recommendEntities([project.id], ENTITY_TYPES.artist, { take: CANDIDATE_POOL + DEDUPE_HEADROOM + 1 });
  // Some titles are in Qloo's search but are no use as a seed (it answers 400 "signal.interests.entities were
  // invalid") or have no neighbours at all. Rather than end the run, read the brief as a description.
  const unusableSeed = res.status === "empty" || (res.status === "error" && /signal\.interests\.entities.*invalid|invalid.*signal\.interests\.entities/i.test(res.error ?? ""));
  if (unusableSeed) {
    ctx.mode = "description";
    ctx.warnings.push(`Qloo has no taste data for "${project.name}", so artists were found from the brief's description instead.`);
    return describedArtists(ctx);
  }
  res.data = res.data.filter((e) => e.id !== project.id); // an artist project is not its own recommendation
  // Merge the same act under two billings (e.g. "Nick Cave" and "Nick Cave & the Bad Seeds"), keeping the higher affinity.
  const { kept, merged } = dedupeArtists(res.data);
  ctx.candidates = kept.slice(0, CANDIDATE_POOL);
  if (res.status === "error") return { status: "error", error: res.error };
  if (res.status === "empty") return { status: "empty", summary: "Qloo returned no artists for this project" };
  const aff = ctx.candidates.map((e) => e.affinity).filter((a): a is number => a != null);
  const range = aff.length ? `, affinity ${Math.min(...aff).toFixed(3)}–${Math.max(...aff).toFixed(3)}` : "";
  const dupes = merged ? ` (${merged} duplicate${merged === 1 ? "" : "s"} merged)` : "";
  return { status: "ok", summary: `${ctx.candidates.length} artists returned${dupes}${range}` };
}

// ---------- description mode: artists from the brief's own words ----------

const MAX_GENRE_TERMS = 5;
const MAX_ARTIST_SEEDS = 3;
const PER_SOURCE_TAKE = 15;
/** Pull for an artist that several terms agree on. */
const AGREEMENT_BONUS = 0.1;

/** Everything the user wrote that says what they want, as one piece of text for term extraction. */
function descriptionText(brief: Brief): string {
  return [
    brief.projectName,
    brief.sceneDescription,
    brief.mood && `Mood: ${brief.mood}`,
    brief.genrePreferences.length > 0 && `Genres: ${brief.genrePreferences.join(", ")}`,
    brief.culturalReferences.length > 0 && `References: ${brief.culturalReferences.join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");
}

export async function analyzeBrief(ctx: RunContext): Promise<StepOutcome> {
  const terms = await extractSearchTerms(ctx.brief, descriptionText(ctx.brief));
  ctx.searchTerms = terms.genres;
  ctx.termArtists = terms.artists;
  const all = [...terms.genres, ...terms.artists];
  if (!all.length) return { status: "empty", summary: "No searchable music terms found in the brief" };
  return {
    status: terms.source === "llm" ? "ok" : "partial",
    summary: `${all.length} search term${all.length === 1 ? "" : "s"}: ${all.slice(0, 6).join(", ")}${terms.source === "keywords" ? " (taken from the brief's own words)" : ""}`,
  };
}

/** Only music-genre tags give music back; free text also matches tags for places, decor and film genres. */
function pickGenreTag(tags: Tag[], term: string): Tag | null {
  const music = tags.filter((t) => t.category === "urn:tag:genre:music");
  const want = normTitle(term).replace(/ /g, "");
  return music.find((t) => normTitle(t.name).replace(/ /g, "") === want) ?? music[0] ?? null;
}

/**
 * Finds artists for a description: each genre term becomes a Qloo genre tag and the tag's artists, and any
 * artists the brief names become similarity seeds. Name search is not used: searching artists for "jazz"
 * returns acts called Jazzanova. Each source is rescaled on its own, then merged, with a small bonus for
 * artists several sources agree on.
 */
export async function searchArtists(ctx: RunContext): Promise<StepOutcome> {
  type Source = { label: string; list: Entity[] };

  const genreReads = ctx.searchTerms.slice(0, MAX_GENRE_TERMS).map(async (term): Promise<Source | null> => {
    const tags = await searchTags(term, 8);
    const tag = pickGenreTag(tags.data, term);
    if (!tag) return null;
    const res = await recommendByTags([tag.id], PER_SOURCE_TAKE);
    return res.data.length ? { label: tag.name, list: res.data } : null;
  });

  const seedRead = (async (): Promise<Source | null> => {
    const found = await Promise.all(
      ctx.termArtists.slice(0, MAX_ARTIST_SEEDS).map(async (name) => {
        const hit = pickBestMatch((await searchEntities(name, ENTITY_TYPES.artist, 5)).data, name);
        return hit && hit.name.trim().toLowerCase() === name.trim().toLowerCase() ? hit : null;
      }),
    );
    const seeds = found.filter((x): x is Entity => !!x);
    if (!seeds.length) return null;
    const res = await recommendEntities(
      seeds.map((x) => x.id),
      ENTITY_TYPES.artist,
      { take: PER_SOURCE_TAKE },
    );
    return res.data.length ? { label: `like ${seeds.map((x) => x.name).join(", ")}`, list: res.data } : null;
  })();

  const sources = (await Promise.all([...genreReads, seedRead])).filter((x): x is Source => !!x);
  if (!sources.length) {
    return { status: "empty", summary: "Qloo had no artists for these terms" };
  }

  const byId = new Map<string, { e: Entity; best: number; hits: number }>();
  for (const { list } of sources) {
    const rel = minMaxRescale(list.map((e) => e.affinity));
    list.forEach((e, i) => {
      const r = rel[i] ?? 0;
      const cur = byId.get(e.id);
      if (cur) {
        cur.best = Math.max(cur.best, r);
        cur.hits++;
      } else {
        byId.set(e.id, { e, best: r, hits: 1 });
      }
    });
  }
  // The merged score stands in for Qloo's affinity from here on (cultural fit is rescaled from it).
  const ranked = [...byId.values()]
    .map(({ e, best, hits }) => ({ ...e, affinity: Math.min(1, best + AGREEMENT_BONUS * (hits - 1)) }))
    .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
  const { kept, merged: dupes } = dedupeArtists(ranked);
  ctx.candidates = kept.slice(0, CANDIDATE_POOL);

  const labels = sources.map((x) => x.label).slice(0, 4).join(", ");
  return {
    status: "ok",
    endpoint: "GET /v2/tags + GET /v2/insights (urn:entity:artist)",
    summary: `${ctx.candidates.length} artists from ${sources.length} source${sources.length === 1 ? "" : "s"} (${labels})${dupes ? `, ${dupes} duplicate${dupes === 1 ? "" : "s"} merged` : ""}`,
  };
}

/**
 * No Qloo project means no audience to read, so the model estimates one from the project type and scene.
 * It stands in for the project's demographics: each artist's real Qloo demographics are compared against it.
 */
export async function inferAudience(ctx: RunContext): Promise<StepOutcome> {
  const inferred = await inferAudienceFromBrief(ctx.brief);
  if (!inferred) {
    ctx.warnings.push("The target audience could not be inferred from the brief, so audience relevance is not scored.");
    return { status: "error", error: "Language model unavailable for audience inference" };
  }
  ctx.demographics = inferred.demographics;
  ctx.inferredAudience = { reasoning: inferred.reasoning };
  const top = (Object.entries(inferred.demographics.age) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  const male = inferred.demographics.gender.male;
  const gender = male === 0 ? "gender balanced" : `${male > 0 ? "male" : "female"} skew ${Math.abs(male).toFixed(2)}`;
  return { status: "ok", summary: `Estimated audience: ${top[0].replace(/_/g, " ")}, ${gender}. ${inferred.reasoning}` };
}

/** Entity runs that fall back to description mode partway: the description track's steps, run inside "Find artists". */
async function describedArtists(ctx: RunContext): Promise<StepOutcome> {
  await analyzeBrief(ctx);
  const found = await searchArtists(ctx);
  if (found.status === "ok") await inferAudience(ctx);
  return found;
}

// ---------- 5. scoreAndRank ----------

const ARTIST_TAG_CATEGORY = /^urn:tag:(genre|subgenre|style|theme|music)\b/;

const artistTagsOf = (e: Entity) =>
  [...new Set(e.tags.filter((t) => ARTIST_TAG_CATEGORY.test(t.type)).map((t) => t.name))].slice(0, 8);

const KIND_LABEL: Record<string, string> = {
  "urn:entity:podcast": "podcast",
  "urn:entity:tv_show": "TV series",
  "urn:entity:movie": "film",
  "urn:entity:brand": "brand",
  "urn:entity:videogame": "video game",
  "urn:entity:book": "book",
  "urn:entity:artist": "artist",
};

/** What Qloo resolved the title as. The project type the user picked is passed separately: it says what the music is for. */
function projectKindLabel(ctx: RunContext): string {
  if (!ctx.project) return "no matching title";
  return KIND_LABEL[ctx.project.kind] ?? ctx.project.kind.replace(/^urn:entity:/, "").replace(/_/g, " ");
}

export async function scoreAndRank(ctx: RunContext): Promise<StepOutcome> {
  const pool = ctx.candidates;

  // Audience relevance (one batched Qloo call) and creative fit (one LLM call per artist) are
  // independent, so they run together.
  const demosPromise: Promise<QlooResult<Map<string, Demographics>> | null> = ctx.demographics
    ? retryOnce(() => getDemographicsBatch(pool.map((e) => e.id)))
    : Promise.resolve(null);
  const llmPromise = evaluateArtists(
    ctx.brief,
    pool.map((e) => ({ id: e.id, name: e.name, tags: artistTagsOf(e) })),
    {
      projectName: ctx.project?.name ?? briefTitle(ctx.brief),
      mode: ctx.mode,
      tasteTags: ctx.mode === "description" ? ctx.searchTerms : ctx.tasteProfile.map((t) => t.name),
      qlooDomains: ctx.project ? [ctx.project.kind.replace(/^urn:entity:/, ""), "artist", "tags", "demographics"] : ["artist", "tags"],
      projectKind: projectKindLabel(ctx),
      tasteGraph: ctx.tasteGraph.map((g) => `${g.key}: ${g.entities.join(", ")}`),
    },
  ).catch((e) => {
    console.error("LLM evaluation step failed:", e instanceof Error ? e.message : e);
    return null;
  });
  const [artistDemos, batch] = await Promise.all([demosPromise, llmPromise]);

  let creativeNote = "";
  if (batch) {
    ctx.evaluations = batch.evaluations;
    if (batch.evaluations.size) {
      creativeNote = `; creative fit scored by ${batch.model}`;
      ctx.creative = { model: batch.model, evaluated: batch.evaluations.size, candidates: pool.length };
    }
    if (batch.failed.length && batch.evaluations.size) {
      ctx.warnings.push(
        `Creative fit could not be scored for ${batch.failed.length} of ${pool.length} candidate artists; those are ranked on the remaining dimensions.`,
      );
    }
  }
  if (!ctx.evaluations.size) {
    ctx.warnings.push(
      "Creative fit scoring is temporarily unavailable. Results are ranked by cultural fit and audience overlap.",
    );
  }

  const sims = pool.map((e) => demographicSimilarity(ctx.demographics, artistDemos?.data.get(e.id)));

  const cultural = minMaxRescale(pool.map((e) => e.affinity));
  const audience = minMaxRescale(sims);
  const projectTagIds = new Set(ctx.tasteProfile.map((t) => t.id));

  const scored = pool.map((e, i) => {
    const creativeFit = ctx.evaluations.get(e.id)?.creativeFitScore ?? null;
    const composite = compositeScore({ creativeFit, culturalFit: cultural[i], audienceRelevance: audience[i] }) ?? 0;
    return { e, i, composite, creativeFit };
  });
  scored.sort((a, b) => b.composite - a.composite || (b.e.popularity ?? 0) - (a.e.popularity ?? 0));

  ctx.recommendations = scored.slice(0, SHORTLIST_SIZE).map(({ e, i, composite, creativeFit }, idx) => {
    const artistTags = artistTagsOf(e);
    return {
      rank: idx + 1,
      qlooEntityId: e.id,
      artistName: e.name,
      trackName: null,
      imageUrl: e.imageUrl,
      previewUrl: null,
      spotifyArtistId: e.spotifyId,
      spotifyUrl: e.spotifyId ? `https://open.spotify.com/artist/${e.spotifyId}` : null,
      scores: { creativeFit, culturalFit: cultural[i], audienceRelevance: audience[i], composite },
      evidence: {
        artistTags,
        sharedTags: e.tags.filter((t) => t.id && projectTagIds.has(t.id)).map((t) => t.name),
        // In description mode affinity is a merged, rescaled score, not Qloo's raw value, so it is not shown as one.
        rawAffinity: ctx.mode === "description" ? null : e.affinity,
        popularity: e.popularity,
        demographics: artistDemos?.data.get(e.id) ?? null,
        geographicOverlap: null,
        trendDirection: "unknown",
      },
      explanation: "",
      reasoning: ctx.evaluations.get(e.id)?.reasoning ?? null,
    };
  });

  const n = ctx.recommendations.length;
  if (!n) return { status: "empty", summary: "Nothing to rank" };
  const creativeMissing = ctx.evaluations.size < pool.length;
  if (ctx.mode === "description" && !ctx.demographics) {
    return {
      status: creativeMissing ? "partial" : "ok",
      summary: `Ranked ${n} of ${pool.length} artists on genre relevance and creative fit${creativeNote}`,
    };
  }
  if (!ctx.demographics) {
    return { status: "partial", summary: `Ranked ${n} artists without audience scoring (no project demographics)${creativeNote}` };
  }
  if (!artistDemos || artistDemos.status === "error") {
    ctx.warnings.push("Artist demographics could not be retrieved, so audience relevance is not scored.");
    return { status: "partial", summary: `Ranked ${n} artists without audience scoring${creativeNote}`, error: artistDemos?.error };
  }
  const missing = pool.filter((e) => !artistDemos.data.has(e.id)).length;
  const against = ctx.inferredAudience ? "; audience compared with the inferred target audience" : "";
  return {
    status: missing || creativeMissing ? "partial" : "ok",
    summary: `Ranked ${n} of ${pool.length} artists${against}${missing ? `; ${missing} had no demographics` : ""}${creativeNote}`,
  };
}

// ---------- 6. generateExplanations ----------

/** Data-only sentence for artists the LLM did not cover, so a failed call never leaves a blank. */
function dataSummary(r: Recommendation, project: string, audienceOf: string): string {
  const parts = [
    r.evidence.rawAffinity == null
      ? `${r.artistName} matches the genres read from ${project}, ranked #${r.rank} on the combined score.`
      : `Qloo links ${r.artistName} to ${project} with a raw affinity of ${r.evidence.rawAffinity.toFixed(3)}, ranked #${r.rank} on the combined score.`,
  ];
  if (r.scores.audienceRelevance != null) {
    parts.push(`Its audience's age and gender profile scores ${r.scores.audienceRelevance.toFixed(2)} against the ${audienceOf} within this shortlist.`);
  }
  if (r.evidence.artistTags.length) parts.push(`Qloo tags: ${r.evidence.artistTags.slice(0, 5).join(", ")}.`);
  return parts.join(" ");
}

export async function generateExplanations(ctx: RunContext): Promise<StepOutcome> {
  const project = ctx.project?.name ?? briefTitle(ctx.brief);
  let written = 0;
  for (const r of ctx.recommendations) {
    const ev = ctx.evaluations.get(r.qlooEntityId);
    if (ev) {
      r.explanation = ev.explanation;
      r.reasoning = ev.reasoning;
      written++;
    } else {
      r.explanation = dataSummary(r, project, ctx.inferredAudience ? "inferred target audience's" : "project's");
    }
  }
  const total = ctx.recommendations.length;
  if (written === total) return { status: "ok", summary: `Wrote ${written} explanations from the brief and Qloo's data` };
  if (written === 0) return { status: "partial", summary: `Language model unavailable; showing data-only summaries for ${total} artists` };
  return { status: "partial", summary: `Wrote ${written} of ${total} explanations; the rest show data-only summaries` };
}
