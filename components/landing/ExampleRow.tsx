import { SpotifyIcon } from "@/components/shared/SpotifyIcon";
import { AlbumArt } from "@/components/results/AlbumArt";
import { compositeScore } from "@/lib/scoring/engine";
import { artist } from "@/lib/landing/artists";

export interface ExampleScores {
  /** 0-100. */
  cultural: number;
  audience: number;
  /** 0-100. Defaults to the real weighted composite of the two above. */
  composite?: number;
}

/** Column widths shared by the card header labels and the rows, so they line up. */
export const SCORE_COLS = { sub: "w-12", composite: "w-14" } as const;

function MiniScore({ value, color }: { value: number; color: string }) {
  return (
    <div className={`${SCORE_COLS.sub} text-right`}>
      <div className="mb-1.5 h-[3px] w-full rounded-full bg-neutral-100">
        <div className="h-[3px] rounded-full" style={{ width: `${value}%`, backgroundColor: color, opacity: 0.55 }} />
      </div>
      <span className="font-mono text-[12px] text-black/40">{value}</span>
    </div>
  );
}

/**
 * One row of the landing page's sample-output card. Artist name, photo, Spotify link and tags are
 * real (scripts/fixtures); the scores are sample values and the card says so.
 */
export function ExampleRow({ name, scores, rank }: { name: string; scores: ExampleScores; rank: number }) {
  const a = artist(name);
  const composite =
    scores.composite ??
    Math.round((compositeScore({ creativeFit: null, culturalFit: scores.cultural / 100, audienceRelevance: scores.audience / 100 }) ?? 0) * 100);

  return (
    <div className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-neutral-50/60 sm:gap-5 sm:px-8">
      <span className="w-5 shrink-0 font-mono text-[13px] text-black/20">{rank}</span>
      <AlbumArt url={a.imageUrl} name={a.name} className="size-11 rounded-full" eager />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 break-words text-[15px] font-medium leading-snug text-black/85 sm:truncate">{a.name}</p>
          <a
            href={`https://open.spotify.com/artist/${a.spotifyId}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${a.name} on Spotify`}
            className="-m-3.5 shrink-0 p-3.5"
          >
            <SpotifyIcon />
          </a>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-black/40">{a.tags.slice(0, 2).join(" · ")}</p>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        {/* Sub-scores need room, so they appear from `sm` up. */}
        <div className="hidden items-center gap-6 sm:flex">
          <MiniScore value={scores.cultural} color="#8B5CF6" />
          <MiniScore value={scores.audience} color="#3B82F6" />
        </div>
        <div className={`${SCORE_COLS.composite} text-right`}>
          <p className="text-[24px] font-semibold sm:text-[28px] leading-none tracking-tight text-black/85">{composite}</p>
        </div>
      </div>
    </div>
  );
}
