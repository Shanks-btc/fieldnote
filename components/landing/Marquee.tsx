const ITEMS = [
  "Cultural Affinity Scoring",
  "Audience Overlap Analysis",
  "Demographic Intelligence",
  "Taste Graph Matching",
  "Sync Placement Research",
  "Artist Discovery",
  "6-Step Agent Pipeline",
];

function List({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex list-none" aria-hidden={hidden || undefined}>
      {ITEMS.map((t) => (
        <li key={t} className="whitespace-nowrap px-6 text-[15px] tracking-[-0.02em] text-black/30 sm:px-10 sm:text-lg">
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Slow horizontal strip of capabilities. The list is rendered twice and the track slides by 50% for a seamless loop. */
export function Marquee() {
  return (
    <div className="marquee flex h-[72px] items-center overflow-hidden sm:h-[100px]" aria-label="Capabilities">
      <div className="marquee-track flex w-max">
        <List />
        <List hidden />
      </div>
    </div>
  );
}
