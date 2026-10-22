import "server-only";
import { QLOO_BASE_URL, QlooError } from "./types";

const MIN_INTERVAL_MS = 250; // 5 calls/sec
const TIMEOUT_MS = 15_000;

type Params = object;

// Module-level queue so concurrent callers share the rate limit.
let nextSlot = 0;
async function takeSlot() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Authenticated GET against the Qloo API.
 * Retries once on 429 (after 1s) and once on 5xx; never on 401/403.
 * Verified: hackathon.api.qloo.com with X-Api-Key (staging.api.qloo.com rejects the key with 401).
 */
export async function qlooGet<T>(path: string, params: Params = {}): Promise<T> {
  const key = process.env.QLOO_API_KEY;
  if (!key) throw new QlooError("QLOO_API_KEY is not set", 500, path);

  const base = process.env.QLOO_BASE_URL || QLOO_BASE_URL;
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params) as [string, unknown][]) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let retried429 = false;
  let retried5xx = false;

  for (;;) {
    await takeSlot();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "X-Api-Key": key, Accept: "application/json" },
        signal: ctrl.signal,
        cache: "no-store",
      });
    } catch (e) {
      throw new QlooError(
        e instanceof Error && e.name === "AbortError" ? "Qloo request timed out" : `Qloo request failed: ${String(e)}`,
        0,
        path,
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) return (await res.json()) as T;

    if (res.status === 429 && !retried429) {
      retried429 = true;
      await sleep(1000);
      continue;
    }
    if (res.status >= 500 && !retried5xx) {
      retried5xx = true;
      continue;
    }
    const body = await res.text().catch(() => "");
    throw new QlooError(`Qloo ${res.status}: ${body.slice(0, 300)}`, res.status, path);
  }
}
