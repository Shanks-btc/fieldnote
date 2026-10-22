import { SpotifyIcon } from "@/components/shared/SpotifyIcon";
import { AlbumArt } from "@/components/results/AlbumArt";
import { ScoreBar } from "@/components/results/ScoreBar";
import { compositeScore } from "@/lib/scoring/engine";
import { artist } from "@/lib/landing/artists";

export interface ExampleScores {
  /** 0-100. */
  cultural: number;
  audience: number;
  /** 0-100. Defaults to the real weighted composite of the two above. */
  composite?: number;
}

/**
 * Static sample row for the landing page. Artist name, image, Spotify ID and tags are real
 * (from scripts/fixtures); the scores are sample values and the page labels them that way.
 */
export function ExampleRow({ name, scores, rank }: { name: string; scores: ExampleScores; rank: number }) {
  const a = artist(name);
  const composite =
    scores.composite ??
    Math.round((compositeScore({ creativeFit: null, culturalFit: scores.cultural / 100, audienceRelevance: scores.audience / 100 }) ?? 0) * 100);

  return (
    <div className="flex items-center gap-4 py-4 sm:gap-5">
      <span className="hidden w-4 shrink-0 font-mono text-xs text-[#999] sm:block">{rank}</span>
      <AlbumArt url={a.imageUrl} name={a.name} className="size-12" eager />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{a.name}</p>
          <a
            href={`https://open.spotify.com/artist/${a.spotifyId}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${a.name} on Spotify`}
            className="shrink-0"
          >
            <SpotifyIcon />
          </a>
        </div>
        <p className="mt-1 truncate font-mono text-xs text-[#999]">{a.tags.slice(0, 2).join(" · ")}</p>
      </div>
      <div className="hidden w-64 shrink-0 space-y-1.5 sm:block">
        <ScoreBar label="Cultural" value={scores.cultural / 100} />
        <ScoreBar label="Audience" value={scores.audience / 100} />
      </div>
      <p className="w-12 shrink-0 text-right font-mono text-3xl font-bold tabular-nums">{composite}</p>
    </div>
  );
}
