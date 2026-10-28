"use client";

import { useInView } from "@/hooks/useInView";
import { Beam } from "./Beam";

// The six steps the agent actually runs (same order as the research timeline).
const STEPS = [
  { label: "Resolve", color: "#111111", x: 50 },
  { label: "Taste", color: "#3B82F6", x: 150 },
  { label: "Audience", color: "#06B6D4", x: 250 },
  { label: "Artists", color: "#F59E0B", x: 350 },
  { label: "Score", color: "#8B5CF6", x: 450 },
  { label: "Explain", color: "#22C55E", x: 550 },
] as const;

const NODE_W = 64;
const MID_Y = 40;

const segment = (i: number) => `M${STEPS[i].x + NODE_W / 2} ${MID_Y} L${STEPS[i + 1].x - NODE_W / 2} ${MID_Y}`;

/** Horizontal pipeline: lines draw in, then a coloured beam hops from step to step and each node lights up. */
export function PipelineArt() {
  const [ref, on] = useInView<SVGSVGElement>();

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={ref}
        viewBox="0 0 600 90"
        className={`fn-art ${on ? "in" : ""} mx-auto block w-full min-w-[560px] max-w-[620px] lg:min-w-0`}
        aria-hidden
      >
        {STEPS.slice(0, -1).map((_, i) => (
          <path
            key={`line-${i}`}
            className="draw"
            style={{ "--d": `${i * 0.12}s` } as React.CSSProperties}
            pathLength={1}
            d={segment(i)}
            fill="none"
            stroke="#E5E5E5"
            strokeWidth={2}
          />
        ))}

        {STEPS.slice(0, -1).map((_, i) => (
          <Beam key={`beam-${i}`} d={segment(i)} color={STEPS[i + 1].color} dur={2.4} delay={0.6 + i * 0.45} width={2.5} />
        ))}

        {STEPS.map((step, i) => (
          <g key={step.label} className="node" style={{ "--d": `${0.2 + i * 0.1}s` } as React.CSSProperties}>
            <g
              className="lit"
              style={{ "--c": step.color, "--dur": "2.4s", "--d": `${0.6 + i * 0.45}s` } as React.CSSProperties}
            >
              <rect x={step.x - NODE_W / 2} y={28} width={NODE_W} height={24} rx="7" fill="#fff" stroke="#D4D4D4" strokeWidth={1} />
            </g>
            <text
              x={step.x}
              y={44}
              textAnchor="middle"
              fill="#333"
              fontSize="9"
              fontWeight="500"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {step.label}
            </text>
            <circle cx={step.x} cy={65} r="3" fill={step.color} />
          </g>
        ))}

        <text
          x="300"
          y="84"
          textAnchor="middle"
          fill="#AAA"
          fontSize="7.5"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.1em"
        >
          ~20 SECONDS END TO END
        </text>
      </svg>
    </div>
  );
}
