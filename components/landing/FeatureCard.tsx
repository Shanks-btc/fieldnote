"use client";

interface FeatureCardProps {
  title: string;
  description: string;
  /** Inline SVG. */
  icon: React.ReactNode;
  /** Accent for the border/dot and icon. */
  color: string;
  /** `border`: thin accent rule on the left edge. `dot`: accent dot beside the title. */
  variant: "border" | "dot";
  slideFrom: "left" | "right";
  on: boolean;
  delay: number;
}

export function FeatureCard({ title, description, icon, color, variant, slideFrom, on, delay }: FeatureCardProps) {
  const slide = slideFrom === "left" ? "fn-slide-left" : "fn-slide-right";

  return (
    <div
      className={`${slide} ${on ? "in" : ""} relative overflow-hidden rounded-[24px] bg-white p-5 sm:p-6 md:p-7`}
      style={{ "--d": `${delay}s` } as React.CSSProperties}
    >
      {variant === "border" && (
        <div className="absolute bottom-6 left-0 top-6 w-[3px] rounded-full" style={{ backgroundColor: color }} />
      )}

      <div
        className={`fn-icon-pulse ${on ? "in" : ""} mb-4 flex size-10 items-center justify-center rounded-[12px]`}
        style={{ "--d": `${delay + 0.2}s`, backgroundColor: `${color}1A` } as React.CSSProperties}
        aria-hidden
      >
        <div style={{ color }}>{icon}</div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        {variant === "dot" && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        <h3 className="text-[16px] font-medium text-black/80">{title}</h3>
      </div>

      <p className="text-[13px] leading-relaxed text-black/50">{description}</p>
    </div>
  );
}
