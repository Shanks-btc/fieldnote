"use client";

interface BeamProps {
  d: string;
  color: string;
  dur?: number;
  delay?: number;
  width?: number;
}

/** A glowing dash that travels along an SVG path. Must sit inside an element with the `fn-art` class. */
export function Beam({ d, color, dur = 2.8, delay = 0, width = 2 }: BeamProps) {
  return (
    <path
      className="beam"
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      style={{ "--c": color, "--dur": `${dur}s`, "--d": `${delay}s` } as React.CSSProperties}
    />
  );
}
