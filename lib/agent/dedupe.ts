import type { Entity } from "@/lib/qloo/types";

/** Words that join a lead artist to the rest of a billing: "Nick Cave & the Bad Seeds", "X feat. Y". */
const CONNECTORS = new Set(["and", "feat", "ft", "featuring", "with", "x", "vs"]);

function tokens(name: string): string[] {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[&+]/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Same act under two billings: identical after normalising, or one name is the other's lead
 * ("Nick Cave" / "Nick Cave & the Bad Seeds"). The lead must be followed by a connector, so
 * unrelated artists that merely share a first word ("Drake" / "Drake Bell") stay separate.
 */
export function sameArtist(a: string, b: string): boolean {
  const [short, long] = [tokens(a), tokens(b)].sort((x, y) => x.length - y.length);
  if (!short.length) return false;
  if (short.length === long.length) return short.every((t, i) => t === long[i]);
  return short.every((t, i) => t === long[i]) && CONNECTORS.has(long[short.length]);
}

/**
 * Drops duplicate artists, keeping the one with the higher Qloo affinity (the cultural-fit
 * source). Duplicates are the same Spotify artist ID, or the same act under a longer billing.
 * Output keeps the input order.
 */
export function dedupeArtists(list: Entity[]): { kept: Entity[]; merged: number } {
  const byAffinity = [...list].sort((a, b) => (b.affinity ?? -1) - (a.affinity ?? -1));
  const keep = new Set<Entity>();
  for (const e of byAffinity) {
    const dup = [...keep].some((k) => (e.spotifyId && k.spotifyId === e.spotifyId) || sameArtist(e.name, k.name));
    if (!dup) keep.add(e);
  }
  return { kept: list.filter((e) => keep.has(e)), merged: list.length - keep.size };
}
