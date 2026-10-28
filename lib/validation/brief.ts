import { z } from "zod";

export const PROJECT_TYPES = [
  "tv_series",
  "film",
  "documentary",
  "advertising",
  "video_game",
  "podcast",
  "music_video",
  "other",
  /** Legacy: no longer offered in the form, still valid in saved history and shared links. */
  "trailer",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

/** The types the form offers, in display order. */
export const FORM_PROJECT_TYPES = PROJECT_TYPES.filter((t) => t !== "trailer");

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  tv_series: "TV series",
  film: "Film",
  documentary: "Documentary",
  advertising: "Brand / Ad",
  video_game: "Video game",
  podcast: "Podcast",
  music_video: "Music video",
  other: "Other",
  trailer: "Trailer",
};

/**
 * What the music is FOR, per project type. Qloo's data is about the project entity, so the same title
 * gives the same taste graph whatever the dropdown says; this is what makes the type change the
 * creative-fit scores and the written explanations. `short` is the one-line lens shown in the UI,
 * `guidance` goes to the scorer. Pure data, safe to import from client components.
 */
export const PROJECT_TYPE_LENS: Record<ProjectType, { short: string; guidance: string }> = {
  podcast: {
    short: "recognisable in short clips, sets tone without overpowering",
    guidance:
      "The music is for a podcast. It is typically used as an intro, outro, transition sting or light background bed. It should be recognisable in a few seconds, set the right tone for the show's subject, and never overpower speech, so vocals and dense arrangements are a liability.",
  },
  music_video: {
    short: "energy and aesthetic that complement a visual concept",
    guidance:
      "The music is for a music video. Consider visual storytelling alignment, how well the energy matches the pacing of the visuals, and whether the artist's aesthetic and image complement the visual concept. Here the track itself is the star, so distinctiveness and performance potential matter.",
  },
  other: {
    short: "general creative fit from the brief",
    guidance:
      "The project type was not specified. Judge general creative fit from the brief alone: the mood, the scene and what the music is meant to do.",
  },
  tv_series: {
    short: "memorable, identity-defining, can anchor a show",
    guidance:
      "The music is for a TV series. It needs to be memorable and identity-defining, something audiences come to associate with the show. Consider whether the artist could provide a theme, a montage track or an emotional scene cue, and how well their sound holds up across repeated use over many episodes. Brand association with the show matters.",
  },
  film: {
    short: "serves specific scenes: needle drops, credits, emotional punctuation",
    guidance:
      "The music is for a film. It has to serve specific scenes, whether as a needle drop, an end-credits track or emotional punctuation. Consider how the artist's catalogue offers tracks with the right emotional register for cinematic moments, and whether a track can carry a scene on its own.",
  },
  advertising: {
    short: "immediately engaging, on-trend, brand-safe, broad reach",
    guidance:
      "The music is for a brand or advertising campaign. It must be immediately engaging, on-trend and aligned with the brand's identity. Consider sync-licensing appeal, broad demographic reach, how quickly the sound lands in a short spot, and whether the artist's public image complements the brand without controversy.",
  },
  trailer: {
    short: "builds fast, big dynamic arc, impact in under two minutes",
    guidance:
      "The music is for a trailer. It has about two minutes to build tension and land a payoff, so it needs a strong dynamic arc, a recognisable hook and big moments of impact or release. Consider whether the artist's sound can escalate, strip back and hit hard, and whether an existing track or a reworked version would cut to picture well.",
  },
  video_game: {
    short: "immersive, loopable, adaptable to dynamic audio",
    guidance:
      "The music is for a video game. It should be immersive and repeatable without becoming grating. Consider whether the artist's sound works as ambient or environmental audio, menu music or action sequences, and how well it loops and adapts to dynamic audio systems. Long-session listenability matters more than a single standout moment.",
  },
  documentary: {
    short: "atmospheric, non-intrusive, narrative-supporting",
    guidance:
      "The music is for a documentary. It should be atmospheric, non-intrusive and narrative-supporting: it creates mood without competing with dialogue or narration. Subtlety and emotional depth matter more than catchiness or commercial appeal, and a distinctive vocal or a hit-single feel can be a liability.",
  },
};

/** Comma/newline separated free text -> trimmed, non-empty list. */
const listFromText = z
  .string()
  .max(500, "Keep this under 500 characters")
  .transform((s) =>
    s
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean),
  );

/** A description with no project can be as short as a genre ("jazz"); the search-term step expands it. */
const MIN_DESCRIPTION_CHARS = 3;

export const briefInputSchema = z
  .object({
    /** Empty means a descriptive brief: no named project, artists are found from the description. */
    projectName: z.string().trim().max(120).default(""),
    projectType: z.enum(PROJECT_TYPES, { error: "Choose a project type" }).default("other"),
    sceneDescription: z.string().trim().max(2000).default(""),
    targetAudience: z.string().trim().max(500).default(""),
    geographicMarket: z.string().trim().max(200).default(""),
    mood: z.string().trim().max(300).default(""),
    genrePreferences: listFromText.prefault(""),
    culturalReferences: listFromText.prefault(""),
    exclusions: listFromText.prefault(""),
  })
  .superRefine((b, ctx) => {
    const name = b.projectName;
    if (name && name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["projectName"], message: "Enter the show, film or brand name" });
    } else if (!name && !b.sceneDescription) {
      ctx.addIssue({ code: "custom", path: ["projectName"], message: "Select a project or describe what you're looking for" });
    } else if (!name && b.sceneDescription.length < MIN_DESCRIPTION_CHARS) {
      ctx.addIssue({ code: "custom", path: ["sceneDescription"], message: "Add more detail about the mood or scene (at least a few words)" });
    }
  });

/** Raw form values (strings) before parsing. */
export type BriefFormValues = Required<z.input<typeof briefInputSchema>>;
/** Parsed brief with list fields split into arrays. */
export type Brief = z.output<typeof briefInputSchema>;

/** A named project is researched through its Qloo entity; anything else through its description. */
export const briefMode = (b: Pick<Brief, "projectName">): "entity" | "description" => (b.projectName.trim() ? "entity" : "description");

/** What to call a brief in headings and history: the project name, or the start of the description. */
export function briefTitle(b: Pick<Brief, "projectName" | "sceneDescription">): string {
  if (b.projectName.trim()) return b.projectName.trim();
  const text = b.sceneDescription.trim().replace(/\s+/g, " ");
  if (text.length <= 48) return text || "Untitled brief";
  return text.slice(0, 48).replace(/[\s,.;:]+\S*$/, "") + "…";
}

export const EXAMPLE_BRIEF: BriefFormValues = {
  projectName: "Stranger Things",
  projectType: "tv_series",
  sceneDescription:
    "Season 5 transition scene: the group drives out of Hawkins at dusk after a loss. Quiet, wide shots; the music should carry grief and fragile hope without tipping into melodrama.",
  targetAudience: "Adults 18-34, existing fans of 80s-set sci-fi and coming-of-age drama",
  geographicMarket: "United States",
  mood: "Melancholy, nostalgic, quietly hopeful",
  genrePreferences: "indie rock, synth-pop, dream pop",
  culturalReferences: "Drive (2011), Kate Bush, John Hughes films",
  exclusions: "No lyrics about romance, nothing already used in a previous season",
};

/** One-click examples under the form. Each fills the project, the type and the scene; the first resolves through a Qloo entity, the rest are described by mood and genre. */
export const EXAMPLE_BRIEFS: { label: string; values: BriefFormValues }[] = [
  { label: "Stranger Things S5 finale", values: EXAMPLE_BRIEF },
  {
    label: "Luxury car ad, night driving",
    values: {
      projectName: "",
      projectType: "advertising",
      sceneDescription:
        "Night driving through a neon-lit city. Minimal vocals, deep bass, sophisticated. Premium feel for a luxury automotive brand.",
      targetAudience: "",
      geographicMarket: "",
      mood: "",
      genrePreferences: "",
      culturalReferences: "",
      exclusions: "",
    },
  },
  {
    label: "Afrobeat workout playlist",
    values: {
      projectName: "",
      projectType: "other",
      sceneDescription: "High-energy afrobeat for a running/workout playlist. Upbeat, rhythmic, makes you want to move.",
      targetAudience: "",
      geographicMarket: "",
      mood: "",
      genrePreferences: "",
      culturalReferences: "",
      exclusions: "",
    },
  },
  {
    label: "Indie film, summer road trip",
    values: {
      projectName: "",
      projectType: "film",
      sceneDescription:
        "Coming-of-age indie film. Summer road trip montage. Windows down, golden hour, bittersweet nostalgia.",
      targetAudience: "",
      geographicMarket: "",
      mood: "",
      genrePreferences: "",
      culturalReferences: "",
      exclusions: "",
    },
  },
];
