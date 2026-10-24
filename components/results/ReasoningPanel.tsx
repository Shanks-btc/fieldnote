"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Recommendation } from "@/lib/validation/results";
import { DEFAULT_WEIGHTS } from "@/lib/scoring/engine";

export const ALL_DOMAINS = ["Music", "TV", "Film", "Podcasts", "Books", "Games", "Places", "Brands"] as const;

const LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-black/40";
const TAGS_SHOWN = 10;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h5 className={LABEL}>{title}</h5>
      {children}
    </div>
  );
}

/** Qloo domains as pills: lit when the run actually got data from that domain, dim otherwise. */
export function DomainPills({ domains }: { domains: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ALL_DOMAINS.map((d) => {
        const active = domains.includes(d.toLowerCase());
        return (
          <li
            key={d}
            className={`rounded-full px-2.5 py-1 text-xs ${
              active ? "border border-violet-500/30 bg-violet-500/10 text-violet-700" : "bg-black/[0.04] text-black/30"
            }`}
          >
            <span className="sr-only">{active ? "Queried: " : "Not queried: "}</span>
            {active && <span aria-hidden>✓ </span>}
            {d}
          </li>
        );
      })}
    </ul>
  );
}

function WeightBar({ label, score, weight, color }: { label: string; score: number | null; weight: number; color: string }) {
  const pct = score == null ? 0 : Math.round(score * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-black/55">{label}</span>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score == null ? undefined : pct}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-black/75">{score == null ? "—" : pct}</span>
      <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-black/35">{score == null ? "" : `${weight}%`}</span>
    </div>
  );
}

function ScoreBreakdown({ scores }: { scores: Recommendation["scores"] }) {
  const rows = [
    { label: "Cultural fit", score: scores.culturalFit, base: DEFAULT_WEIGHTS.cultural, color: "#3B82F6" },
    { label: "Creative fit", score: scores.creativeFit, base: DEFAULT_WEIGHTS.creative, color: "#8B5CF6" },
    { label: "Audience", score: scores.audienceRelevance, base: DEFAULT_WEIGHTS.audience, color: "#22C55E" },
  ];
  // Missing dimensions are dropped and the rest renormalized (same rule as the composite), so show the weights actually used.
  const total = rows.reduce((s, r) => s + (r.score == null ? 0 : r.base), 0);
  const renormalized = rows.some((r) => r.score == null);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <WeightBar
          key={r.label}
          label={r.label}
          score={r.score}
          weight={total > 0 ? Math.round((r.base / total) * 100) : 0}
          color={r.color}
        />
      ))}
      <div className="flex items-center gap-3 border-t border-black/[0.08] pt-2">
        <span className="w-24 shrink-0 text-xs font-medium text-black/80">Composite</span>
        <span className="flex-1" />
        <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">{Math.round(scores.composite * 100)}</span>
        <span className="w-9 shrink-0" />
      </div>
      {renormalized && (
        <p className="text-xs text-black/40">A dimension without data is left out and the remaining weights are rescaled to sum to 100%.</p>
      )}
    </div>
  );
}

const NOT_AVAILABLE = "Not available for this artist.";

/**
 * Collapsed-by-default deep dive for one artist: what the brief resolved to, which Qloo domains
 * answered, the LLM's four-part reasoning, and the weighted score breakdown. Every artist gets the
 * same structure; missing pieces say so instead of disappearing.
 */
export function ReasoningPanel({
  rec,
  tasteTags,
  qlooDomains,
}: {
  rec: Pick<Recommendation, "scores" | "reasoning" | "artistName">;
  tasteTags: string[];
  qlooDomains: string[];
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const r = rec.reasoning;
  const shown = tasteTags.slice(0, TAGS_SHOWN);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="-my-3 flex items-center gap-1.5 py-3 text-sm font-medium text-violet-600 transition-colors hover:text-violet-800"
      >
        {open ? "Hide reasoning" : "See reasoning"}
        <ChevronDown className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {/* grid-rows 0fr -> 1fr animates height without measuring; `inert` keeps the collapsed content out of tab order. */}
      <div
        id={id}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 rounded-[20px] border border-black/[0.06] bg-white p-5 sm:p-6">
            <Section title="Taste resolution">
              {shown.length ? (
                <p className="text-sm leading-relaxed text-black/70">
                  Brief resolved to {shown.join(", ")}
                  {tasteTags.length > shown.length && <span className="text-black/40"> and {tasteTags.length - shown.length} more</span>}
                </p>
              ) : (
                <p className="text-sm text-black/45">No taste tags were retrieved.</p>
              )}
            </Section>

            <Section title="Qloo domains queried">
              <DomainPills domains={qlooDomains} />
            </Section>

            <Section title="Tone match">
              <p className="text-sm leading-relaxed text-black/70">{r?.toneMatch ?? NOT_AVAILABLE}</p>
            </Section>
            <Section title="Genre relevance">
              <p className="text-sm leading-relaxed text-black/70">{r?.genreRelevance ?? NOT_AVAILABLE}</p>
            </Section>
            <Section title="Placement fit">
              <p className="text-sm leading-relaxed text-black/70">{r?.placementFit ?? NOT_AVAILABLE}</p>
            </Section>
            <Section title="Risks">
              <p className="text-sm leading-relaxed text-black/70">{r?.risks ?? NOT_AVAILABLE}</p>
            </Section>

            <Section title="Score breakdown">
              <ScoreBreakdown scores={rec.scores} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
