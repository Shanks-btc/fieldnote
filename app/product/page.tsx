import { PageSection } from "@/components/layout/PageSection";
import { DualCTA } from "@/components/landing/DualCTA";
import { FadeIn } from "@/components/landing/FadeIn";
import { EYEBROW, Split } from "@/components/landing/Sections";
import { FORM_PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/validation/brief";

export const metadata = {
  title: "Product, Fieldnote",
  description:
    "How Fieldnote works: cultural affinity scoring, audience intelligence and composite ranking for music sync placements.",
};

const H2 = "text-[26px] sm:text-[30px] md:text-[32px] font-medium leading-[1.1] tracking-[-0.02em]";
const LEAD = "mt-4 max-w-[420px] text-[15px] leading-relaxed text-black/50";

const SIGNALS = [
  {
    color: "#8B5CF6",
    title: "Cultural Fit, 50%",
    body: "Qloo's affinity score between the project and each artist, rescaled within the shortlist so small differences show. It measures how strongly an artist's audience overlaps with the project's viewers.",
  },
  {
    color: "#3B82F6",
    title: "Creative Fit, 30%",
    body: "A language model's judgement of how well an artist matches the brief's tone, mood and genre, scored independently of Qloo and shown with its reasoning for every artist.",
  },
  {
    color: "#22C55E",
    title: "Audience Relevance, 20%",
    body: "How closely an artist's age and gender profile matches the project's, using Qloo's demographic data. It checks that the fanbase fits the target audience, not just the sound.",
  },
];

// Step timings are from real runs of the example brief (they vary by a second or two).
const STEPS = [
  { step: "01", name: "Resolve", desc: "Find the project in Qloo", time: "~1.5s", color: "#111111" },
  { step: "02", name: "Taste", desc: "Read its taste tags and its neighbours in 7 other domains", time: "~3s", color: "#3B82F6" },
  { step: "03", name: "Audience", desc: "Fetch the project's age and gender profile", time: "~0.2s", color: "#22C55E" },
  { step: "04", name: "Artists", desc: "Find artists whose audiences overlap", time: "~4s", color: "#F59E0B" },
  { step: "05", name: "Score", desc: "Score creative fit, compare audiences and rank every artist", time: "~8s", color: "#8B5CF6" },
  { step: "06", name: "Explain", desc: "Write a specific explanation for every artist", time: "<0.1s", color: "#EC4899" },
];

// At-a-glance facts under the hero. Each is what the app does today.
const STATS = [
  { value: "8", label: "Qloo domains read per brief" },
  { value: "6", label: "Steps, fully automated" },
  { value: "~20s", label: "From brief to shortlist" },
  { value: "10", label: "Artists ranked, each explained" },
];

// The composite weights, drawn in greys so the split reads without new colour.
const WEIGHTS = [
  { label: "Cultural", pct: 50, tone: "bg-black" },
  { label: "Creative", pct: 30, tone: "bg-black/45" },
  { label: "Audience", pct: 20, tone: "bg-black/15" },
];

const FLOW = ["Brief", "Qloo entity", "Taste graph", "Artists", "Scores", "Shortlist"];

const PIPELINE_FACTS = [
  { value: "5 of 6", label: "Steps call Qloo" },
  { value: "0", label: "Manual steps after the brief" },
  { value: "Live", label: "Each step reports as it runs" },
];

// The project types the creative-fit scorer has a lens for ("Other" is a fallback, not a type).
const TYPES = FORM_PROJECT_TYPES.filter((t) => t !== "other").map((t) => PROJECT_TYPE_LABELS[t]);

const TILE = "rounded-[16px] bg-white px-4 py-4 sm:px-5";

// What Fieldnote does with each domain Qloo covers.
const DOMAINS = [
  { domain: "Music", use: "Recommended artists", color: "#8B5CF6" },
  { domain: "Television", use: "Project lookup, related shows", color: "#3B82F6" },
  { domain: "Film", use: "Project lookup, related films", color: "#22C55E" },
  { domain: "Video games", use: "Related games", color: "#06B6D4" },
  { domain: "Brands", use: "Brand lookup, related brands", color: "#F59E0B" },
  { domain: "Podcasts", use: "Related podcasts", color: "#EC4899" },
  { domain: "Books", use: "Related books", color: "#EAB308" },
  { domain: "People", use: "Related cast and talent", color: "#F43F5E" },
];

export default function ProductPage() {
  return (
    <div>
      <PageSection className="pb-8 pt-16 md:pb-8 md:pt-24">
        <FadeIn>
          <p className={EYEBROW}>Product</p>
          <h1 className="max-w-[700px] text-[32px] font-medium leading-[1.1] sm:text-[40px] md:text-[48px] tracking-[-0.03em]">
            Intelligence for music
            <br />
            sync placements.
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed sm:text-[17px] text-black/50">
            Fieldnote uses Qloo&apos;s cultural taste graph to find artists whose audiences genuinely overlap with your
            project&apos;s viewers, not just artists who sound similar.
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className={TILE}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-[26px] font-medium leading-none tracking-[-0.02em] sm:text-[30px]">{s.value}</dd>
                <dd className="mt-2 text-[13px] leading-snug text-black/50">{s.label}</dd>
              </div>
            ))}
          </dl>
        </FadeIn>
      </PageSection>

      {/* Scoring */}
      <PageSection className="py-10 sm:py-14 md:py-16">
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

              <div className="mt-8 max-w-[420px]">
                <p className="mb-2.5 text-[12px] uppercase tracking-[0.06em] text-black/30">Composite weights</p>
                <div className="flex h-2.5 overflow-hidden rounded-full" role="img" aria-label="Cultural 50%, Creative 30%, Audience 20%">
                  {WEIGHTS.map((w) => (
                    <div key={w.label} className={w.tone} style={{ width: `${w.pct}%` }} />
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
                  {WEIGHTS.map((w) => (
                    <span key={w.label} className="flex items-center gap-1.5 text-[13px] text-black/55">
                      <span className={`size-2 rounded-full ${w.tone}`} aria-hidden />
                      {w.label} <span className="font-mono text-black/35">{w.pct}%</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 max-w-[420px] space-y-3">
                <p className={`${TILE} text-[13px] leading-relaxed text-black/55`}>
                  <span className="font-medium text-black/80">Missing data never counts as zero.</span> If Qloo has no
                  audience data for a project, that signal is left out and the other two are rescaled, and the page says so.
                </p>
                <p className={`${TILE} text-[13px] leading-relaxed text-black/55`}>
                  <span className="font-medium text-black/80">Nothing is a black box.</span> Expand any artist to read the
                  tone, genre, placement and risk reasoning behind its creative score.
                </p>
              </div>
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
      <PageSection className="py-10 sm:py-14 md:py-16">
        <Split
          align="start"
          reverse
          text={
            <FadeIn>
              <p className={EYEBROW}>Pipeline</p>
              <h2 className={H2}>
                Six steps. About twenty seconds.
                <br />
                Fully automated.
              </h2>
              <p className={LEAD}>
                From the moment you describe your scene to ranked results. Five of the six steps call Qloo, and you watch each
                one complete as it runs.
              </p>

              <ol className="mt-8 flex max-w-[460px] flex-wrap items-center gap-x-1.5 gap-y-2" aria-label="How data flows through the pipeline">
                {FLOW.map((step, i) => (
                  <li key={step} className="flex items-center gap-1.5">
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[13px] text-black/70">{step}</span>
                    {i < FLOW.length - 1 && (
                      <span className="text-black/25" aria-hidden>
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <dl className="mt-6 grid max-w-[460px] grid-cols-3 gap-3">
                {PIPELINE_FACTS.map((f) => (
                  <div key={f.label} className={TILE}>
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-[20px] font-medium leading-none tracking-[-0.02em]">{f.value}</dd>
                    <dd className="mt-2 text-[12px] leading-snug text-black/45">{f.label}</dd>
                  </div>
                ))}
              </dl>

              <p className={`mt-6 max-w-[460px] ${TILE} text-[13px] leading-relaxed text-black/55`}>
                <span className="font-medium text-black/80">No named project?</span> Describe the sound instead, such as
                &ldquo;dark synthwave for a chase scene&rdquo;. A description runs a shorter track that maps its genres onto
                Qloo&apos;s taste graph, then scores and explains the artists the same way.
              </p>
            </FadeIn>
          }
          visual={
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <FadeIn key={s.step} delay={0.06 * i}>
                  <div className="flex items-center gap-4 rounded-[16px] bg-white px-5 py-4">
                    <span className="w-5 font-mono text-[12px] text-black/30">{s.step}</span>
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
      <PageSection className="py-10 sm:py-14 md:py-16">
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
                Qloo maps cultural affinity across music, television, film, podcasts, books, games, brands and people. Fans of a
                show share tastes across those domains. Fieldnote reads a project's neighbours in each one, shows them next to the
                shortlist, and gives them to the creative-fit scorer, while Qloo's affinity scores drive the ranking.
              </p>

              <div className="mt-8 max-w-[420px]">
                <p className="mb-2.5 text-[12px] uppercase tracking-[0.06em] text-black/30">Scores for</p>
                <ul className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <li key={t} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[13px] text-black/70">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          }
          visual={
            <FadeIn delay={0.1}>
              <div className="rounded-[24px] bg-white p-6 sm:p-8">
                <p className="mb-5 text-[12px] uppercase tracking-[0.06em] text-black/30">Domains and how Fieldnote uses them</p>
                <div className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2 sm:gap-3">
                  {DOMAINS.map((d) => (
                    <div key={d.domain} className="flex items-center gap-2.5 py-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <div>
                        <p className="text-[14px] font-medium text-black/70">{d.domain}</p>
                        <p className="text-[12px] text-black/35">{d.use}</p>
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
