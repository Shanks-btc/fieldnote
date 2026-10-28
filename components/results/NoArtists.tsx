"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { briefToFormValues } from "@/lib/brief-history";
import type { ResearchResult } from "@/lib/agent/types";
import { startResearch } from "@/lib/startResearch";
import { EXAMPLE_BRIEFS, briefMode, type Brief, type BriefFormValues } from "@/lib/validation/brief";

/** Why a run came back empty: Qloo failed or timed out ("api"), or it simply had nothing for this brief ("none"). */
export function emptyCause(result: Pick<ResearchResult, "steps">): "api" | "none" {
  const failed = result.steps.some((s) => (s.id === "resolveProject" || s.id === "recommendArtists" || s.id === "searchArtists") && s.status === "error");
  return failed ? "api" : "none";
}

/** Never a blank page: says what happened and offers a retry, plus working examples when the brief was the problem. */
export function NoArtists({ brief, cause, mode }: { brief: Brief | null; cause: "api" | "none"; mode?: "entity" | "description" }) {
  const described = mode === "description" || (mode == null && !!brief && briefMode(brief) === "description");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, values: BriefFormValues) {
    setBusy(key);
    setError(null);
    try {
      router.push(`/brief/${await startResearch(values)}/research`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(null);
    }
  }

  return (
    <div role="alert" className="space-y-6 border-y border-border py-12 text-center sm:py-16">
      <div className="space-y-2">
        <p className="font-medium">{cause === "api" ? "The data source took too long to respond" : "No matching artists found"}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {cause === "api"
            ? "The cultural intelligence API took too long to respond. This happens occasionally."
            : described
              ? "We couldn't find artists matching this description. Try including specific genre names (e.g., 'afrobeat', 'lo-fi hip hop', 'synthwave') or pick a known project from the brief form."
              : "We couldn't find matching artists for this brief. Try being more specific about the mood, genre, or show/film you're scoring for."}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {brief && (
          <Button variant="solid" size="lg" disabled={busy !== null} onClick={() => run("retry", briefToFormValues(brief))}>
            {busy === "retry" ? "Starting…" : "Try again"}
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <Link href="/brief">Edit the brief</Link>
        </Button>
      </div>

      {cause === "none" && (
        <div className="space-y-3">
          <p className="font-mono text-xs text-muted-foreground">Or try an example</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_BRIEFS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                disabled={busy !== null}
                onClick={() => run(ex.label, ex.values)}
                className="min-h-11 rounded-full border border-border bg-background px-4 text-sm transition-colors hover:border-foreground disabled:opacity-50"
              >
                {busy === ex.label ? "Starting…" : ex.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
