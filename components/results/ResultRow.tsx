"use client";

import { useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import type { Recommendation } from "@/lib/validation/results";
import { MonoValue } from "@/components/shared/MonoValue";
import { SpotifyIcon } from "@/components/shared/SpotifyIcon";
import { AlbumArt } from "./AlbumArt";
import { AudioPreview } from "./AudioPreview";
import { EvidencePanel } from "./EvidencePanel";
import { ReasoningPanel } from "./ReasoningPanel";
import { ScoreStack } from "./ScoreBar";
import { SpotifyEmbed, getSpotifyArtistId } from "./SpotifyEmbed";

export function ResultRow({ rec, tasteTags, qlooDomains }: { rec: Recommendation; tasteTags: string[]; qlooDomains: string[] }) {
  const [open, setOpen] = useState(false);
  const [player, setPlayer] = useState(false);
  const spotifyId = getSpotifyArtistId(rec.spotifyArtistId, rec.spotifyUrl);
  const playerId = `player-${rec.qlooEntityId}`;
  const panelId = `evidence-${rec.qlooEntityId}`;
  const composite = Math.round(rec.scores.composite * 100);

  return (
    <li>
      <div className="flex items-center gap-3 py-6 sm:gap-8 sm:py-7">
        <MonoValue className="hidden w-5 shrink-0 text-muted-foreground min-[360px]:block sm:w-6">{rec.rank}</MonoValue>
        <AlbumArt url={rec.imageUrl} name={rec.artistName} className="size-12 min-[400px]:size-14" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 break-words text-base font-semibold leading-snug sm:truncate">{rec.trackName ?? rec.artistName}</p>
            {rec.spotifyUrl && (
              <a
                href={rec.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${rec.artistName} on Spotify`}
                title="Open on Spotify"
                className="-m-3.5 shrink-0 p-3.5 opacity-90 hover:opacity-100"
              >
                <SpotifyIcon />
              </a>
            )}
          </div>
          {rec.trackName && <p className="truncate text-sm text-muted-foreground">{rec.artistName}</p>}
          <AudioPreview url={rec.previewUrl} label={rec.artistName} />
          {spotifyId && (
            <button
              type="button"
              onClick={() => setPlayer((p) => !p)}
              aria-expanded={player}
              aria-controls={playerId}
              className="-mb-3 mt-0.5 flex items-center gap-1.5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {player ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
              {player ? "Hide preview" : "Preview on Spotify"}
            </button>
          )}
        </div>

        {/* Desktop: score breakdown. */}
        <ScoreStack scores={rec.scores} className="hidden w-72 shrink-0 sm:block" />

        {/* Mobile: composite only; the breakdown lives in the evidence panel. */}
        <div className="shrink-0 text-right sm:hidden" aria-label={`Composite score ${composite}`}>
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums min-[400px]:text-3xl">{composite}</p>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-wide text-muted-foreground">Score</p>
        </div>

        <button
          type="button"
          className="-mr-3.5 shrink-0 rounded-md p-3.5 text-muted-foreground hover:text-foreground"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? "Hide" : "Show"} evidence for ${rec.artistName}`}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {spotifyId && player && (
        <div id={playerId} className="pb-6 sm:pl-[calc(5.5rem+56px)]">
          <SpotifyEmbed artistId={spotifyId} artistName={rec.artistName} />
        </div>
      )}
      {open && (
        <div id={panelId}>
          <EvidencePanel
            evidence={rec.evidence}
            explanation={rec.explanation}
            scores={rec.scores}
            reasoning={<ReasoningPanel rec={rec} tasteTags={tasteTags} qlooDomains={qlooDomains} />}
          />
        </div>
      )}
    </li>
  );
}
