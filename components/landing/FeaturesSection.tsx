"use client";

import { useInView } from "@/hooks/useInView";
import { FadeIn } from "./FadeIn";
import { FeatureCard } from "./FeatureCard";

const svg = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none" } as const;

const FEATURES = [
  {
    title: "Cultural Affinity Scoring",
    color: "#8B5CF6",
    description:
      "Not genre matching. Qloo's taste graph measures how strongly an artist's fans overlap with a show's viewers, across music, TV, film, podcasts, books, games, places and brands.",
    icon: (
      <svg {...svg}>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Audience Demographics",
    color: "#3B82F6",
    description:
      "Age and gender skew for the project and for every artist, so you can see whether the audience actually matches, not just the sound.",
    icon: (
      <svg {...svg}>
        <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Taste Tag Analysis",
    color: "#22C55E",
    description:
      "Descriptors like Emotive, Lo-Fi and Nostalgic connect an artist to a project's tone. They come from Qloo's taste graph, not Spotify genres.",
    icon: (
      <svg {...svg}>
        <path d="M3 10 L8 10 L10 4 L12 16 L14 10 L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Composite Ranking",
    color: "#F59E0B",
    description:
      "Cultural fit, creative fit and audience relevance combine into one score, weighted 50 / 30 / 20. Creative fit joins once the LLM step is on; until then the score uses the other two.",
    icon: (
      <svg {...svg}>
        <path d="M10 2 L12.5 7.5 L18 8 L14 12 L15 18 L10 15 L5 18 L6 12 L2 8 L7.5 7.5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Spotify Links",
    color: "#EC4899",
    description:
      "Every result links straight to the artist's Spotify profile. Qloo returns the Spotify IDs, so there is no name matching and no extra lookup. In-page previews are next.",
    icon: (
      <svg {...svg}>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="8,6 15,10 8,14" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "An 11-Second Pipeline",
    color: "#06B6D4",
    description:
      "Resolve the project, read its taste profile and audience, find artists, then score and rank them. Six steps run automatically, and you watch each one complete.",
    icon: (
      <svg {...svg}>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 5 L10 10 L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** "The toolkit": six capability cards that zig-zag in. */
export function FeaturesSection() {
  const [ref, on] = useInView<HTMLDivElement>(0.15);

  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-6 sm:py-16 md:py-20">
      <FadeIn>
        <p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40">The toolkit</p>
        <h2 className="max-w-[560px] text-[28px] sm:text-[32px] md:text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">
          Everything a sync brief needs,
          <br />
          nothing it doesn&apos;t.
        </h2>
        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-black/55">
          Six capabilities working together in one pipeline, each backed by Qloo&apos;s cultural intelligence rather than
          keyword matching.
        </p>
      </FadeIn>

      <div ref={ref} className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FeatureCard
            key={f.title}
            title={f.title}
            description={f.description}
            icon={f.icon}
            color={f.color}
            variant={i % 2 === 0 ? "border" : "dot"}
            slideFrom={i % 2 === 0 ? "left" : "right"}
            on={on}
            delay={0.1 + i * 0.12}
          />
        ))}
      </div>
    </section>
  );
}
