export type RankMovement =
  | { kind: "up"; by: number }
  | { kind: "down"; by: number }
  | { kind: "same" }
  | { kind: "new" } // only in the Qloo-grounded list
  | { kind: "dropped" }; // only in the LLM-only list

export interface RankingDiffRow {
  name: string;
  baselineRank: number | null;
  qlooRank: number | null;
  movement: RankMovement;
}

/** Diff an LLM-only ranking against the Qloo-grounded one. Inputs are artist names in rank order. */
export function diffRankings(baseline: string[], qloo: string[]): RankingDiffRow[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const b = new Map(baseline.map((n, i) => [norm(n), i + 1]));
  const q = new Map(qloo.map((n, i) => [norm(n), i + 1]));
  const rows: RankingDiffRow[] = [];

  for (const [i, name] of qloo.entries()) {
    const br = b.get(norm(name)) ?? null;
    const qr = i + 1;
    const movement: RankMovement =
      br == null ? { kind: "new" } : br === qr ? { kind: "same" } : br > qr ? { kind: "up", by: br - qr } : { kind: "down", by: qr - br };
    rows.push({ name, baselineRank: br, qlooRank: qr, movement });
  }
  for (const [i, name] of baseline.entries()) {
    if (!q.has(norm(name))) rows.push({ name, baselineRank: i + 1, qlooRank: null, movement: { kind: "dropped" } });
  }
  return rows;
}

// TODO(phase 4): runBaseline(brief) — LLM-only shortlist with no Qloo data.
