"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { TextLink } from "@/components/shared/TextLink";
import { NoArtists, emptyCause } from "@/components/results/NoArtists";
import { briefToFormValues } from "@/lib/brief-history";
import { loadBrief, saveResult } from "@/lib/session";
import { NETWORK_ERROR, startResearch } from "@/lib/startResearch";
import { cn } from "@/lib/utils";
import type { ResearchEvent, ResearchStep, StepId } from "@/lib/agent/types";
import { stepDefinitionsFor } from "@/lib/agent/catalogue";
import { briefMode, briefTitle, type Brief } from "@/lib/validation/brief";
import { ResearchProgress } from "./ResearchProgress";
import { ResearchTimeline } from "./ResearchTimeline";

type Phase = "running" | "done" | "failed";

/** "Complete" shows for this long, then the page fades out and the results fade in. */
const COMPLETE_HOLD_MS = 1100;
const FADE_MS = 400;

/** base64url of the brief's JSON (UTF-8 safe), the format the stream route's `brief` parameter expects. */
function encodeBrief(values: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(values));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function ResearchView({ id }: { id: string }) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [phase, setPhase] = useState<Phase>("running");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ artists: number; seconds: number } | null>(null);
  const [empty, setEmpty] = useState<"api" | "none" | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  // Clock for elapsed times; null until mounted so server and client render the same first frame.
  const [clock, setClock] = useState<{ start: number; now: number } | null>(null);
  const startedAt = useRef<Partial<Record<StepId, number>>>({});

  useEffect(() => {
    setBrief(loadBrief(id));
    setClock({ start: Date.now(), now: Date.now() });

    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = setInterval(() => setClock((c) => (c ? { ...c, now: Date.now() } : c)), 250);
    // The brief rides along so a server instance that never saw this id can run it instead of 404ing.
    const saved = loadBrief(id);
    const es = new EventSource(`/api/research/${id}/stream${saved ? `?brief=${encodeBrief(briefToFormValues(saved))}` : ""}`);

    const stop = () => {
      finished = true;
      es.close();
      clearInterval(tick);
    };

    es.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as ResearchEvent;
      if (event.type === "step") {
        if (event.step.status === "running") startedAt.current[event.step.id] ??= Date.now();
        setSteps((prev) => [...prev.filter((s) => s.id !== event.step.id), event.step]);
      } else if (event.type === "done") {
        stop();
        saveResult(id, event.result);
        const artists = event.result.recommendations.length;
        setSummary({ artists, seconds: event.result.steps.reduce((t, st) => t + (st.durationMs ?? 0), 0) / 1000 });
        setBrief(event.result.brief);
        setPhase("done");
        if (artists === 0) {
          // Never hand over to a blank results page: explain it here instead.
          setEmpty(emptyCause(event.result));
        } else {
          timers.push(setTimeout(() => setLeaving(true), COMPLETE_HOLD_MS));
          timers.push(setTimeout(() => router.push(`/brief/${id}/results`), COMPLETE_HOLD_MS + FADE_MS));
        }
      } else if (event.type === "error") {
        stop();
        setError(event.message);
        setPhase("failed");
      }
    };

    es.onerror = () => {
      if (finished) return;
      stop();
      // A 404 from the stream means the server no longer has this session.
      void fetch(`/api/research/${id}/results`)
        .then((r) => (r.status === 404 ? "This research session is no longer on the server." : NETWORK_ERROR))
        .catch(() => NETWORK_ERROR)
        .then((message) => {
          setError(message);
          setPhase("failed");
        });
    };

    return () => {
      stop();
      timers.forEach(clearTimeout);
    };
  }, [id, router]);

  async function retry() {
    if (!brief) return;
    setRetrying(true);
    try {
      router.push(`/brief/${await startResearch(briefToFormValues(brief))}/research`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setRetrying(false);
    }
  }

  const now = clock?.now ?? 0;
  const done = phase === "done";
  // A brief with no named project runs the shorter four-step track.
  const defs = stepDefinitionsFor(brief ? briefMode(brief) : "entity");

  return (
    <div className={cn("space-y-10 transition-opacity ease-out motion-reduce:transition-none", leaving ? "opacity-0" : "opacity-100")} style={{ transitionDuration: `${FADE_MS}ms` }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Running {brief ? briefTitle(brief) : "your brief"}
        </h1>
        {phase === "running" && <Badge tone="outline">Running</Badge>}
        {phase === "done" && !empty && <Badge tone="success">Complete</Badge>}
        {phase === "done" && empty && <Badge tone="danger">No results</Badge>}
        {phase === "failed" && <Badge tone="danger">Failed</Badge>}
      </div>

      {/* A run with nothing to show says so first; the step log stays below for anyone who wants the detail. */}
      {done && empty && <NoArtists brief={brief} cause={empty} mode={brief ? briefMode(brief) : undefined} />}

      {phase !== "failed" && !empty && (
        <ResearchProgress steps={steps} startedAt={startedAt.current} runStartedAt={clock?.start ?? 0} now={now} done={done} defs={defs} />
      )}

      <ResearchTimeline steps={steps} startedAt={startedAt.current} now={now} defs={defs} />

      {done && summary && summary.artists > 0 && (
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-foreground pt-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Research complete</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {summary.artists} artist{summary.artists === 1 ? "" : "s"} scored
              <span className="ml-3 font-mono text-base font-normal text-muted-foreground">{summary.seconds.toFixed(1)}s</span>
            </p>
          </div>
          <TextLink href={`/brief/${id}/results`}>View results</TextLink>
        </div>
      )}
      {phase === "failed" && (
        <div role="alert" className="space-y-4 border-l-2 border-destructive pl-4 text-sm">
          <p className="text-destructive">{error}</p>
          <div className="flex flex-wrap gap-3">
            {brief && (
              <Button variant="solid" disabled={retrying} onClick={retry}>
                {retrying ? "Starting…" : "Try again"}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/brief">Start a new brief</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
