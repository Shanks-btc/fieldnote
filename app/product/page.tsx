import { PageSection } from "@/components/layout/PageSection";
import { DualCTA } from "@/components/landing/DualCTA";
import { FadeIn } from "@/components/landing/FadeIn";
import { EYEBROW, Split } from "@/components/landing/Sections";

export const metadata = {
  title: "Product — Fieldnote",
  description:
    "How Fieldnote works: cultural affinity scoring, audience intelligence and composite ranking for music sync placements.",
};

const H2 = "text-[32px] font-medium leading-[1.1] tracking-[-0.02em]";
const LEAD = "mt-4 max-w-[420px] text-[15px] leading-relaxed text-black/50";

const SIGNALS = [
  {
    color: "#8B5CF6",
    title: "Cultural Fit — 50%",
    body: "Qloo's affinity score between the project and each artist, rescaled within the shortlist so small differences show. It measures how strongly an artist's audience overlaps with the project's viewers.",
  },
  {
    color: "#3B82F6",
    title: "Creative Fit — 30%",
    body: "A judgement of how well an artist matches the brief's tone, mood and genre. This needs the LLM step, which isn't switched on yet, so today's composite is built from the other two signals.",
  },
  {
    color: "#22C55E",
    title: "Audience Relevance — 20%",
    body: "How closely an artist's age and gender profile matches the project's, using Qloo's demographic data. It checks that the fanbase fits the target audience, not just the sound.",
  },
];

// Step timings are from real runs of the example brief (they vary by a second or two).
const STEPS = [
  { step: "01", name: "Resolve", desc: "Find the project in Qloo", time: "~2.2s", color: "#111111" },
  { step: "02", name: "Taste", desc: "Read the project's taste tags", time: "~0.8s", color: "#3B82F6" },
  { step: "03", name: "Audience", desc: "Fetch the project's age and gender profile", time: "~0.4s", color: "#22C55E" },
  { step: "04", name: "Artists", desc: "Find artists whose audiences overlap", time: "~5s", color: "#F59E0B" },
  { step: "05", name: "Score", desc: "Compare audiences and rank every artist", time: "~1.7s", color: "#8B5CF6" },
  { step: "06", name: "Explain", desc: "Write a summary per artist (placeholder text for now)", time: "<0.1s", color: "#EC4899" },
];

// What Fieldnote does with each domain Qloo covers.
const DOMAINS = [
  { domain: "Music", use: "Recommended artists", color: "#8B5CF6" },
  { domain: "Television", use: "Project lookup", color: "#3B82F6" },
  { domain: "Film", use: "Project lookup", color: "#22C55E" },
  { domain: "Video games", use: "Project lookup", color: "#06B6D4" },
  { domain: "Brands", use: "Project lookup", color: "#F59E0B" },
  { domain: "Podcasts", use: "In Qloo, not used yet", color: "#9CA3AF" },
  { domain: "Books", use: "In Qloo, not used yet", color: "#9CA3AF" },
  { domain: "Places", use: "In Qloo, not used yet", color: "#9CA3AF" },
];

export default function ProductPage() {
  return (
    <div>
      <PageSection className="pb-8 pt-16 md:pb-8 md:pt-24">
        <FadeIn>
          <p className={EYEBROW}>Product</p>
          <h1 className="max-w-[700px] text-[48px] font-medium leading-[1.08] tracking-[-0.03em]">
            Intelligence for music
            <br />
            sync placements.
          </h1>
          <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-black/50">
            Fieldnote uses Qloo&apos;s cultural taste graph to find artists whose audiences genuinely overlap with your
            project&apos;s viewers — not just artists who sound similar.
          </p>
        </FadeIn>
      </PageSection>

      {/* Scoring */}
      <PageSection className="py-16 md:py-16">
        <Split
          align="start"
          text={
            <FadeIn>
              <p className={EYEBROW}>Scoring</p>
              <h2 className={H2}>
                Three signals,
                <br />
                one composite score.
              </h2>
              <p className={LEAD}>
                Every recommendation comes with a breakdown showing why it ranked where it did.
              </p>
            </FadeIn>
          }
          visual={
            <div className="space-y-4">
              {SIGNALS.map((s, i) => (
                <FadeIn key={s.title} delay={0.1 * i}>
                  <div className="rounded-[20px] bg-white p-6">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <p className="text-[15px] font-medium text-black/80">{s.title}</p>
                    </div>
                    <p className="pl-[22px] text-[13px] leading-relaxed text-black/50">{s.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          }
        />
      </PageSection>

      {/* Pipeline */}
      <PageSection className="py-16 md:py-16">
        <Split
          align="start"
          reverse
          text={
            <FadeIn>
              <p className={EYEBROW}>Pipeline</p>
              <h2 className={H2}>
                Six steps. Eleven seconds.
                <br />
                Fully automated.
              </h2>
              <p className={LEAD}>
                From the moment you describe your scene to ranked results. Five of the six steps call Qloo, and you watch each
                one complete as it runs.
              </p>
            </FadeIn>
          }
          visual={
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <FadeIn key={s.step} delay={0.06 * i}>
                  <div className="flex items-center gap-4 rounded-[16px] bg-white px-5 py-4">
                    <span className="w-5 font-mono text-[11px] text-black/30">{s.step}</span>
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-black/80">{s.name}</p>
                      <p className="mt-0.5 text-[12px] text-black/40">{s.desc}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[12px] text-black/30">{s.time}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          }
        />
      </PageSection>

      {/* Data */}
      <PageSection className="py-16 md:py-16">
        <Split
          align="start"
          text={
            <FadeIn>
              <p className={EYEBROW}>Data</p>
              <h2 className={H2}>
                Qloo&apos;s taste graph,
                <br />
                not genre labels.
              </h2>
              <p className={LEAD}>
                Qloo maps cultural affinity across music, television, film, podcasts, books, games, places and brands. Fans of a
                show share tastes across those domains, and Qloo exposes that overlap as affinity scores that Fieldnote turns
                into a ranking.
              </p>
            </FadeIn>
          }
          visual={
            <FadeIn delay={0.1}>
              <div className="rounded-[24px] bg-white p-8">
                <p className="mb-5 text-[11px] uppercase tracking-[0.06em] text-black/30">Domains and how Fieldnote uses them</p>
                <div className="grid grid-cols-2 gap-3">
                  {DOMAINS.map((d) => (
                    <div key={d.domain} className="flex items-center gap-2.5 py-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <div>
                        <p className="text-[14px] font-medium text-black/70">{d.domain}</p>
                        <p className="text-[11px] text-black/35">{d.use}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          }
        />
      </PageSection>

      <DualCTA />
    </div>
  );
}
