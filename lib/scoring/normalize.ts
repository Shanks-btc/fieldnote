import type { Demographics } from "@/lib/qloo/types";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Min-max rescale a set of scores to span 0-1.
 *
 * Qloo affinity is 0-1 but tightly clustered (a top-10 for Stranger Things ranged
 * 0.924-0.935), so raw values barely separate candidates. Rescale within one result set
 * before using it as "cultural fit". Nulls stay null (missing data is never invented).
 * If every present value is equal there is no spread to show, so they all get 0.5.
 */
export function minMaxRescale(values: (number | null | undefined)[]): (number | null)[] {
  const present = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!present.length) return values.map(() => null);
  const min = Math.min(...present);
  const max = Math.max(...present);
  return values.map((v) => {
    if (v == null || !Number.isFinite(v)) return null;
    return max === min ? 0.5 : (v - min) / (max - min);
  });
}

/**
 * Map a signed affinity (-1..1, 0 = average) to 0-1 where 0.5 means "no over/under-indexing".
 * Qloo demographics are signed (e.g. age 24_and_younger = 0.71, 35_to_44 = -0.62).
 */
export function normalizeSigned(x: number | null | undefined): number | null {
  if (x == null || !Number.isFinite(x)) return null;
  return (clamp(x, -1, 1) + 1) / 2;
}

export type AgeBucket = keyof Demographics["age"];

/** Map a free-text-derived age range onto the buckets Qloo reports. */
export function ageBucketsForRange(minAge: number, maxAge: number): AgeBucket[] {
  const buckets: [AgeBucket, number, number][] = [
    ["24_and_younger", 0, 24],
    ["25_to_29", 25, 29],
    ["30_to_34", 30, 34],
    ["35_to_44", 35, 44],
    ["45_to_54", 45, 54],
    ["55_and_older", 55, 120],
  ];
  return buckets.filter(([, lo, hi]) => lo <= maxAge && hi >= minAge).map(([b]) => b);
}

/**
 * How strongly the project's audience over-indexes in the brief's target age range, 0-1
 * (0.5 = average). Averages the signed affinity over the matching buckets. Null if no
 * bucket matches or demographics are missing.
 */
export function ageFit(demo: Demographics | null, buckets: AgeBucket[]): number | null {
  if (!demo || !buckets.length) return null;
  const avg = buckets.reduce((s, b) => s + demo.age[b], 0) / buckets.length;
  return normalizeSigned(avg);
}

/**
 * Similarity between two audiences' demographic profiles, 0-1 (1 = identical).
 * Compares the 6 age buckets and 2 gender values; both are signed -1..1, so the largest
 * possible per-value gap is 2. Qloo reports demographics per entity, which makes this a
 * real per-artist signal (unlike a project-level age fit, which is the same for every artist).
 */
export function demographicSimilarity(a: Demographics | null | undefined, b: Demographics | null | undefined): number | null {
  if (!a || !b) return null;
  const pairs: [number, number][] = [
    ...(Object.keys(a.age) as AgeBucket[]).map((k): [number, number] => [a.age[k], b.age[k]]),
    [a.gender.male, b.gender.male],
    [a.gender.female, b.gender.female],
  ];
  const meanAbsDiff = pairs.reduce((s, [x, y]) => s + Math.abs(x - y), 0) / pairs.length;
  return 1 - meanAbsDiff / 2;
}
