"use client";

import { useId, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { FadeIn } from "./FadeIn";

const QUESTIONS = [
  {
    q: "How is this different from Spotify's recommendations?",
    color: "#8B5CF6",
    a: "Spotify recommends music a listener will enjoy, based on listening history. Fieldnote does something different: it finds artists whose audiences culturally overlap with a project's viewers, using Qloo's taste graph. The question isn't \"will you like this artist?\" but \"does this artist's fanbase match the show's audience?\"",
  },
  {
    q: "What does Qloo's taste graph cover?",
    color: "#3B82F6",
    a: "Qloo maps cultural affinity across music, television, film, podcasts, books, video games, places and brands. Fans of a show tend to share tastes across those domains, and Qloo's API exposes that overlap as affinity scores. Fieldnote uses it to find music that matches a project's audience, not just its genre.",
  },
  {
    q: "Can I use it for film, ads and games, not just TV?",
    color: "#22C55E",
    a: "Yes. The brief form takes a project type (TV series, film, ad campaign, trailer, video game or documentary), and Fieldnote looks up that project in Qloo. For an ad campaign it resolves the brand, then finds artists whose audiences overlap with that brand's.",
  },
  {
    q: "How should I read the scores?",
    color: "#F59E0B",
    a: "Qloo's raw affinity values sit in a narrow band (for the Stranger Things example, 0.921 to 0.935), so Fieldnote rescales them within each shortlist. A cultural-fit score of 100 means the best match of that set, not a perfect match. The raw value is shown in each artist's evidence panel.",
  },
  {
    q: "What's in the composite score?",
    color: "#EC4899",
    a: "It is designed as cultural fit (50%), creative fit (30%) and audience relevance (20%). Cultural fit is Qloo's affinity, and audience relevance compares each artist's age and gender profile with the project's. Creative fit needs the LLM step, which isn't switched on yet, so today's composite uses the other two. The breakdown is shown for every artist.",
  },
];

/** "Common questions": a single accordion card. One answer open at a time. */
export function FAQ() {
  const [ref, on] = useInView<HTMLDivElement>(0.15);
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();

  return (
    <section className="mx-auto w-full max-w-[800px] px-6 py-20">
      <FadeIn>
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.06em] text-black/40">Common questions</p>
        <h2 className="text-center text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">You&apos;re probably wondering.</h2>
      </FadeIn>

      <div ref={ref} className="mt-12 divide-y divide-black/[0.06] overflow-hidden rounded-[28px] bg-white">
        {QUESTIONS.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${base}-panel-${i}`;
          return (
            <div
              key={item.q}
              className={`fn-fade ${on ? "in" : ""} relative`}
              style={{ "--d": `${0.15 + i * 0.1}s` } as React.CSSProperties}
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-[3px] transition-colors duration-300"
                style={{ backgroundColor: isOpen ? item.color : "transparent" }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex w-full items-center justify-between px-7 py-5 text-left"
              >
                <span className="pr-4 text-[15px] font-medium text-black/70 transition-colors group-hover:text-black/90">
                  {item.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 transition-transform duration-300"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  aria-hidden
                >
                  <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <div
                id={panelId}
                role="region"
                className="overflow-hidden"
                style={{
                  maxHeight: isOpen ? 420 : 0,
                  opacity: isOpen ? 1 : 0,
                  transition: "max-height 0.4s cubic-bezier(0.2,0.9,0.2,1), opacity 0.3s ease",
                }}
              >
                <p className="px-7 pb-6 text-[14px] leading-relaxed text-black/50">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
