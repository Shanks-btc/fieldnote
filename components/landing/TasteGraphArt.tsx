"use client";

import { useInView } from "@/hooks/useInView";
import { Beam } from "./Beam";
import { DOMAINS } from "./domains";

const CX = 220;
const CY = 170;
const RADIUS = 120;
const STEP = 360 / DOMAINS.length;

/** Point at `angleDeg` (0 = top, clockwise) and distance `r` from the centre. */
function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

/** Gently curved path from the hub to a domain node. */
function pathTo(angle: number, i: number) {
  const target = polar(angle, RADIUS);
  const mid = polar(angle, RADIUS * 0.55);
  const cx = CX + (mid.x - CX) * 0.7 + (i % 2 === 0 ? 8 : -8);
  const cy = CY + (mid.y - CY) * 0.7 + (i % 2 === 0 ? -8 : 8);
  return `M${CX} ${CY} Q ${cx} ${cy}, ${target.x} ${target.y}`;
}

/** Radial constellation: a Qloo hub with a pulsing ring, and a beam out to each domain. */
export function TasteGraphArt() {
  const [ref, on] = useInView<SVGSVGElement>();

  return (
    <svg ref={ref} viewBox="0 0 440 340" className={`fn-art ${on ? "in" : ""} mx-auto block w-full max-w-[440px]`} aria-hidden>
      {[0.5, 1.5].map((d) => (
        <circle
          key={d}
          className="ring-pulse"
          cx={CX}
          cy={CY}
          r="20"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="0.8"
          style={{ "--d": `${d}s` } as React.CSSProperties}
        />
      ))}

      {DOMAINS.map((d, i) => (
        <path
          key={`path-${d.name}`}
          className="draw"
          style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}
          pathLength={1}
          d={pathTo(i * STEP, i)}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={1}
        />
      ))}

      {DOMAINS.map((d, i) => (
        <Beam key={`beam-${d.name}`} d={pathTo(i * STEP, i)} color={d.color} dur={3.5} delay={0.8 + i * 0.35} width={1.5} />
      ))}

      {DOMAINS.map((d, i) => {
        const pos = polar(i * STEP, RADIUS);
        const w = d.name.length * 6.2 + 26;
        return (
          <g key={d.name} className="node" style={{ "--d": `${0.3 + i * 0.1}s` } as React.CSSProperties}>
            <g className="lit" style={{ "--c": d.color, "--dur": "3.5s", "--d": `${0.8 + i * 0.35}s` } as React.CSSProperties}>
              <rect x={pos.x - w / 2} y={pos.y - 11} width={w} height={22} rx="11" fill="#fff" stroke="#D4D4D4" strokeWidth={0.8} />
            </g>
            <circle cx={pos.x - w / 2 + 11} cy={pos.y} r="3" fill={d.color} />
            <text
              x={pos.x + 5}
              y={pos.y + 3.5}
              textAnchor="middle"
              fill="#333"
              fontSize="8.5"
              fontWeight="500"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {d.name}
            </text>
          </g>
        );
      })}

      <g className="node" style={{ "--d": "0.1s" } as React.CSSProperties}>
        <circle cx={CX} cy={CY} r="22" fill="#000" />
        <text x={CX} y={CY + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
          Qloo
        </text>
      </g>
    </svg>
  );
}
