import type { ProjectType } from "@/lib/validation/brief";

export interface PopularProject {
  /** Shown on the chip. */
  label: string;
  /** What fills the project field: the exact Qloo entity name, so the chip always resolves. */
  name: string;
  type: ProjectType;
}

/** Well-known titles with rich Qloo data (each verified to resolve to an exact entity with demographics and artists). */
export const POPULAR_PROJECTS: { category: string; items: PopularProject[] }[] = [
  {
    category: "TV",
    items: [
      { label: "Stranger Things", name: "Stranger Things", type: "tv_series" },
      { label: "The Last of Us", name: "The Last of Us", type: "tv_series" },
      { label: "Wednesday", name: "Wednesday", type: "tv_series" },
      { label: "Squid Game", name: "Squid Game", type: "tv_series" },
      { label: "Euphoria", name: "Euphoria", type: "tv_series" },
      { label: "Black Mirror", name: "Black Mirror", type: "tv_series" },
      { label: "The Bear", name: "The Bear", type: "tv_series" },
      { label: "Severance", name: "Severance", type: "tv_series" },
    ],
  },
  {
    category: "Film",
    items: [
      { label: "Dune", name: "Dune", type: "film" },
      { label: "Everything Everywhere All at Once", name: "Everything Everywhere All at Once", type: "film" },
      { label: "Barbie", name: "Barbie", type: "film" },
      { label: "Oppenheimer", name: "Oppenheimer", type: "film" },
    ],
  },
  {
    category: "Brand",
    items: [
      { label: "Nike", name: "Nike", type: "advertising" },
      { label: "Apple", name: "Apple Inc", type: "advertising" },
      { label: "Coca-Cola", name: "Coca-Cola", type: "advertising" },
      { label: "Mercedes-Benz", name: "Mercedes-Benz", type: "advertising" },
    ],
  },
  {
    category: "Game",
    items: [
      { label: "The Last of Us Part II", name: "The Last of Us Part II", type: "video_game" },
      { label: "Red Dead Redemption 2", name: "Red Dead Redemption 2", type: "video_game" },
      { label: "Cyberpunk 2077", name: "Cyberpunk 2077", type: "video_game" },
      { label: "Zelda: Tears of the Kingdom", name: "The Legend of Zelda: Tears of the Kingdom", type: "video_game" },
    ],
  },
];
