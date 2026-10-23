"use client";

import { useInView } from "@/hooks/useInView";
import { useCountUpText } from "@/hooks/useCountUp";

// Every figure is something the app actually does: ~11s is the observed 10-11.4s run time,
// 6 is the step count, and 5 is the number of Qloo calls a brief makes.
const STATS = [
  { end: 11, prefix: "~", suffix: "s", delay: 0, label: "Brief to shortlist" },
  { end: 6, prefix: "", suffix: "", delay: 200, label: "Pipeline steps, fully automatic" },
  { end: 5, prefix: "", suffix: "", delay: 400, label: "Qloo API calls per brief" },
] as const;

function Stat({ stat, index, on }: { stat: (typeof STATS)[number]; index: number; on: boolean }) {
  const value = useCountUpText(stat.end, on, { prefix: stat.prefix, suffix: stat.suffix, delay: stat.delay });
  return (
    <div
      className={`fn-fade ${on ? "in" : ""} border-t border-border pt-5`}
      style={{ "--d": `${index * 0.1}s` } as React.CSSProperties}
    >
      <dd className="text-[28px] font-medium min-[360px]:text-[32px] sm:text-[44px] md:text-[54px] leading-none tracking-[-0.03em] tabular-nums">{value}</dd>
      <dt className="mt-2 text-[13px] text-black/55 sm:text-sm">{stat.label}</dt>
    </div>
  );
}

/** Three headline numbers that count up (and fade in) the first time the row scrolls into view. */
export function StatsRow() {
  const [ref, on] = useInView<HTMLDListElement>(0.3);

  return (
    <dl ref={ref} className="grid grid-cols-3 gap-4 sm:gap-8">
      {STATS.map((s, i) => (
        <Stat key={s.label} stat={s} index={i} on={on} />
      ))}
    </dl>
  );
}
