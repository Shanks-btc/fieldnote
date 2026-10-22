import { after, NextResponse } from "next/server";
import { briefInputSchema } from "@/lib/validation/brief";
import { runResearch } from "@/lib/agent/orchestrator";
import { createSession, pushEvent } from "@/lib/agent/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/research — validates the brief, starts the run in the background, returns { id }. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = briefInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid brief", issues: parsed.error.issues }, { status: 400 });
  }
  if (!process.env.QLOO_API_KEY) {
    return NextResponse.json({ error: "Server is missing QLOO_API_KEY" }, { status: 500 });
  }

  const id = crypto.randomUUID();
  const session = createSession(id, parsed.data);

  // after() keeps the run alive past the response (needed on serverless hosts).
  after(async () => {
    try {
      const result = await runResearch(id, parsed.data, (e) => pushEvent(session, e));
      pushEvent(session, { type: "done", resultId: id, result });
    } catch (e) {
      pushEvent(session, { type: "error", message: e instanceof Error ? e.message : String(e) });
    }
  });

  return NextResponse.json({ id }, { status: 202 });
}
