"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MonoValue } from "@/components/shared/MonoValue";
import { addToHistory, briefToFormValues, getHistoryEntry, getTimeAgo } from "@/lib/brief-history";
import { loadResult, saveResult } from "@/lib/session";
import { startResearch } from "@/lib/startResearch";
import type { ResearchResult } from "@/lib/agent/types";
import { PipelineSummary } from "./PipelineSummary";
import { ResultsTable } from "./ResultsTable";
import { ShareButton } from "./ShareButton";
import { TasteTags } from "./TasteTags";

type State = { kind: "loading" } | { kind: "ready"; result: ResearchResult } | { kind: "error"; message: string };

const signed = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;

/** Banner for results reopened from history: says they are saved, and re-runs the same brief live. */
function SavedBanner({ result, savedAt }: { result: ResearchResult; savedAt: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAgain() {
    setBusy(true);
    setError(null);
    try {
      router.push(`/brief/${await startResearch(briefToFormValues(result.brief))}/research`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-white px-5 py-3 text-sm">
      <p className="text-muted-foreground">Showing saved results from {getTimeAgo(savedAt)}</p>
      <button
        type="button"
        onClick={runAgain}
        disabled={busy}
        className="-my-2 py-2 font-medium text-violet-600 hover:text-violet-800 disabled:opacity-50"
      >
        {busy ? "Starting…" : "Run again"}
      </button>
      {error && <p className="w-full text-destructive">{error}</p>}
    </div>
  );
}

export function ResultsView({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  // When these results were saved, if they were opened from history rather than just produced.
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const fromHistory = new URLSearchParams(window.location.search).get("saved") === "1";
    const cached = loadResult(id);
    const entry = getHistoryEntry(id);
    const local = cached ?? entry?.result ?? null;
    if (local) {
      setState({ kind: "ready", result: local });
      // Opened from history, or restored from it after the session cache was lost: not a fresh run.
      if (entry && (fromHistory || !cached)) setSavedAt(entry.timestamp);
      else addToHistory(local);
      return;
    }
    let cancelled = false;
    fetch(`/api/research/${id}/results`)
      .then(async (r) => {
        if (r.status === 202) throw new Error("This research is still running.");
        if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `Request failed (${r.status})`);
        const result = (await r.json()) as ResearchResult;
        saveResult(id, result);
        addToHistory(result);
        if (!cancelled) setState({ kind: "ready", result });
      })
      .catch((e: Error) => !cancelled && setState({ kind: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") return <p className="text-sm text-muted-foreground">Loading results…</p>;

  if (state.kind === "error") {
    return (
      <div className="max-w-xl space-y-4">
        <p className="text-lg font-medium">Couldn&apos;t load results</p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <div className="flex gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href={`/brief/${id}/research`}>Back to research</Link>
          </Button>
          <Button asChild>
            <Link href="/brief">Start a new brief</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { result } = state;
  const { project, demographics, tasteProfile, recommendations, warnings } = result;
  const name = project?.name ?? result.brief.projectName;
  const totalMs = result.steps.reduce((s, st) => s + (st.durationMs ?? 0), 0);
  const topAge = demographics
    ? (Object.entries(demographics.age) as [string, number][]).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="space-y-12">
      {savedAt != null && <SavedBanner result={result} savedAt={savedAt} />}

      {/* 1. Project + one-line summary */}
      <header className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-4xl md:text-5xl">{name}</h1>
        <p className="text-muted-foreground">
          {recommendations.length} artist{recommendations.length === 1 ? "" : "s"} scored for {name}
          {totalMs > 0 && (
            <>
              {" "}
              · <MonoValue>{(totalMs / 1000).toFixed(1)}s</MonoValue>
            </>
          )}
        </p>
        {recommendations.length > 0 && (
          <div className="pt-2">
            <ShareButton result={result} />
          </div>
        )}
      </header>

      {/* 2. Taste profile (max 6 inline) + audience line */}
      {(tasteProfile.length > 0 || (demographics && topAge)) && (
        <div className="space-y-4">
          <TasteTags tags={tasteProfile.map((t) => t.name)} />
          {demographics && topAge && (
            <p className="text-sm text-muted-foreground">
              Audience over-indexes {topAge[0].replace(/_/g, " ")} <MonoValue>{signed(topAge[1])}</MonoValue> · gender skew{" "}
              {demographics.gender.female >= 0 ? "female" : "male"}{" "}
              <MonoValue>{signed(Math.abs(demographics.gender.female))}</MonoValue>
              <span className="hidden sm:inline"> (0 is average)</span>
            </p>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div role="status" className="space-y-1 border-l-2 border-amber-400 pl-4 text-sm">
          <p className="font-medium">Some data was unavailable</p>
          <ul className="list-disc pl-5 text-muted-foreground">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && <PipelineSummary result={result} />}

      {/* 3. The ranked list */}
      {recommendations.length > 0 ? (
        <section className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Cultural and audience scores are relative to this shortlist. Creative fit is scored independently against the brief.
          </p>
          <ResultsTable
            recommendations={recommendations}
            tasteTags={tasteProfile.map((t) => t.name)}
            qlooDomains={result.qlooDomains ?? []}
          />
        </section>
      ) : (
        <div className="border-y border-border py-16 text-center">
          <p className="font-medium">No artists to show</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            The research ran but produced no ranked artists. See the notes above.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/brief/${id}/research`}>View research steps</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/brief">New brief</Link>
        </Button>
      </div>
    </div>
  );
}
