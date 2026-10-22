"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/Badge";
import { TextLink } from "@/components/shared/TextLink";
import { loadBrief, saveResult } from "@/lib/session";
import type { ResearchEvent, ResearchStep } from "@/lib/agent/types";
import { ResearchTimeline } from "./ResearchTimeline";

type Phase = "running" | "done" | "failed";

export function ResearchView({ id }: { id: string }) {
  const router = useRouter();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [phase, setPhase] = useState<Phase>("running");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ artists: number; seconds: number } | null>(null);

  useEffect(() => {
    setProjectName(loadBrief(id)?.projectName ?? null);

    let finished = false;
    let redirect: ReturnType<typeof setTimeout> | undefined;
    const es = new EventSource(`/api/research/${id}/stream`);

    es.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as ResearchEvent;
      if (event.type === "step") {
        setSteps((prev) => [...prev.filter((s) => s.id !== event.step.id), event.step]);
      } else if (event.type === "done") {
        finished = true;
        saveResult(id, event.result);
        setSummary({
          artists: event.result.recommendations.length,
          seconds: event.result.steps.reduce((t, st) => t + (st.durationMs ?? 0), 0) / 1000,
        });
        setPhase("done");
        es.close();
        redirect = setTimeout(() => router.push(`/brief/${id}/results`), 3200);
      } else if (event.type === "error") {
        finished = true;
        setError(event.message);
        setPhase("failed");
        es.close();
      }
    };

    es.onerror = () => {
      if (finished) return;
      es.close();
      // A 404 from the stream means the server no longer has this session.
      void fetch(`/api/research/${id}/results`).then((r) => {
        setError(
          r.status === 404
            ? "This research session is no longer on the server. Start a new brief."
            : "Lost connection to the research stream.",
        );
        setPhase("failed");
      });
    };

    return () => {
      finished = true;
      es.close();
      if (redirect) clearTimeout(redirect);
    };
  }, [id, router]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Researching {projectName ?? "your brief"}
        </h1>
        {phase === "running" && <Badge tone="outline">Running</Badge>}
        {phase === "done" && <Badge tone="success">Complete</Badge>}
        {phase === "failed" && <Badge tone="danger">Failed</Badge>}
      </div>

      <ResearchTimeline steps={steps} />

      {phase === "done" && summary && (
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
          <Button asChild variant="outline">
            <Link href="/brief">Start a new brief</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
