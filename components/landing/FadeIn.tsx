"use client";

import { useInView } from "@/hooks/useInView";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "span" | "p" | "h2";
}

/** Fades and slides its children up the first time they scroll into view. */
export function FadeIn({ children, delay = 0, className = "", as: Tag = "div" }: FadeInProps) {
  const [ref, on] = useInView<HTMLElement>(0.15);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`fn-fade ${on ? "in" : ""} ${className}`}
      style={{ "--d": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
