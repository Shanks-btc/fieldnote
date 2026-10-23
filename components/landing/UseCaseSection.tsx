"use client";

import { useInView } from "@/hooks/useInView";
import { artist } from "@/lib/landing/artists";
import { AlbumArt } from "@/components/results/AlbumArt";
import { FadeIn } from "./FadeIn";

const VIOLET = "#8B5CF6";
const BLUE = "#3B82F6";
const GREEN = "#22C55E";
const AMBER = "#F59E0B";
const PINK = "#EC4899";
const CYAN = "#06B6D4";

// This is real output: the example brief on /brief, run against the live Qloo API. Names, tags and
// images come from scripts/fixtures; the composite scores are the ones that run displayed.
const BRIEF =
  "Season 5 transition scene: the group drives out of Hawkins at dusk after a loss. Quiet, wide shots; the music should carry grief and fragile hope without tipping into melodrama.";
const BRIEF_TAGS = ["Stranger Things", "TV series", "United States", "Adults 18–34", "Melancholy · nostalgic"];

const RESULTS = [
  { name: "girl in red", score: 96, color: VIOLET },
  { name: "Harry Styles", score: 92, color: BLUE },
  { name: "Billie Eilish", score: 91, color: GREEN },
  { name: "Olivia Rodrigo", score: 86, color: AMBER },
  { name: "Mitski", score: 79, color: PINK },
];

/** "In practice": the brief on the left, the shortlist it produced sliding in on the right. */
export function UseCaseSection() {
  const [ref, on] = useInView<HTMLDivElement>(0.2);

  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-6 sm:py-16 md:py-20">
      <FadeIn>
        <p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40">In practice</p>
        <h2 className="max-w-[560px] text-[28px] sm:text-[32px] md:text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">
          Describe the scene. Meet the artists.
        </h2>
        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-black/55">
          Write the brief the way you&apos;d tell a sync agent. Fieldnote does the rest.
        </p>
      </FadeIn>

      <div
        ref={ref}
        className={`fn-fade ${on ? "in" : ""} mt-12 grid grid-cols-1 overflow-hidden rounded-[28px] bg-white lg:grid-cols-2`}
        style={{ "--d": "0.15s" } as React.CSSProperties}
      >
        {/* Left: the brief */}
        <div className="flex flex-col justify-between border-black/[0.06] p-6 sm:p-8 md:p-10 lg:border-r">
          <div>
            <p className="mb-5 text-[10px] uppercase tracking-[0.06em] text-black/30">The brief</p>
            <blockquote
              className={`fn-fade ${on ? "in" : ""} text-[16px] font-medium leading-[1.5] sm:text-[18px] text-black/70`}
              style={{ "--d": "0.4s" } as React.CSSProperties}
            >
              &ldquo;{BRIEF}&rdquo;
            </blockquote>
            <div className={`fn-fade ${on ? "in" : ""} mt-6 flex flex-wrap gap-2`} style={{ "--d": "0.6s" } as React.CSSProperties}>
              {BRIEF_TAGS.map((t) => (
                <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-[12px] text-black/60">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className={`fn-fade ${on ? "in" : ""} mt-8 border-t border-black/[0.06] pt-6`} style={{ "--d": "0.8s" } as React.CSSProperties}>
            <div className="flex items-center gap-2 font-mono text-[12px] text-black/40">
              <span className="size-2 animate-pulse rounded-full" style={{ backgroundColor: GREEN }} />
              ~11s · 10 artists ranked, top 5 shown
            </div>
          </div>
        </div>

        {/* Right: the results */}
        <div className="bg-neutral-50/60 p-6 sm:p-8 md:p-10">
          <p className="mb-5 text-[10px] uppercase tracking-[0.06em] text-black/30">Results</p>

          <div
            className={`fn-pulse-dot ${on ? "in" : ""} mb-5 flex items-center gap-1.5`}
            style={{ "--d": "0.5s" } as React.CSSProperties}
            aria-hidden
          >
            <span className="size-1.5 rounded-full bg-black/30" />
            <span className="size-1.5 rounded-full bg-black/20" />
            <span className="size-1.5 rounded-full bg-black/10" />
          </div>

          <div className="space-y-3">
            {RESULTS.map((r, i) => {
              const a = artist(r.name);
              return (
                <div
                  key={r.name}
                  className={`fn-slide-right ${on ? "in" : ""} flex items-center gap-4 rounded-[16px] bg-white px-4 py-3`}
                  style={{ "--d": `${1.0 + i * 0.2}s` } as React.CSSProperties}
                >
                  <span className="w-3 font-mono text-[12px] text-black/30">{i + 1}</span>
                  <AlbumArt url={a.imageUrl} name={a.name} className="size-10" eager />
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-black/80">{a.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-black/40">{a.tags.slice(0, 2).join(" · ")}</p>
                  </div>
                  <p className="font-mono text-[20px] font-medium tabular-nums" style={{ color: r.color }}>
                    {r.score}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-4 font-mono text-xs text-black/40">Output from a real run of the example brief.</p>
    </section>
  );
}
