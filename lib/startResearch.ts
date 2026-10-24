import { saveBrief } from "@/lib/session";
import { briefInputSchema, type BriefFormValues } from "@/lib/validation/brief";

/** Starts a research run for form-shaped values (same call the brief form makes) and returns its id. Client-only. */
export async function startResearch(values: BriefFormValues): Promise<string> {
  const parsed = briefInputSchema.safeParse(values);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "This brief is no longer valid");
  const res = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !body.id) throw new Error(body.error ?? `Request failed (${res.status})`);
  saveBrief(body.id, parsed.data);
  return body.id;
}
