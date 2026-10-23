"use client";

import type { ComponentType, CSSProperties } from "react";
import { useInView } from "@/hooks/useInView";

/* Custom stroke-only icons (32x32, 1.5px strokes). `style` carries the draw-animation delay and colour. */
type IconProps = { className?: string; style?: CSSProperties };
const base = { width: 32, height: 32, viewBox: "0 0 32 32", fill: "none" } as const;
const stroke = { stroke: "currentColor", strokeWidth: 1.5 } as const;

function IconFilm({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style} aria-hidden>
      <rect x="4" y="6" width="24" height="20" rx="3" {...stroke} />
      <line x1="4" y1="12" x2="28" y2="12" {...stroke} />
      <line x1="4" y1="20" x2="28" y2="20" {...stroke} />
      <line x1="10" y1="6" x2="10" y2="12" {...stroke} />
      <line x1="22" y1="6" x2="22" y2="12" {...stroke} />
      <line x1="10" y1="20" x2="10" y2="26" {...stroke} />
      <line x1="22" y1="20" x2="22" y2="26" {...stroke} />
      <circle cx="16" cy="16" r="2" {...stroke} />
    </svg>
  );
}

function IconBriefcase({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style} aria-hidden>
      <rect x="4" y="10" width="24" height="16" rx="3" {...stroke} />
      <path d="M12 10V8a2 2 0 012-2h4a2 2 0 012 2v2" {...stroke} />
      <line x1="4" y1="18" x2="28" y2="18" {...stroke} />
      <rect x="14" y="16" width="4" height="4" rx="1" {...stroke} />
    </svg>
  );
}

function IconMegaphone({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style} aria-hidden>
      <path d="M8 14v4a2 2 0 002 2h2l6 5V9l-6 5H10a2 2 0 00-2 2z" {...stroke} strokeLinejoin="round" />
      <path d="M22 12c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" {...stroke} strokeLinecap="round" />
      <path d="M25 9c2 1.8 3.5 4.2 3.5 7s-1.5 5.2-3.5 7" {...stroke} strokeLinecap="round" />
    </svg>
  );
}

function IconReel({ className, style }: IconProps) {
  return (
    <svg {...base} className={className} style={style} aria-hidden>
      <rect x="3" y="8" width="18" height="12" rx="2" {...stroke} />
      <polygon points="21,11 29,7 29,23 21,19" {...stroke} strokeLinejoin="round" />
      <circle cx="9" cy="14" r="2" {...stroke} />
      <line x1="14" y1="11" x2="18" y2="11" {...stroke} strokeLinecap="round" />
      <line x1="14" y1="14" x2="18" y2="14" {...stroke} strokeLinecap="round" />
    </svg>
  );
}

interface Persona {
  Icon: ComponentType<IconProps>;
  role: string;
  brief: string;
  pain: string;
  color: string;
  metric: string;
}

// Copy describes what the app does today: it resolves a project in Qloo, scores artists on cultural
// fit and audience match, and shows the evidence. It does not parse briefs with an LLM or export yet.
const PERSONAS: Persona[] = [
  {
    Icon: IconFilm,
    role: "Music Supervisors",
    brief: "Find the right song for every scene",
    pain: "You sift through huge catalogs per brief and defend picks to directors on gut feel. Fieldnote gives you a scored, evidence-backed shortlist in seconds.",
    color: "#8B5CF6",
    metric: "~11s to a ranked shortlist",
  },
  {
    Icon: IconBriefcase,
    role: "Sync Licensing Agencies",
    brief: "Pitch catalog with data, not just taste",
    pain: "Why does this artist fit the brief's audience? Fieldnote gives you cultural affinity and demographic alignment to back every submission.",
    color: "#3B82F6",
    metric: "Cultural + audience scoring",
  },
  {
    Icon: IconMegaphone,
    role: "Ad Creative Teams",
    brief: "Match music to campaign identity",
    pain: "Campaigns need a track that fits the tone and resonates with the target audience. Fieldnote looks up the brand and surfaces artists whose audiences overlap with it, not just artists in the same genre.",
    color: "#22C55E",
    metric: "Brand-to-artist taste matching",
  },
  {
    Icon: IconReel,
    role: "Trailer Houses",
    brief: "Score to a show's cultural DNA",
    pain: "Tight deadlines and no systematic way to match music to a title's identity. Fieldnote resolves the project in Qloo's taste graph and ranks artists by cultural and audience fit.",
    color: "#F59E0B",
    metric: "6-step agent pipeline",
  },
];

/** "Who it's for": four persona cards that wipe in, each with a drawn accent line and icon. */
export function AudienceSection() {
  const [ref, on] = useInView<HTMLDivElement>(0.15);
  const cls = (base: string) => `${base} ${on ? "in" : ""}`;

  return (
    <section className="px-5 py-16 sm:px-6 sm:py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-[1100px]">
        <div className={cls("fn-fade")} style={{ "--d": "0s" } as CSSProperties}>
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.15em] text-black/30">Built for</p>
        </div>
        <div className={cls("fn-fade")} style={{ "--d": "0.06s" } as CSSProperties}>
          <h2 className="mx-auto mt-3 max-w-[720px] text-balance text-center text-[28px] font-medium tracking-[-0.02em] text-black/85 sm:text-[32px] md:text-[36px]">
            If you&rsquo;ve ever had to defend a song choice, this is for you.
          </h2>
          <p className="mx-auto mt-3 max-w-[500px] text-center text-[14px] leading-relaxed text-black/45 sm:text-[15px]">
            Built for the people who pick the music.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 md:gap-6">
          {PERSONAS.map((p, i) => (
            <div key={p.role} className={cls("fn-card-reveal")} style={{ "--d": `${0.12 + i * 0.1}s` } as CSSProperties}>
              <div className="group relative h-full overflow-hidden rounded-[24px] bg-white p-7 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:rounded-[28px] sm:p-8 md:p-9">
                <div
                  className={cls("fn-accent-line absolute inset-x-0 top-0 h-[3px]")}
                  style={{ "--d": `${0.3 + i * 0.1}s`, backgroundColor: p.color } as CSSProperties}
                />

                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${p.color}10` }}>
                  <p.Icon
                    className={cls("fn-icon-draw")}
                    style={{ "--d": `${0.35 + i * 0.1}s`, color: p.color } as CSSProperties}
                  />
                </div>

                <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-black/85 sm:text-[17px]">{p.role}</h3>
                <p className="mt-1 text-[13px] font-medium text-black/50 sm:text-[14px]">{p.brief}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-black/45 sm:text-[14px]">{p.pain}</p>

                <div className="mt-5 border-t border-black/[0.04] pt-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1.5">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[12px] font-medium tracking-wide text-black/50">{p.metric}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
