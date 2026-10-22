"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Recommendation } from "@/lib/validation/results";
import { MonoValue } from "@/components/shared/MonoValue";
import { SpotifyIcon } from "@/components/shared/SpotifyIcon";
import { AlbumArt } from "./AlbumArt";
import { AudioPreview } from "./AudioPreview";
import { EvidencePanel } from "./EvidencePanel";
import { ScoreStack } from "./ScoreBar";

export function ResultRow({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(false);
  const panelId = `evidence-${rec.qlooEntityId}`;
  const composite = Math.round(rec.scores.composite * 100);

  return (
    <li>
      <div className="flex items-center gap-4 py-7 sm:gap-8">
        <MonoValue className="w-5 shrink-0 text-muted-foreground sm:w-6">{rec.rank}</MonoValue>
        <AlbumArt url={rec.imageUrl} name={rec.artistName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold leading-snug sm:truncate">{rec.trackName ?? rec.artistName}</p>
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
        </div>

        {/* Desktop: score breakdown. */}
        <ScoreStack scores={rec.scores} className="hidden w-72 shrink-0 sm:block" />

        {/* Mobile: composite only; the breakdown lives in the evidence panel. */}
        <div className="shrink-0 text-right sm:hidden" aria-label={`Composite score ${composite}`}>
          <p className="font-mono text-3xl font-semibold leading-none tabular-nums">{composite}</p>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-wide text-muted-foreground">Score</p>
        </div>

        <button
          type="button"
          className="-mr-2 shrink-0 rounded-md p-2 text-muted-foreground hover:text-foreground"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? "Hide" : "Show"} evidence for ${rec.artistName}`}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div id={panelId}>
          <EvidencePanel evidence={rec.evidence} explanation={rec.explanation} scores={rec.scores} />
        </div>
      )}
    </li>
  );
}
