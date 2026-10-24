import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import type { ResearchResult } from "@/lib/agent/types";
import { PROJECT_TYPES } from "@/lib/validation/brief";
import { pipelineMs } from "@/lib/brief-history";

/**
 * Shareable results live entirely in the URL (`/results?d=...`): the shortlist is trimmed to what a
 * reader needs, JSON-encoded and lz-compressed. No server storage, so a link works for anyone and
 * never expires. Because anyone can hand-craft a link, decoding validates every field and rebuilds
 * the Spotify URL from a bare ID instead of trusting a URL.
 */

const score = z.number().min(0).max(1);
const nullableScore = score.nullable();
const str = (max: number) => z.string().max(max);

const sharedSchema = z.object({
  v: z.literal(1),
  b: z.object({
    projectName: str(120),
    projectType: z.enum(PROJECT_TYPES),
    sceneDescription: str(2000),
    targetAudience: str(500),
    geographicMarket: str(200),
    mood: str(300),
    genrePreferences: z.array(str(120)).max(20),
    culturalReferences: z.array(str(120)).max(20),
    exclusions: z.array(str(120)).max(20),
  }),
  r: z
    .array(
      z.object({
        n: str(120),
        /** [creative, cultural, audience, composite] */
        s: z.tuple([nullableScore, nullableScore, nullableScore, score]),
        e: str(1500),
        sp: z.string().regex(/^[A-Za-z0-9]{22}$/).nullable(),
        g: z.array(str(60)).max(8),
      }),
    )
    .max(25),
  t: z.array(str(80)).max(60),
  d: z.array(str(20)).max(8),
  ms: z.number().min(0).max(3_600_000),
  ts: z.number(),
});

export type SharedResults = z.infer<typeof sharedSchema>;

const SPOTIFY_ID = /artist[/:]([A-Za-z0-9]{22})\b/;

export function toShared(result: ResearchResult, timestamp = Date.now(), explanationMax = Infinity): SharedResults {
  const cut = (s: string) => {
    if (s.length <= explanationMax) return s;
    const head = s.slice(0, explanationMax);
    return head.slice(0, Math.max(head.lastIndexOf(" "), explanationMax * 0.6)).replace(/[,;:\s]+$/, "") + "…";
  };
  return {
    v: 1,
    b: result.brief,
    r: result.recommendations.map((r) => ({
      n: r.artistName,
      s: [r.scores.creativeFit, r.scores.culturalFit, r.scores.audienceRelevance, r.scores.composite],
      e: cut(r.explanation),
      sp: [r.spotifyArtistId, r.spotifyUrl?.match(SPOTIFY_ID)?.[1]].find((id) => !!id && /^[A-Za-z0-9]{22}$/.test(id)) ?? null,
      g: r.evidence.artistTags.slice(0, 6),
    })),
    t: result.tasteProfile.map((t) => t.name).slice(0, 12),
    d: result.qlooDomains ?? [],
    ms: pipelineMs(result),
    ts: timestamp,
  };
}

export function encodeShared(data: SharedResults): string {
  return compressToEncodedURIComponent(JSON.stringify(data));
}

/** Null for anything that isn't a well-formed share payload. */
export function decodeShared(encoded: string | undefined | null): SharedResults | null {
  if (!encoded || encoded.length > 60_000) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = sharedSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const MAX_URL_LENGTH = 8000;

/** Builds the link, shortening explanations in steps when the full version would make the URL too long. */
export function buildShareUrl(result: ResearchResult, origin: string): { url: string; trimmed: boolean } {
  const ts = Date.now();
  let url = "";
  for (const [i, max] of [Infinity, 320, 200, 120].entries()) {
    url = `${origin}/results?d=${encodeShared(toShared(result, ts, max))}`;
    if (url.length <= MAX_URL_LENGTH) return { url, trimmed: i > 0 };
  }
  return { url, trimmed: true };
}

/** A shared shortlist as a ResearchResult, so it can be saved to history and opened in the normal results view. */
export function sharedToResult(data: SharedResults, id: string): ResearchResult {
  return {
    id,
    brief: data.b,
    project: null,
    tasteProfile: data.t.map((name, i) => ({ id: `shared-tag-${i}`, name, category: "shared", source: "search" as const })),
    demographics: null,
    steps: [{ id: "scoreAndRank", label: "Score and rank", status: "ok", qlooEndpoint: null, durationMs: data.ms }],
    qlooDomains: data.d,
    creative: null,
    recommendations: data.r.map((r, i) => ({
      rank: i + 1,
      qlooEntityId: `shared-${id}-${i}`,
      artistName: r.n,
      trackName: null,
      imageUrl: null,
      previewUrl: null,
      spotifyArtistId: r.sp,
      spotifyUrl: r.sp ? `https://open.spotify.com/artist/${r.sp}` : null,
      scores: { creativeFit: r.s[0], culturalFit: r.s[1], audienceRelevance: r.s[2], composite: r.s[3] },
      evidence: {
        artistTags: r.g,
        sharedTags: [],
        rawAffinity: null,
        popularity: null,
        demographics: null,
        geographicOverlap: null,
        trendDirection: "unknown" as const,
      },
      explanation: r.e,
      reasoning: null,
    })),
    warnings: [],
  };
}
