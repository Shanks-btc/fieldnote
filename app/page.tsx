import { PageSection } from "@/components/layout/PageSection";
import { Eyebrow } from "@/components/shared/TextLink";
import { ExampleRow, type ExampleScores } from "@/components/landing/ExampleRow";
import { ArtStrip } from "@/components/landing/ArtStrip";
import { Marquee } from "@/components/landing/Marquee";
import { FadeIn } from "@/components/landing/FadeIn";
import { PipelineArt } from "@/components/landing/PipelineArt";
import Link from "next/link";
import { EngineSection, EvidenceSection, VersusSection } from "@/components/landing/Sections";
import { artist } from "@/lib/landing/artists";

// Artists, images and Spotify IDs below are real Qloo data (scripts/fixtures). The scores in
// the sample output are illustrative, and the page says so.
const SAMPLE: { name: string; scores: ExampleScores }[] = [
  { name: "girl in red", scores: { cultural: 94, audience: 87, composite: 91 } },
  { name: "Mitski", scores: { cultural: 78, audience: 82 } },
  { name: "Clairo", scores: { cultural: 65, audience: 71 } },
];

const girl = artist("girl in red");

const STEPS = [
  {
    n: "01",
    title: "Write the brief",
    body: "Describe the scene, the mood and the audience the way you would for a sync agent.",
    snippet: "Stranger Things S5\nnostalgic, tense\nages 18-34",
  },
  {
    n: "02",
    title: "Fieldnote researches",
    body: "It resolves your project in Qloo, reads its audience, and finds the artists those people share.",
    snippet: "→ Entity resolved\n→ 5 Qloo calls\n→ 11.2s",
  },
  {
    n: "03",
    title: "Review the evidence",
    body: "Every pick carries its scores and the Qloo data behind them, so you can defend the choice.",
    snippet: `${girl.name}\naffinity ${girl.affinity.toFixed(3)}\n${girl.tags.slice(0, 2).join(", ").toLowerCase()}`,
  },
];

const PILLARS = [
  { title: "Cross-domain", body: "Film, TV, music, brands — one taste graph." },
  { title: "Evidence-based", body: "Every pick backed by Qloo affinity scores." },
  { title: "No black boxes", body: "See every API call, every score, every connection." },
];

const HERO_STRIP = [
  "girl in red",
  "Mitski",
  "Clairo",
  "Billie Eilish",
  "Olivia Rodrigo",
  "Harry Styles",
  "Conan Gray",
  "Suki Waterhouse",
  "Kate Bush",
  "Björk",
  "Solange",
  "FKA twigs",
];

// Every figure is something the app actually does: ~11s is the observed 10-11.4s run time,
// 6 is the step count, and 5 is the number of Qloo calls a brief makes.
const STATS = [
  { value: "~11s", label: "Typical research time" },
  { value: "6", label: "Agent pipeline steps" },
  { value: "5", label: "Qloo API calls per brief" },
];

export default function LandingPage() {
  return (
    <>
      {/* 1. Hero */}
      <div className="pt-12 md:pt-14">
        <ArtStrip names={HERO_STRIP} />
        <PageSection className="py-20 text-center md:py-20">
          <Eyebrow>Built on Qloo&apos;s taste graph</Eyebrow>
          <h1 className="mx-auto mt-8 max-w-[680px] text-[36px] font-medium leading-[0.95] tracking-[-0.04em] sm:text-[56px]">
            Place music where the audience already lives.
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-pretty text-[15px] leading-relaxed text-black/[.56]">
            Fieldnote uses Qloo&apos;s cultural intelligence to find artists whose audiences overlap with your show, film, or
            campaign — then shows you the evidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/brief"
              className="inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Try the demo
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full bg-black/[0.06] px-7 text-sm font-medium text-black transition-colors hover:bg-black/10"
            >
              How it works
            </Link>
          </div>
        </PageSection>
      </div>

      <Marquee />

      {/* 2. Product preview */}
      <PageSection className="pb-16 pt-12 md:pb-16 md:pt-12">
        <div className="border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 sm:px-5">
            <p className="font-mono text-xs text-[#999]">Stranger Things S5 — sample output</p>
            <p className="hidden font-mono text-xs uppercase tracking-wider text-neutral-400 sm:block">Cultural · Audience · Composite</p>
          </div>
          <ul className="divide-y divide-border px-4 sm:px-5">
            {SAMPLE.map((s, i) => (
              <li key={s.name}>
                <ExampleRow name={s.name} scores={s.scores} rank={i + 1} />
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 font-mono text-xs text-[#999]">
          Artists, images and Spotify links are real Qloo data. Scores are illustrative.
        </p>
      </PageSection>

      <EvidenceSection />

      {/* 3. How it works */}
      <PageSection id="how-it-works" className="scroll-mt-20 border-t border-border py-16 md:py-16">
        <FadeIn>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-6 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            From a brief to a defensible shortlist.
          </h2>
        </FadeIn>
        <div className="mb-14 mt-10">
          <PipelineArt />
        </div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-14">
          {STEPS.map((s, i) => (
            <FadeIn key={s.n} delay={0.1 * (i + 1)}>
              <span className="font-mono text-xs text-[#999]">{s.n}</span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-4 leading-relaxed text-[#555]">{s.body}</p>
              <pre className="mt-8 whitespace-pre-wrap border-l border-border pl-5 font-mono text-[13px] leading-6 text-foreground">
                {s.snippet}
              </pre>
            </FadeIn>
          ))}
        </div>
      </PageSection>

      <EngineSection />

      {/* 4. Stats */}
      <PageSection className="pb-16 pt-0 md:pb-16 md:pt-0">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
          {STATS.map((st, i) => (
            <FadeIn key={st.label} delay={0.1 * i} className="border-t border-border pt-5">
              <dd className="text-[54px] font-medium leading-none tracking-[-0.03em]">{st.value}</dd>
              <dt className="mt-2 text-sm text-black/55">{st.label}</dt>
            </FadeIn>
          ))}
        </dl>
      </PageSection>

      {/* 5. Pillars */}
      <div className="border-t border-neutral-200 bg-white">
        <PageSection className="py-12 md:py-12">
          <dl className="grid grid-cols-1 divide-y divide-neutral-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            {PILLARS.map((p, i) => (
              <FadeIn key={p.title} delay={0.1 * i} className="py-6 md:px-10 md:py-2 md:first:pl-0 md:last:pr-0">
                <span className="font-mono text-xs tracking-widest text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                <dt className="mt-3 text-2xl font-semibold tracking-tight">{p.title}</dt>
                <dd className="mt-3 leading-relaxed text-[#555]">{p.body}</dd>
              </FadeIn>
            ))}
          </dl>
        </PageSection>
      </div>

      <VersusSection />

      {/* 6. Statement band */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_20%_10%,#2B2B2E_0%,#0B0B0C_55%,#000_100%)] px-5 py-24 text-center text-white md:px-6 md:py-40">
        <div
          className="absolute -inset-[20%] bg-[linear-gradient(100deg,transparent_30%,rgba(99,102,241,0.18)_48%,transparent_62%)] blur-[40px]"
          aria-hidden
        />
        <blockquote className="relative mx-auto max-w-[880px] font-serif text-[40px] font-normal leading-[1.02] tracking-[-0.01em] md:text-[64px]">
          &ldquo;The best sync placements don&apos;t match a genre — they match an audience.&rdquo;
        </blockquote>
        <p className="relative mt-7 text-sm text-white/60">— The thesis behind Fieldnote</p>
      </section>

      {/* 7. CTA */}
      <PageSection className="py-24 md:py-24">
        <FadeIn>
        <p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40">Next step</p>
        <h2 className="max-w-[560px] text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">See it on a real brief.</h2>
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-black/55">
          Start from a pre-filled Stranger Things scene, change anything, and see scored artist matches in about eleven seconds.
        </p>
        <Link
          href="/brief"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-medium text-white transition-colors hover:bg-black/85"
        >
          Start a Brief →
        </Link>
        </FadeIn>
      </PageSection>
    </>
  );
}
