"use client";

interface FeatureCardProps {
  title: string;
  description: string;
  /** Inline SVG. */
  icon: React.ReactNode;
  /** Accent for the icon and its tile. */
  color: string;
  slideFrom: "left" | "right";
  on: boolean;
  delay: number;
}

export function FeatureCard({ title, description, icon, color, slideFrom, on, delay }: FeatureCardProps) {
  const slide = slideFrom === "left" ? "fn-slide-left" : "fn-slide-right";

  return (
    <div
      className={`${slide} ${on ? "in" : ""} rounded-[24px] bg-white p-5 sm:p-6 md:p-7`}
      style={{ "--d": `${delay}s` } as React.CSSProperties}
    >
      <div
        className={`fn-icon-pulse ${on ? "in" : ""} mb-4 flex size-10 items-center justify-center rounded-[12px]`}
        style={{ "--d": `${delay + 0.2}s`, backgroundColor: `${color}1A` } as React.CSSProperties}
        aria-hidden
      >
        <div style={{ color }}>{icon}</div>
      </div>

      <h3 className="mb-2 text-[16px] font-medium text-black/80">{title}</h3>

      <p className="text-[13px] leading-relaxed text-black/50">{description}</p>
    </div>
  );
}
