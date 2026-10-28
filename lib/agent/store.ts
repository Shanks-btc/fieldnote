import type { Brief } from "@/lib/validation/brief";
import type { ResearchEvent, ResearchResult } from "./types";

/**
 * In-memory session store (no database, per the hackathon scope). Events are buffered so a
 * stream that connects late (or reconnects) replays everything that already happened.
 *
 * Limitation: memory is per server instance. That is fine for `next dev` / `next start` and
 * usually fine on a single warm Vercel instance, but a cold start loses sessions. The `done`
 * event carries the full result so the browser also caches it.
 */
export interface Session {
  id: string;
  brief: Brief;
  status: "running" | "done" | "error";
  events: ResearchEvent[];
  result: ResearchResult | null;
  listeners: Set<(e: ResearchEvent) => void>;
  createdAt: number;
}

const g = globalThis as unknown as { __fieldnoteSessions?: Map<string, Session> };
const sessions = (g.__fieldnoteSessions ??= new Map<string, Session>());

const MAX_SESSIONS = 200;

export function createSession(id: string, brief: Brief): Session {
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) sessions.delete(oldest.id);
  }
  const s: Session = { id, brief, status: "running", events: [], result: null, listeners: new Set(), createdAt: Date.now() };
  sessions.set(id, s);
  return s;
}

export const getSession = (id: string) => sessions.get(id);

export function pushEvent(s: Session, e: ResearchEvent) {
  s.events.push(e);
  if (e.type === "done") {
    s.status = "done";
    s.result = e.result;
  } else if (e.type === "error") {
    s.status = "error";
  }
  for (const l of s.listeners) l(e);
}
