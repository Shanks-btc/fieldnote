"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

function hueFor(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/** Dark, warm gradient with faint record grooves and a centre label. Used whenever there is no image. */
function Vinyl({ seed, hue }: { seed: string; hue?: number }) {
  const h = hue ?? hueFor(seed);
  return (
    <div
      className="absolute inset-0"
      style={{ background: `linear-gradient(135deg, hsl(${h} 48% 30%) 0%, hsl(${(h + 28) % 360} 42% 9%) 100%)` }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ background: "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,.07) 0 1px, transparent 1px 5px)" }}
      />
      <div className="absolute left-1/2 top-1/2 size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15" />
    </div>
  );
}

/**
 * Artist art: the Qloo image when we have one, otherwise a vinyl-style gradient (never initials).
 * 56px by default; override with className (e.g. "size-12").
 */
export function AlbumArt({
  url,
  name,
  hue,
  className,
  eager = false,
}: {
  url: string | null;
  name: string;
  hue?: number;
  className?: string;
  /** Load immediately instead of lazily (for images at or near the top of the page). */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative size-14 shrink-0 overflow-hidden rounded-sm bg-neutral-900", className)}>
      {url && !failed ? (
        <Image
          src={url}
          alt={name}
          fill
          sizes="64px"
          loading={eager ? "eager" : undefined}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Vinyl seed={name} hue={hue} />
      )}
    </div>
  );
}
