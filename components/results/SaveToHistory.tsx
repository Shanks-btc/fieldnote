"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, BookmarkPlus } from "lucide-react";
import { addToHistory } from "@/lib/brief-history";
import { sharedToResult, type SharedResults } from "@/lib/share";

/** For people who received a link: keep this shortlist in their own history and open it in the full results view. */
export function SaveToHistory({ data }: { data: SharedResults }) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function save() {
    const id = crypto.randomUUID();
    const entry = addToHistory(sharedToResult(data, id), data.ts);
    if (entry) setSavedId(id);
    else setFailed(true);
  }

  if (savedId) {
    return (
      <p className="inline-flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-4 text-green-600" aria-hidden /> Saved to your history
        </span>
        <Link href={`/brief/${savedId}/results?saved=1`} className="-my-3 py-3 font-medium text-violet-600 hover:text-violet-800">
          Open
        </Link>
      </p>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={save}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black/75 transition-colors hover:bg-black hover:text-white"
      >
        <BookmarkPlus className="size-4" aria-hidden /> Save to my history
      </button>
      {failed && <p className="mt-2 text-sm text-destructive">Couldn&apos;t save: this browser is blocking storage.</p>}
    </div>
  );
}
