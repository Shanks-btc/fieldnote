"use client";

import { Trash2 } from "lucide-react";
import { ShareButton } from "@/components/results/ShareButton";
import { getTimeAgo, pipelineMs, projectTypeLabel, type HistoryEntry } from "@/lib/brief-history";

function HistoryCard({ entry, onView, onDelete }: { entry: HistoryEntry; onView: () => void; onDelete: () => void }) {
  const { brief, recommendations } = entry.result;
  const ms = pipelineMs(entry.result);
  const scene = brief.sceneDescription.length > 110 ? `${brief.sceneDescription.slice(0, 110).trimEnd()}…` : brief.sceneDescription;

  return (
    <li className="flex items-stretch gap-1 rounded-2xl border border-black/[0.06] bg-white transition-colors hover:border-black/20">
      <button type="button" onClick={onView} className="min-w-0 flex-1 rounded-2xl p-4 text-left sm:p-5">
        <p className="truncate text-sm font-semibold">
          {brief.projectName} <span className="font-normal text-muted-foreground">· {projectTypeLabel(brief)}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-black/60">{scene}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {recommendations.length} artists
          {ms > 0 && <> · {(ms / 1000).toFixed(1)}s</>} · {getTimeAgo(entry.timestamp)}
        </p>
      </button>
      <div className="flex shrink-0 flex-col items-center justify-center pr-1">
        <ShareButton result={entry.result} variant="icon" />
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${brief.projectName} from history`}
          title="Delete"
          className="inline-flex size-11 items-center justify-center rounded-full text-black/40 transition-colors hover:text-red-600"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

/** Past runs, newest first. Opening one shows its saved results without re-running the pipeline. */
export function HistoryPanel({
  entries,
  onView,
  onDelete,
}: {
  entries: HistoryEntry[];
  onView: (e: HistoryEntry) => void;
  onDelete: (id: string) => void;
}) {
  if (!entries.length) {
    return (
      <div className="border-y border-border py-16 text-center">
        <p className="font-medium">No saved briefs yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Every finished research run is saved in this browser so you can reopen or share it later.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <HistoryCard key={e.id} entry={e} onView={() => onView(e)} onDelete={() => onDelete(e.id)} />
      ))}
    </ul>
  );
}
