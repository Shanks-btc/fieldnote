import type { ResearchResult } from "@/lib/agent/types";
import { PROJECT_TYPE_LABELS } from "@/lib/validation/brief";
import type { Brief, BriefFormValues } from "@/lib/validation/brief";

/**
 * Brief history: finished research results kept in this browser's localStorage, newest first.
 * Client-only. Every call is wrapped so a full, blocked or private-mode store never breaks the page.
 */
export interface HistoryEntry {
  /** The research id; saving the same run twice replaces it instead of duplicating. */
  id: string;
  timestamp: number;
  result: ResearchResult;
}

const STORAGE_KEY = "fieldnote-brief-history";
export const MAX_HISTORY = 20;

function isEntry(e: unknown): e is HistoryEntry {
  const x = e as HistoryEntry | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.timestamp === "number" &&
    !!x.result &&
    !!x.result.brief &&
    Array.isArray(x.result.recommendations)
  );
}

export function getHistory(): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return getHistory().find((e) => e.id === id) ?? null;
}

function write(entries: HistoryEntry[]): boolean {
  // Results are large; if the store is full, drop the oldest entries until it fits.
  for (let list = entries; ; list = list.slice(0, -1)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      if (list.length <= 1) return false;
    }
  }
}

/** Adds (or refreshes) a run. Runs with no artists are not worth keeping. */
export function addToHistory(result: ResearchResult, timestamp = Date.now()): HistoryEntry | null {
  if (!result.recommendations.length) return null;
  const existing = getHistory();
  const prior = existing.find((e) => e.id === result.id);
  const entry: HistoryEntry = { id: result.id, timestamp: prior?.timestamp ?? timestamp, result };
  write([entry, ...existing.filter((e) => e.id !== result.id)].slice(0, MAX_HISTORY));
  return entry;
}

export function deleteFromHistory(id: string): void {
  write(getHistory().filter((e) => e.id !== id));
}

export function pipelineMs(result: ResearchResult): number {
  return result.steps.reduce((s, st) => s + (st.durationMs ?? 0), 0);
}

/** The structured brief back as the form's text values (list fields rejoin to what the user typed). */
export function briefToFormValues(b: Brief): BriefFormValues {
  return {
    projectName: b.projectName,
    projectType: b.projectType,
    sceneDescription: b.sceneDescription,
    targetAudience: b.targetAudience,
    geographicMarket: b.geographicMarket,
    mood: b.mood,
    genrePreferences: b.genrePreferences.join(", "),
    culturalReferences: b.culturalReferences.join(", "),
    exclusions: b.exclusions.join(", "),
  };
}

export const projectTypeLabel = (b: Brief) => PROJECT_TYPE_LABELS[b.projectType] ?? b.projectType;

export function getTimeAgo(timestamp: number, now = Date.now()): string {
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
