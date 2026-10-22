import { getSession } from "@/lib/agent/store";
import type { ResearchEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/research/[id]/stream — SSE. Replays buffered events, then streams live ones. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
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
