"use client";

import { useInView } from "@/hooks/useInView";
import { FadeIn } from "./FadeIn";

const VIOLET = "#8B5CF6";
const BLUE = "#3B82F6";
const GREEN = "#22C55E";
const AMBER = "#F59E0B";
const PINK = "#EC4899";
const CYAN = "#06B6D4";

const PAIN_POINTS = [
  "100M+ tracks to choose from",
  "Supervisors search by genre and gut feeling",
  "Little audience-overlap data to check a pick against",
  "Deep catalog gets buried under hits",
  "Pitches lack cultural context or data",
  "Every pick turns into an argument",
];

const SOLUTIONS = [
  { text: "Cultural affinity from Qloo's taste graph shows real audience overlap", color: VIOLET },
  { text: "Every pick shows its demographics and taste tags", color: BLUE },
  { text: "Ranked by fit to your audience, not by chart position", color: GREEN },
  { text: "Brief to ranked shortlist in about 11 seconds", color: AMBER },
  { text: "A score breakdown shows why each artist fits", color: VIOLET },
  { text: "A Spotify link on every artist", color: BLUE },
];

/** "The gap": a dark card (the old way) beside a white card (Fieldnote), with a small link between them. */
export function ProblemSection() {
  const [ref, on] = useInView<HTMLDivElement>(0.2);

  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-6 sm:py-16 md:py-20">
      <FadeIn>
        <p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40">The gap</p>
        <h2 className="max-w-[560px] text-[28px] sm:text-[32px] md:text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">
          The sync industry runs on gut feeling.
          <br />
          <span className="text-black/40">It doesn&apos;t have to.</span>
        </h2>
      </FadeIn>

      <div ref={ref} className="relative mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {/* Left: the problem */}
        <div
          className={`fn-fade ${on ? "in" : ""} rounded-[28px] bg-black p-6 sm:p-8 md:p-10`}
          style={{ "--d": "0.1s" } as React.CSSProperties}
        >
          <p className="mb-6 text-[10px] uppercase tracking-[0.06em] text-white/30">Without Fieldnote</p>
          <div className="space-y-4">
            {PAIN_POINTS.map((point, i) => (
              <div key={point} className="flex items-start gap-3">
                <span
                  className={`fn-check ${on ? "in" : ""} mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] text-white/40`}
                  style={{ "--d": `${0.4 + i * 0.15}s` } as React.CSSProperties}
                  aria-hidden
                >
                  ✕
                </span>
                <p
                  className={`fn-type-line ${on ? "in" : ""} text-[14px] leading-relaxed text-white/60`}
                  style={{ "--d": `${0.3 + i * 0.18}s` } as React.CSSProperties}
                >
                  {point}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-[12px] text-white/30">Catalog size on the major streaming platforms</p>
            <p
              className={`fn-fade ${on ? "in" : ""} mt-1 font-mono text-[28px] font-medium tracking-tight text-white/80`}
              style={{ "--d": "1.8s" } as React.CSSProperties}
            >
              100M+
            </p>
          </div>
        </div>

        {/* Connecting element between the cards (desktop only) */}
        <div
          className={`fn-check ${on ? "in" : ""} absolute left-1/2 top-1/2 z-10 hidden size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5F5F5] md:flex`}
          style={{ "--d": "1.2s" } as React.CSSProperties}
          aria-hidden
        >
          <span className="flex size-7 items-center justify-center rounded-full text-sm text-white" style={{ backgroundColor: VIOLET }}>
            →
          </span>
        </div>

        {/* Right: Fieldnote */}
        <div
          className={`fn-fade ${on ? "in" : ""} rounded-[28px] bg-white p-6 sm:p-8 md:p-10`}
          style={{ "--d": "0.25s" } as React.CSSProperties}
        >
          <p className="mb-6 text-[10px] uppercase tracking-[0.06em] text-black/40">With Fieldnote</p>
          <div className="space-y-4">
            {SOLUTIONS.map((sol, i) => (
              <div key={sol.text} className="flex items-start gap-3">
                <span
                  className={`fn-check ${on ? "in" : ""} mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[12px] text-white`}
                  style={{ "--d": `${0.6 + i * 0.15}s`, backgroundColor: sol.color } as React.CSSProperties}
                  aria-hidden
                >
                  ✓
                </span>
                <p
                  className={`fn-fade ${on ? "in" : ""} text-[14px] leading-relaxed text-black/70`}
                  style={{ "--d": `${0.5 + i * 0.15}s` } as React.CSSProperties}
                >
                  {sol.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-black/[0.06] pt-6">
            <p className="text-[12px] text-black/40">Typical research time with Fieldnote</p>
            <p
              className={`fn-fade ${on ? "in" : ""} mt-1 font-mono text-[28px] font-medium tracking-tight`}
              style={{ "--d": "1.8s" } as React.CSSProperties}
            >
              ~11 seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
