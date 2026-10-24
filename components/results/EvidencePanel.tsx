import type { Evidence } from "@/lib/validation/results";
import { MonoValue } from "@/components/shared/MonoValue";
import { ScoreStack, type ScoreSet } from "./ScoreBar";

function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

const None = ({ text = "None returned" }: { text?: string }) => <p className="text-sm text-muted-foreground">{text}</p>;

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs">
          {t}
        </span>
      ))}
    </div>
  );
}

const AGE_LABELS: [keyof NonNullable<Evidence["demographics"]>["age"], string][] = [
  ["24_and_younger", "≤24"],
  ["25_to_29", "25–29"],
  ["30_to_34", "30–34"],
  ["35_to_44", "35–44"],
  ["45_to_54", "45–54"],
  ["55_and_older", "55+"],
];

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;

/** Diverging 2px bar for a signed -1..1 value: right of centre over-indexes, left under-indexes. */
function SignedBar({ value }: { value: number }) {
  const v = Math.max(-1, Math.min(1, value));
  return (
    <div className="relative h-0.5 w-28 bg-[#ececec]" aria-hidden>
      <div
        className="absolute inset-y-0 bg-foreground"
        style={{ left: v >= 0 ? "50%" : `${50 + v * 50}%`, width: `${Math.abs(v) * 50}%` }}
      />
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-[#bbb]" />
    </div>
  );
}

export function EvidencePanel({
  evidence,
  explanation,
  scores,
  reasoning,
}: {
  evidence: Evidence;
  explanation: string;
  /** When given, shows the score breakdown on small screens (where the row shows only the composite). */
  scores?: ScoreSet;
  /** The expandable reasoning panel, shown under the explanation. */
  reasoning?: React.ReactNode;
}) {
  return (
    <div className="space-y-8 pb-8 pl-0 sm:pl-[calc(5.5rem+56px)]">
      {scores && (
        <Group title="Score breakdown" className="sm:hidden">
          <ScoreStack scores={scores} />
        </Group>
      )}
      {explanation && <p className="max-w-[60ch] text-sm leading-relaxed">{explanation}</p>}
      {reasoning}
      <div className="grid gap-8 sm:grid-cols-2">
        <Group title="Qloo tags for this artist">
          {evidence.artistTags.length ? <Tags tags={evidence.artistTags} /> : <None />}
        </Group>
        <Group title="Tags shared with the project">
          {evidence.sharedTags.length ? <Tags tags={evidence.sharedTags} /> : <None text="No overlapping tags" />}
        </Group>
        <Group title="Qloo signals">
          <dl className="max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Raw affinity</dt>
              <dd>
                <MonoValue>{evidence.rawAffinity?.toFixed(4) ?? "—"}</MonoValue>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Popularity</dt>
              <dd>
                <MonoValue>{evidence.popularity?.toFixed(4) ?? "—"}</MonoValue>
              </dd>
            </div>
          </dl>
        </Group>
        {evidence.demographics && (
          <Group title="Audience demographics">
            <div className="space-y-1.5">
              {AGE_LABELS.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 font-mono text-muted-foreground">{label}</span>
                  <SignedBar value={evidence.demographics!.age[key]} />
                  <span className="w-12 shrink-0 text-right font-mono tabular-nums">{signed(evidence.demographics!.age[key])}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              female {signed(evidence.demographics.gender.female)} · male {signed(evidence.demographics.gender.male)}
            </p>
            <p className="text-xs text-muted-foreground">0 is average; right of centre over-indexes.</p>
          </Group>
        )}
        <Group title="Geography and trend">
          <p className="text-sm">
            {evidence.geographicOverlap ?? <span className="text-muted-foreground">Geographic overlap not retrieved</span>}
          </p>
          <p className="text-sm text-muted-foreground">
            {evidence.trendDirection === "unknown" ? "No usable trend signal" : `Trend: ${evidence.trendDirection}`}
          </p>
        </Group>
      </div>
    </div>
  );
}
