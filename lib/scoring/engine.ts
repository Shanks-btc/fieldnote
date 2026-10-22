import { minMaxRescale } from "./normalize";

export interface ScoreWeights {
  creative: number;
  cultural: number;
  audience: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = { creative: 0.3, cultural: 0.5, audience: 0.2 };

export interface ScoreInputs {
  /** LLM judgement of brief fit, 0-1, or null if unavailable. */
  creativeFit: number | null;
  /** Min-max rescaled Qloo affinity (see culturalFitScores), or null. */
  culturalFit: number | null;
  /** Derived from Qloo demographic/geographic overlap, 0-1, or null. */
  audienceRelevance: number | null;
}

/**
 * Cultural fit for a result set: Qloo affinities min-max rescaled across the set, so the
 * spread (not Qloo's compressed 0.92-0.94 band) drives ranking. Same order as the input.
 * Because it's relative, a score of 1 means "best of this set", not "perfect match".
 */
export function culturalFitScores(affinities: (number | null)[]): (number | null)[] {
  return minMaxRescale(affinities);
}

/**
 * Weighted average over the dimensions that have data. Missing dimensions are dropped
 * and the remaining weights renormalized, so absent data never counts as a zero.
 * Returns null when no dimension has data.
 */
export function compositeScore(s: ScoreInputs, w: ScoreWeights = DEFAULT_WEIGHTS): number | null {
  const parts: [number | null, number][] = [
    [s.creativeFit, w.creative],
    [s.culturalFit, w.cultural],
    [s.audienceRelevance, w.audience],
  ];
  let sum = 0;
  let weight = 0;
  for (const [v, wt] of parts) {
    if (v == null) continue;
    sum += v * wt;
    weight += wt;
  }
  return weight > 0 ? sum / weight : null;
}
