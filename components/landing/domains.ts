/**
 * Domains shown in the engine section: Qloo entity types its API accepts (artist, tv_show, movie,
 * podcast, book, videogame, place, brand), each with the colour used for its beam and legend dot.
 */
export const DOMAINS = [
  { name: "Music", color: "#8B5CF6" },
  { name: "Television", color: "#3B82F6" },
  { name: "Film", color: "#06B6D4" },
  { name: "Podcasts", color: "#0EA5E9" },
  { name: "Books", color: "#F59E0B" },
  { name: "Video games", color: "#EC4899" },
  { name: "Places", color: "#10B981" },
  { name: "Brands", color: "#F97316" },
] as const;
