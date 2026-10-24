"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";
import type { ResearchResult } from "@/lib/agent/types";
import { buildShareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";

/**
 * Copies a self-contained link to this shortlist. `pill` is the labelled button for the results
 * header; `icon` is the compact version for history cards. Falls back to a prompt if the clipboard is blocked.
 */
export function ShareButton({
  result,
  variant = "pill",
  className,
}: {
  result: ResearchResult;
  variant?: "pill" | "icon";
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "trimmed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const { url, trimmed } = buildShareUrl(result, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
    setState(trimmed ? "trimmed" : "copied");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  const done = state !== "idle";
  const label = state === "trimmed" ? "Link copied (explanations shortened)" : state === "copied" ? "Link copied" : "Share shortlist";
  const Icon = done ? Check : Share2;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={share}
        aria-label={`Share the ${result.brief.projectName} shortlist`}
        title={done ? label : "Copy a link to this shortlist"}
        className={cn("inline-flex size-11 items-center justify-center rounded-full text-black/40 transition-colors hover:text-black", className)}
      >
        <Icon className={cn("size-4", done && "text-green-600")} aria-hidden />
        <span className="sr-only" role="status">
          {done ? label : ""}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black/75 transition-colors hover:bg-black hover:text-white",
        className,
      )}
    >
      <Icon className={cn("size-4", done && "text-green-600")} aria-hidden />
      <span role="status">{label}</span>
    </button>
  );
}
