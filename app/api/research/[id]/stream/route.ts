import { briefInputSchema } from "@/lib/validation/brief";
import { executeRun } from "@/lib/agent/launch";
import { createSession, getSession } from "@/lib/agent/store";
import type { ResearchEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sessions live in one server instance's memory, and on a serverless host this request can land on a
 * different instance than the POST that created it. The browser therefore sends the brief along (base64url
 * JSON in `brief`), and an instance that has never seen the id starts the run itself instead of failing.
 */
function adoptSession(id: string, req: Request) {
  const raw = new URL(req.url).searchParams.get("brief");
  if (!raw || !UUID.test(id)) return undefined;
  try {
    const parsed = briefInputSchema.safeParse(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
    if (!parsed.success || !process.env.QLOO_API_KEY) return undefined;
    const created = createSession(id, parsed.data);
    void executeRun(created); // the stream below stays open until it finishes, which keeps this instance alive
    return created;
  } catch {
    return undefined;
  }
}

/** GET /api/research/[id]/stream — SSE. Replays buffered events, then streams live ones. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id) ?? adoptSession(id, req);
  if (!session) {
    return Response.json({ error: "Session not found (it may have expired). Start a new brief." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (e: ResearchEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        if (e.type === "done" || e.type === "error") close();
      };
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        session.listeners.delete(send);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);
      cleanup = close;

      // Replay first, then subscribe, in one synchronous block so no event is missed or doubled.
      for (const e of session.events) send(e);
      if (!closed) session.listeners.add(send);
      req.signal.addEventListener("abort", close);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
