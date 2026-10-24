import { searchEntities } from "@/lib/qloo/search";
import { pickBestMatch } from "@/lib/qloo/normalize";
import { isCultureTag } from "@/lib/qloo/tagFilter";
import { getAudienceDemographics, getDemographicsBatch, getTasteTags, recommendEntities } from "@/lib/qloo/insights";
import { ENTITY_TYPES, type Demographics, type Entity, type EntityTypeUrn, type QlooResult } from "@/lib/qloo/types";
import { evaluateArtists, llmConfigured, type LlmEvaluation } from "@/lib/llm/evaluate";
import { compositeScore } from "@/lib/scoring/engine";
import { demographicSimilarity, minMaxRescale } from "@/lib/scoring/normalize";
import type { Brief, ProjectType } from "@/lib/validation/brief";
import type { Recommendation } from "@/lib/validation/results";
import type { ProjectInfo, StepStatus, TasteTagView } from "./types";

/** Mutable state threaded through the steps. Each step reads what earlier steps produced. */
export interface RunContext {
  brief: Brief;
  project: Entity | null;
  tasteProfile: TasteTagView[];
  demographics: Demographics | null;
  candidates: Entity[];
  recommendations: Recommendation[];
  /** LLM creative-fit evaluations keyed by Qloo entity id (only artists whose call succeeded). */
  evaluations: Map<string, LlmEvaluation>;
  creative: { model: string; evaluated: number; candidates: number } | null;
  warnings: string[];
}

export interface StepOutcome {
  status: Exclude<StepStatus, "pending" | "running" | "skipped">;
  summary?: string;
  error?: string;
  /** Overrides the catalogue's endpoint label when the step learns which call it actually made. */
  endpoint?: string;
}

export function newContext(brief: Brief): RunContext {
  return { brief, project: null, tasteProfile: [], demographics: null, candidates: [], recommendations: [], evaluations: new Map(), creative: null, warnings: [] };
}

export function projectInfo(ctx: RunContext): ProjectInfo | null {
  const p = ctx.project;
  return p ? { id: p.id, name: p.name, kind: p.kind, imageUrl: p.imageUrl } : null;
}

const SHORTLIST_SIZE = 10;
const CANDIDATE_POOL = 15;

// ---------- 1. resolveProject ----------

const SEARCH_TYPES: Record<ProjectType, EntityTypeUrn[]> = {
  tv_series: [ENTITY_TYPES.tvShow],
  film: [ENTITY_TYPES.movie],
  advertising: [ENTITY_TYPES.brand],
  trailer: [ENTITY_TYPES.movie, ENTITY_TYPES.tvShow],
  video_game: [ENTITY_TYPES.videoGame],
  documentary: [ENTITY_TYPES.movie, ENTITY_TYPES.tvShow],
};

/** Same title modulo punctuation/case, one containing the other ("Stranger Things 5"), or mostly shared words. */
function looselyMatches(found: string, wanted: string): boolean {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/s+/g, " ").trim();
  const a = norm(found);
  const b = norm(wanted);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(a.split(" "));
  const tb = new Set(b.split(" "));
  const shared = [...ta].filter((t) => tb.has(t)).length;
  return shared / Math.max(ta.size, tb.size) >= 0.6;
}

export async function resolveProject(ctx: RunContext): Promise<StepOutcome> {
  const name = ctx.brief.projectName;
  const types = SEARCH_TYPES[ctx.brief.projectType];
  let fallback: { entity: Entity; type: EntityTypeUrn } | null = null;
  const errors: string[] = [];

  for (const type of types) {
    const res = await searchEntities(name, type, 10);
    if (res.status === "error") {
      errors.push(res.error ?? "search failed");
      continue;
    }
    const best = pickBestMatch(res.data, name);
    if (!best) continue;
    if (best.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      ctx.project = best;
      return {
        status: "ok",
        endpoint: `GET /search (${type})`,
        summary: `Matched "${best.name}" as ${type.replace("urn:entity:", "")}${best.popularity != null ? `, popularity ${best.popularity.toFixed(2)}` : ""}`,
      };
    }
    if (looselyMatches(best.name, name)) fallback ??= { entity: best, type };
  }

  if (fallback) {
    ctx.project = fallback.entity;
    ctx.warnings.push(`No exact match for "${name}" in Qloo; using the closest result, "${fallback.entity.name}".`);
    return {
      status: "partial",
      endpoint: `GET /search (${fallback.type})`,
      summary: `No exact match; using closest result "${fallback.entity.name}"`,
    };
  }
  return {
    status: errors.length ? "error" : "empty",
    error: errors.length ? errors[0] : `"${name}" was not found in Qloo as a ${types.map((t) => t.replace("urn:entity:", "")).join(" or ")}`,
  };
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

export async function getProjectTasteProfile(ctx: RunContext): Promise<StepOutcome> {
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

  // Supplement: Qloo's audience taste tags (already filtered to music/culture).
  const res = await getTasteTags([project.id], 15);
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
  const summary = `${profile.length} tags (${fromSearch} from the project, ${fromInsights} from audience data)`;
  if (!profile.length) return { status: "empty", summary: "No usable taste tags returned" };
  return res.status === "error" ? { status: "partial", summary, error: res.error } : { status: "ok", summary };
}

// ---------- 3. getProjectDemographics ----------

export async function getProjectDemographics(ctx: RunContext): Promise<StepOutcome> {
  const res = await getAudienceDemographics([ctx.project!.id]);
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
  const project = ctx.project!;
  const res = await recommendEntities([project.id], ENTITY_TYPES.artist, { take: CANDIDATE_POOL });
  ctx.candidates = res.data;
  if (res.status === "error") return { status: "error", error: res.error };
  if (res.status === "empty") return { status: "empty", summary: "Qloo returned no artists for this project" };
  const aff = res.data.map((e) => e.affinity).filter((a): a is number => a != null);
  const range = aff.length ? `, affinity ${Math.min(...aff).toFixed(3)}–${Math.max(...aff).toFixed(3)}` : "";
  return { status: "ok", summary: `${res.data.length} artists returned${range}` };
}

// ---------- 5. scoreAndRank ----------

const ARTIST_TAG_CATEGORY = /^urn:tag:(genre|subgenre|style|theme|music)\b/;

const artistTagsOf = (e: Entity) =>
  [...new Set(e.tags.filter((t) => ARTIST_TAG_CATEGORY.test(t.type)).map((t) => t.name))].slice(0, 8);

export async function scoreAndRank(ctx: RunContext): Promise<StepOutcome> {
  const pool = ctx.candidates;

  // Audience relevance (one batched Qloo call) and creative fit (one LLM call per artist) are
  // independent, so they run together.
  const demosPromise: Promise<QlooResult<Map<string, Demographics>> | null> = ctx.demographics
    ? getDemographicsBatch(pool.map((e) => e.id))
    : Promise.resolve(null);
  const llmPromise = evaluateArtists(
    ctx.brief,
    pool.map((e) => ({ id: e.id, name: e.name, tags: artistTagsOf(e) })),
    {
      projectName: ctx.project!.name,
      tasteTags: ctx.tasteProfile.map((t) => t.name),
      qlooDomains: [ctx.project!.kind.replace(/^urn:entity:/, ""), "artist", "tags", "demographics"],
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
      llmConfigured()
        ? "Creative fit could not be scored (the language-model calls failed), so the composite uses cultural fit and audience relevance only."
        : "Creative fit was not scored because the language-model step is unavailable, so the composite uses cultural fit and audience relevance only.",
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
        rawAffinity: e.affinity,
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
  if (!ctx.demographics) {
    return { status: "partial", summary: `Ranked ${n} artists without audience scoring (no project demographics)${creativeNote}` };
  }
  if (!artistDemos || artistDemos.status === "error") {
    ctx.warnings.push("Artist demographics could not be retrieved, so audience relevance is not scored.");
    return { status: "partial", summary: `Ranked ${n} artists without audience scoring${creativeNote}`, error: artistDemos?.error };
  }
  const missing = pool.filter((e) => !artistDemos.data.has(e.id)).length;
  return {
    status: missing || creativeMissing ? "partial" : "ok",
    summary: `Ranked ${n} of ${pool.length} artists${missing ? `; ${missing} had no demographics` : ""}${creativeNote}`,
  };
}

// ---------- 6. generateExplanations ----------

/** Data-only sentence for artists the LLM did not cover, so a failed call never leaves a blank. */
function dataSummary(r: Recommendation, project: string): string {
  const parts = [
    `Qloo links ${r.artistName} to ${project} with a raw affinity of ${r.evidence.rawAffinity?.toFixed(3) ?? "n/a"}, ranked #${r.rank} on the combined score.`,
  ];
  if (r.scores.audienceRelevance != null) {
    parts.push(`Its audience's age and gender profile scores ${r.scores.audienceRelevance.toFixed(2)} against the project's within this shortlist.`);
  }
  if (r.evidence.artistTags.length) parts.push(`Qloo tags: ${r.evidence.artistTags.slice(0, 5).join(", ")}.`);
  return parts.join(" ");
}

export async function generateExplanations(ctx: RunContext): Promise<StepOutcome> {
  const project = ctx.project!.name;
  let written = 0;
  for (const r of ctx.recommendations) {
    const ev = ctx.evaluations.get(r.qlooEntityId);
    if (ev) {
      r.explanation = ev.explanation;
      r.reasoning = ev.reasoning;
      written++;
    } else {
      r.explanation = dataSummary(r, project);
    }
  }
  const total = ctx.recommendations.length;
  if (written === total) return { status: "ok", summary: `Wrote ${written} explanations from the brief and Qloo's data` };
  if (written === 0) return { status: "partial", summary: `Language model unavailable; showing data-only summaries for ${total} artists` };
  return { status: "partial", summary: `Wrote ${written} of ${total} explanations; the rest show data-only summaries` };
}
