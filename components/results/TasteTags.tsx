"use client";

import { useState } from "react";

const VISIBLE = 6;

/** Up to 6 small monospace pills, with a toggle for the rest so tags never dominate the page. */
export function TasteTags({ tags }: { tags: string[] }) {
  const [all, setAll] = useState(false);
  if (!tags.length) return null;
  const shown = all ? tags : tags.slice(0, VISIBLE);
  const hidden = tags.length - VISIBLE;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Taste profile</span>
      {shown.map((t) => (
        <span key={t} className="inline-flex min-h-7 items-center rounded-full border border-border px-2.5 font-mono text-xs">
          {t}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          aria-expanded={all}
          className="-my-2 inline-flex min-h-11 items-center font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {all ? "Show less" : `Show all (${tags.length})`}
        </button>
      )}
    </div>
  );
}
