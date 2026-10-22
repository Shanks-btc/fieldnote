import Image from "next/image";
import { artist } from "@/lib/landing/artists";

/** Round, fully opaque, eagerly loaded artist photo. 48px on phones, 56px from `sm`. */
function Face({ name }: { name: string }) {
  return (
    <Image
      src={artist(name).imageUrl}
      alt=""
      width={56}
      height={56}
      sizes="56px"
      loading="eager"
      className="size-12 shrink-0 rounded-full object-cover sm:size-14"
    />
  );
}

/**
 * Hero banner: one centered row of real Qloo artist photos (circles, no rotation, full opacity).
 * Only the faces that fit are shown: the row is a single wrapping line with a fixed height, so any
 * face that would wrap (or be cut off at the screen edge) is hidden instead. Decorative.
 */
export function ArtStrip({ names }: { names: string[] }) {
  return (
    <div
      className="mx-auto flex h-12 max-w-[860px] flex-wrap justify-center gap-3 overflow-hidden px-5 sm:h-14 sm:px-6"
      aria-hidden
    >
      {names.map((n) => (
        <Face key={n} name={n} />
      ))}
    </div>
  );
}
