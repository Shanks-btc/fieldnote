import Image from "next/image";
import { artist } from "@/lib/landing/artists";

/** Round, fully opaque, eagerly loaded artist photo. All landing-page art goes through here. */
function Face({ name, size }: { name: string; size: number }) {
  return (
    <Image
      src={artist(name).imageUrl}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      loading="eager"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Hero banner: one straight row of real Qloo artist photos (circles, no rotation, full opacity).
 * Centered and clipped at the screen edges, so on narrow screens the outer faces are cut off evenly.
 * Decorative.
 */
export function ArtStrip({ names }: { names: string[] }) {
  return (
    <div className="flex w-full justify-center overflow-hidden" aria-hidden>
      <div className="flex shrink-0 items-center gap-3">
        {names.map((n) => (
          <Face key={n} name={n} size={56} />
        ))}
      </div>
    </div>
  );
}

