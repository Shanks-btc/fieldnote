import type { Recommendation } from "@/lib/validation/results";
import { ResultRow } from "./ResultRow";

/** Hairline-separated list: rows float on the canvas, no boxes. */
export function ResultsTable({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {recommendations.map((r) => (
        <ResultRow key={r.qlooEntityId} rec={r} />
      ))}
    </ul>
  );
}
