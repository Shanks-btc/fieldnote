"use client";

import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";

interface EvidenceCardProps {
  eyebrow: string;
  variant: "score" | "percent" | "tags" | "composite";
  /** score: 0-1 (shown as 0.935); percent/composite: 0-100. */
  value?: number;
  decimal?: boolean;
  tags?: string[];
  description: string;
  /** Stagger for the card's own entrance. */
  delay?: number;
  /** Fill-bar colour. */
  color?: string;
}

/** One evidence card whose number counts up, bar fills and tags pop in when it scrolls into view. */
export function EvidenceCard({
  eyebrow,
  variant,
  value = 0,
  decimal = false,
  tags = [],
  description,
  delay = 0,
  color = "#8B5CF6",
}: EvidenceCardProps) {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const countTarget = decimal ? Math.round(value * 1000) : value;
  const count = useCountUp(countTarget, on, 1400);

  const display = decimal ? (count / 1000).toFixed(3) : variant === "percent" ? `${count}%` : String(count);

  return (
    <div
      ref={ref}
      className={`fn-fade fn-card-glow ${on ? "in" : ""} rounded-[24px] bg-white p-7`}
      style={{ "--d": `${delay}s` } as React.CSSProperties}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-black/40">{eyebrow}</p>

      {variant === "tags" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className={`fn-tag ${on ? "in" : ""} rounded-full bg-neutral-100 px-3 py-1 text-[12px] text-black/70`}
              style={{ "--d": `${0.3 + i * 0.1}s` } as React.CSSProperties}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <>
          <p
            className={`fn-count ${on ? "in" : ""} mt-3 text-[32px] font-medium tracking-[-0.03em] tabular-nums`}
            style={{ "--d": "0.2s" } as React.CSSProperties}
          >
            {display}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`fn-score-fill ${on ? "in" : ""} h-full rounded-full`}
              style={
                {
                  "--d": "0.5s",
                  width: `${decimal ? value * 100 : value}%`,
                  backgroundColor: color,
                } as React.CSSProperties
              }
            />
          </div>
        </>
      )}

      <p className="mt-3 text-[13px] leading-relaxed text-black/50">{description}</p>
    </div>
  );
}
