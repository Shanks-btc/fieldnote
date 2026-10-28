"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFromHistory, getHistory, type HistoryEntry } from "@/lib/brief-history";
import { cn } from "@/lib/utils";
import { BriefForm } from "./BriefForm";
import { HistoryPanel } from "./HistoryPanel";

type Tab = "new" | "history";

/** "New brief" / "History" toggle above the form. Both stay mounted so a half-written brief survives a peek at history. */
export function BriefWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("new");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => setEntries(getHistory()), []);
  useEffect(() => {
    refresh();
    if (new URLSearchParams(window.location.search).get("tab") === "history") setTab("history");
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  const tabs: [Tab, string][] = [
    ["new", "New brief"],
    ["history", `History (${entries.length})`],
  ];

  return (
    <div>
      <div role="tablist" aria-label="Brief" className="mb-3 flex justify-center gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => {
              setTab(id);
              if (id === "history") refresh();
            }}
            className={cn(
              "h-11 rounded-full px-5 text-sm font-medium transition-colors",
              tab === id ? "bg-black text-white" : "bg-white text-black/60 hover:text-black",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-new" aria-labelledby="tab-new" hidden={tab !== "new"}>
        <BriefForm />
      </div>
      <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={tab !== "history"}>
        <HistoryPanel
          entries={entries}
          onView={(e) => router.push(`/brief/${e.id}/results?saved=1`)}
          onDelete={(id) => {
            deleteFromHistory(id);
            refresh();
          }}
        />
      </div>
    </div>
  );
}
