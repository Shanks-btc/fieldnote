import { PageSection } from "@/components/layout/PageSection";
import { EvidenceCard } from "./EvidenceCard";
import { FadeIn } from "./FadeIn";
import { TasteGraphArt } from "./TasteGraphArt";
import { DOMAINS } from "./domains";

export const EYEBROW = "mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40";
export const H2 = "text-[36px] font-medium leading-[1.1] tracking-[-0.02em]";
export const LEAD = "mt-4 max-w-[440px] text-[15px] leading-relaxed text-black/55";
const MONO_LABEL = "font-mono text-[10px] uppercase tracking-[0.06em] text-black/40";

/**
 * Text on one side, visual on the other (stacked on phones). `reverse` puts the visual first on
 * desktop; on phones the text always comes first.
 */
export function Split({
  text,
  visual,
  reverse = false,
  align = "center",
}: {
  text: React.ReactNode;
  visual: React.ReactNode;
  reverse?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div className={`grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 ${align === "center" ? "items-center" : "items-start"}`}>
      <div className={reverse ? "lg:order-2" : ""}>{text}</div>
      <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

/** "The evidence": heading on top, the four evidence cards below. Values are for the sample artist. */
export function EvidenceSection() {
  return (
    <PageSection className="py-20 md:py-20">
      <FadeIn>
        <p className={EYEBROW}>The evidence</p>
        <h2 className={`${H2} max-w-[560px]`}>Every pick comes with receipts.</h2>
        <p className={`${LEAD} max-w-[520px]`}>
          Fieldnote doesn&apos;t just rank artists — it shows you why each one fits, backed by Qloo&apos;s taste data.
        </p>
        <p className="mt-6 font-mono text-xs text-black/40">Shown for girl in red · Stranger Things S5 sample</p>
      </FadeIn>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <EvidenceCard
          eyebrow="Cultural fit"
          variant="score"
          value={0.935}
          decimal
          color="#8B5CF6"
          delay={0.1}
          description="Qloo affinity score measuring how strongly this artist's audience overlaps with the show's viewers."
        />
        <EvidenceCard
          eyebrow="Audience match"
          variant="percent"
          value={87}
          color="#3B82F6"
          delay={0.2}
          description="Demographic alignment across age and gender between the artist's audience and the show's."
        />
        <EvidenceCard
          eyebrow="Taste tags"
          variant="tags"
          tags={["Emotive", "Lo-Fi", "Indie", "Nostalgic"]}
          delay={0.3}
          description="Cultural descriptors from Qloo's taste graph that connect the artist to the project's tone."
        />
        <EvidenceCard
          eyebrow="Composite"
          variant="composite"
          value={91}
          color="#22C55E"
          delay={0.4}
          description="Weighted score: cultural fit 50%, creative fit 30%, audience relevance 20%. Creative fit joins once the LLM step is on."
        />
      </div>
    </PageSection>
  );
}

/** "The engine": constellation left, text and legend right. */
export function EngineSection() {
  return (
    <PageSection className="py-20 md:py-20">
      <Split
        reverse
        text={
          <FadeIn>
            <p className={EYEBROW}>The engine</p>
            <h2 className={H2}>One taste graph across every domain.</h2>
            <p className={LEAD}>
              Qloo maps cultural affinity across music, TV, film, podcasts, books, games, places and brands. Fieldnote taps into
              this graph to find artists whose audiences genuinely overlap with your project&apos;s viewers — not just artists
              in the same genre.
            </p>
            <div className="mt-8 grid max-w-[440px] grid-cols-2 gap-3">
              {DOMAINS.map((d, i) => (
                <FadeIn key={d.name} delay={0.2 + i * 0.06}>
                  <div className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-3">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <p className="text-[14px] font-medium">{d.name}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        }
        visual={
          <FadeIn delay={0.15}>
            <TasteGraphArt />
          </FadeIn>
        }
      />
    </PageSection>
  );
}

const WITHOUT = [
  { title: "Genre matching", body: "“This show feels indie, so find indie artists”" },
  { title: "Gut feeling", body: "No data on whether the audiences actually overlap" },
  { title: "Hours of research", body: "Browsing playlists, reading blogs, asking colleagues" },
  { title: "Indefensible picks", body: "“I just thought they'd be a good fit”" },
];

const WITH = [
  { title: "Audience-level matching", body: "Qloo's taste graph finds artists whose fans are the same people" },
  { title: "Real affinity data", body: "Every pick shows its cultural fit, demographic overlap, and taste tags" },
  { title: "About 11 seconds", body: "A six-step agent pipeline runs the research automatically" },
  { title: "Defensible shortlist", body: "Show the score breakdown to your client, your director, your label" },
];

function Column({ label, items, good }: { label: string; items: typeof WITH; good: boolean }) {
  return (
    <div className={`rounded-[32px] bg-white p-10 ${good ? "ring-1 ring-black/[0.04]" : ""}`}>
      <p className={`mb-4 ${MONO_LABEL}`}>{label}</p>
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={it.title}>
            <FadeIn delay={0.3 + i * 0.1} className="flex items-start gap-3">
            <span
              className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                good ? "bg-black text-white" : "bg-neutral-100 text-black/30"
              }`}
              aria-hidden
            >
              {good ? "✓" : "✕"}
            </span>
            <div>
              <p className="text-[15px] font-medium">{it.title}</p>
              <p className="mt-1 text-[13px] text-black/50">{it.body}</p>
            </div>
            </FadeIn>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "The difference": heading on top, the two columns side by side below. */
export function VersusSection() {
  return (
    <PageSection className="py-20 md:py-20">
      <FadeIn>
        <p className={EYEBROW}>The difference</p>
        <h2 className={`${H2} max-w-[560px]`}>Why not just search Spotify?</h2>
      </FadeIn>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <FadeIn delay={0.1}>
          <Column label="Without Fieldnote" items={WITHOUT} good={false} />
        </FadeIn>
        <FadeIn delay={0.2}>
          <Column label="With Fieldnote" items={WITH} good />
        </FadeIn>
      </div>
    </PageSection>
  );
}
