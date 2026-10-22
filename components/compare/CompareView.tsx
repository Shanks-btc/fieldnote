import type { Recommendation } from "@/lib/validation/results";
import { diffRankings } from "@/lib/scoring/compare";
import { RankingDiff } from "./RankingDiff";

function Column({ title, subtitle, recs }: { title: string; subtitle: string; recs: Recommendation[] }) {
  return (
    <div>
      <h2 className="border-b border-border pb-3 font-semibold">{title}</h2>
      <p className="mb-4 mt-3 text-sm text-muted-foreground">{subtitle}</p>
      <ol className="space-y-2 text-sm">
        {recs.map((r) => (
          <li key={r.qlooEntityId} className="flex gap-3">
            <span className="w-5 font-mono text-muted-foreground">{r.rank}</span>
            <span>{r.artistName}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CompareView({ baseline, qloo }: { baseline: Recommendation[]; qloo: Recommendation[] }) {
  const rows = diffRankings(
    baseline.map((r) => r.artistName),
    qloo.map((r) => r.artistName),
  );
  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-2">
        <Column title="LLM only" subtitle="Ranked from the brief alone" recs={baseline} />
        <Column title="Qloo-grounded" subtitle="Ranked with audience taste data" recs={qloo} />
      </div>
      <RankingDiff rows={rows} />
    </div>
  );
}
