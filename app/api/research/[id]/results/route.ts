import { NextResponse } from "next/server";
import { getSession } from "@/lib/agent/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/research/[id]/results — the finished result, 202 while running, 404 if unknown. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found (it may have expired)." }, { status: 404 });
  }
  if (session.status === "running") return NextResponse.json({ status: "running" }, { status: 202 });
  if (session.status === "error" || !session.result) {
    const err = session.events.find((e) => e.type === "error");
    return NextResponse.json({ error: err && err.type === "error" ? err.message : "Research failed" }, { status: 500 });
  }
  return NextResponse.json(session.result);
}
