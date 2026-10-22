import { ArrowDown, ArrowUp, Equal, Minus, Plus } from "lucide-react";
import type { RankingDiffRow } from "@/lib/scoring/compare";
import { Badge } from "@/components/shared/Badge";
import { MonoValue } from "@/components/shared/MonoValue";

function Movement({ m }: { m: RankingDiffRow["movement"] }) {
  switch (m.kind) {
    case "up":
      return <Badge tone="success"><ArrowUp className="mr-1 size-3" />Up {m.by}</Badge>;
    case "down":
      return <Badge tone="danger"><ArrowDown className="mr-1 size-3" />Down {m.by}</Badge>;
    case "new":
      return <Badge tone="success"><Plus className="mr-1 size-3" />Added by Qloo</Badge>;
    case "dropped":
      return <Badge tone="warning"><Minus className="mr-1 size-3" />Dropped</Badge>;
    default:
      return <Badge tone="outline"><Equal className="mr-1 size-3" />Same</Badge>;
  }
}

export function RankingDiff({ rows }: { rows: RankingDiffRow[] }) {
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Artist</th>
            <th className="px-4 py-3 font-medium">LLM only</th>
            <th className="px-4 py-3 font-medium">With Qloo</th>
            <th className="px-4 py-3 font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3"><MonoValue>{r.baselineRank ?? "—"}</MonoValue></td>
              <td className="px-4 py-3"><MonoValue>{r.qlooRank ?? "—"}</MonoValue></td>
              <td className="px-4 py-3"><Movement m={r.movement} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
