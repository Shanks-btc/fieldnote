import { PageSection } from "@/components/layout/PageSection";
import { Eyebrow } from "@/components/shared/TextLink";
import { ExampleRow, SCORE_COLS, type ExampleScores } from "@/components/landing/ExampleRow";
import { ArtStrip } from "@/components/landing/ArtStrip";
import { Marquee } from "@/components/landing/Marquee";
import { FadeIn } from "@/components/landing/FadeIn";
import { StatsRow } from "@/components/landing/StatsRow";
import { PipelineArt } from "@/components/landing/PipelineArt";
import Link from "next/link";
import { EngineSection, EvidenceSection, EYEBROW, H2, LEAD, Split, VersusSection } from "@/components/landing/Sections";
import { DualCTA } from "@/components/landing/DualCTA";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { UseCaseSection } from "@/components/landing/UseCaseSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FAQ } from "@/components/landing/FAQ";
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


export default function LandingPage() {
  return (
    <>
      {/* 1. Hero */}
      <div className="pt-12 md:pt-14">
        <ArtStrip names={HERO_STRIP} />
        <PageSection className="py-14 text-center sm:py-16 md:py-20">
          <FadeIn>
            <h1 className="mx-auto max-w-[680px] text-[32px] font-medium leading-[0.98] tracking-[-0.04em] sm:text-[40px] md:text-[48px] lg:text-[56px]">
              Place music where the audience already lives.
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-5 max-w-[480px] text-pretty text-[14px] leading-relaxed text-black/[.56] sm:text-[15px]">
            Fieldnote uses Qloo&apos;s cultural intelligence to find artists whose audiences overlap with your show, film, or
            campaign — then shows you the evidence.
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          </FadeIn>
        </PageSection>
      </div>

      <Marquee />

      <ProblemSection />

      {/* 2. Product preview */}
      <PageSection className="pb-12 pt-8 sm:pb-16 sm:pt-12 md:pb-16 md:pt-12">
        <FadeIn>
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:rounded-[28px]">
          {/* Dark header strip */}
          <div className="flex items-center justify-between gap-4 bg-black px-5 py-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-green-400" />
              <span className="truncate text-[13px] font-medium text-white/90">Stranger Things S5</span>
              <span className="ml-1 hidden text-[12px] text-white/30 sm:inline">sample output</span>
            </div>
            <div className="hidden items-center gap-6 text-[10px] uppercase tracking-[0.06em] text-white/30 sm:flex">
              <span className={`${SCORE_COLS.sub} text-right`}>Cultural</span>
              <span className={`${SCORE_COLS.sub} text-right`}>Audience</span>
              <span className={`${SCORE_COLS.composite} text-right text-white/60`}>Composite</span>
            </div>
          </div>

          <ul className="divide-y divide-black/[0.04]">
            {SAMPLE.map((s, i) => (
              <li key={s.name}>
                <FadeIn delay={0.25 + i * 0.15}>
                  <ExampleRow name={s.name} scores={s.scores} rank={i + 1} />
                </FadeIn>
              </li>
            ))}
          </ul>

          {/* Footer strip */}
          <div className="border-t border-black/[0.04] bg-neutral-50/60 px-5 py-4 sm:px-8">
            <p className="font-mono text-[11px] text-black/30">
              Artists, images and Spotify links are real Qloo data. Scores are illustrative.
            </p>
          </div>
        </div>
        </FadeIn>
      </PageSection>

      <UseCaseSection />

      <EvidenceSection />

      <FeaturesSection />

      {/* 3. How it works */}
      <PageSection id="how-it-works" className="scroll-mt-20 border-t border-border py-12 sm:py-14 md:py-16">
        <Split
          text={
            <FadeIn>
              <p className={EYEBROW}>How it works</p>
              <h2 className={H2}>
                From a brief to a
                <br />
                defensible shortlist.
              </h2>
              <p className={LEAD}>
                Describe the scene. Fieldnote resolves it in Qloo, reads the audience, finds the artists, scores every match and
                shows the evidence, in about eleven seconds.
              </p>
            </FadeIn>
          }
          visual={
            <FadeIn delay={0.2}>
              <PipelineArt />
            </FadeIn>
          }
        />
        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-14">
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
      <PageSection className="pb-12 pt-0 sm:pb-16 md:pb-16 md:pt-0">
        <StatsRow />
      </PageSection>

      {/* 5. Pillars */}
      <div className="border-t border-neutral-200 bg-white">
        <PageSection className="py-10 md:py-12">
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

      <FAQ />

      <DualCTA />

      {/* 6. Statement band */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_20%_10%,#2B2B2E_0%,#0B0B0C_55%,#000_100%)] px-5 py-16 text-center text-white sm:py-24 md:px-6 md:py-40">
        <div
          className="absolute -inset-[20%] bg-[linear-gradient(100deg,transparent_30%,rgba(99,102,241,0.18)_48%,transparent_62%)] blur-[40px]"
          aria-hidden
        />
        <FadeIn>
          <blockquote className="relative mx-auto max-w-[880px] font-serif text-[30px] font-normal leading-[1.05] tracking-[-0.01em] sm:text-[44px] md:text-[56px] lg:text-[64px]">
          &ldquo;The best sync placements don&apos;t match a genre — they match an audience.&rdquo;
          </blockquote>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="relative mt-7 text-sm text-white/60">— The thesis behind Fieldnote</p>
        </FadeIn>
      </section>

    </>
  );
}
