import { runResearch } from "./orchestrator";
import { pushEvent, type Session } from "./store";

/** Runs a session's brief to completion, publishing events to the session (and so to any attached stream). */
export async function executeRun(session: Session) {
  try {
    const result = await runResearch(session.id, session.brief, (e) => pushEvent(session, e));
    pushEvent(session, { type: "done", resultId: session.id, result });
  } catch (e) {
    pushEvent(session, { type: "error", message: e instanceof Error ? e.message : String(e) });
  }
}
