import type { Brief } from "@/lib/validation/brief";
import type { ResearchResult } from "@/lib/agent/types";

/** Briefs live in sessionStorage for the hackathon build (no database). Client-only. */
const key = (id: string) => `fieldnote:brief:${id}`;

export function saveBrief(id: string, brief: Brief) {
  try {
    sessionStorage.setItem(key(id), JSON.stringify(brief));
  } catch {
    /* storage unavailable (private mode); the research page will show a missing-brief state */
  }
}

export function loadBrief(id: string): Brief | null {
  try {
    const raw = sessionStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as Brief) : null;
  } catch {
    return null;
  }
}

const resultKey = (id: string) => `fieldnote:result:${id}`;

/** The finished result is cached in the browser too, so results survive a server restart/cold start. */
export function saveResult(id: string, result: ResearchResult) {
  try {
    sessionStorage.setItem(resultKey(id), JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function loadResult(id: string): ResearchResult | null {
  try {
    const raw = sessionStorage.getItem(resultKey(id));
    return raw ? (JSON.parse(raw) as ResearchResult) : null;
  } catch {
    return null;
  }
}
