import Link from "next/link";
import type { Metadata } from "next";
import { PageSection } from "@/components/layout/PageSection";
import { SaveToHistory } from "@/components/results/SaveToHistory";
import { SpotifyIcon } from "@/components/shared/SpotifyIcon";
import { PROJECT_TYPE_LABELS } from "@/lib/validation/brief";
import { decodeShared, type SharedResults } from "@/lib/share";

export const metadata: Metadata = {
  title: "Shared shortlist, Fieldnote",
  // Links carry a client's brief; keep them out of search indexes.
  robots: { index: false, follow: false },
};

const pct = (n: number | null) => (n == null ? "n/a" : String(Math.round(n * 100)));

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <PageSection className="py-16 md:py-24">
      <div className="max-w-xl space-y-4">
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
        <Link
          href="/brief"
          className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Try your own brief
        </Link>
      </div>
    </PageSection>
  );
}

function ArtistCard({ artist, rank }: { artist: SharedResults["r"][number]; rank: number }) {
  const [creative, cultural, audience, composite] = artist.s;
  return (
    <li className="rounded-2xl border border-black/[0.05] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-black/30">{String(rank).padStart(2, "0")}</span>
            <h3 className="break-words font-semibold">{artist.n}</h3>
          </div>
          {artist.g.length > 0 && <p className="mt-1 text-xs text-black/40">{artist.g.join(", ")}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-semibold leading-none tabular-nums" aria-label={`Composite score ${pct(composite)}`}>
            {pct(composite)}
          </p>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-wide text-black/40">Score</p>
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-black/45">
        {[
          ["Cultural", cultural],
          ["Creative", creative],
          ["Audience", audience],
        ].map(([label, v]) => (
          <div key={label as string} className="flex gap-1.5">
            <dt>{label as string}</dt>
            <dd className="font-mono tabular-nums text-black/70">{pct(v as number | null)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-sm leading-relaxed text-black/65">{artist.e}</p>

      {artist.sp && (
        <a
          href={`https://open.spotify.com/artist/${artist.sp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="-mb-3 mt-1 inline-flex items-center gap-1.5 py-3 text-xs text-black/50 transition-colors hover:text-black"
        >
          <SpotifyIcon /> Listen on Spotify
        </a>
      )}
    </li>
  );
}

export default async function SharedResultsPage({ searchParams }: { searchParams: Promise<{ d?: string | string[] }> }) {
  const { d } = await searchParams;
  const encoded = Array.isArray(d) ? d[0] : d;

  if (!encoded) return <Notice title="No results to show" body="This link doesn't contain a shortlist. Ask the sender to share it again." />;
  const data = decodeShared(encoded);
  if (!data) return <Notice title="Couldn't read this shortlist" body="The link looks incomplete or damaged. Ask the sender for a fresh one." />;

  const { b: brief } = data;
  return (
    <PageSection className="py-16 md:py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-black/40">Shared shortlist</p>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-4xl">{brief.projectName}</h1>
          <p className="text-muted-foreground">
            {PROJECT_TYPE_LABELS[brief.projectType]} · {data.r.length} artists
            {data.ms > 0 && <> · {(data.ms / 1000).toFixed(1)}s pipeline</>}
          </p>
        </header>

        <section aria-label="Brief" className="rounded-2xl bg-black/[0.04] p-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">Brief</p>
          <p className="text-sm leading-relaxed text-black/70">{brief.sceneDescription}</p>
          <p className="mt-3 text-xs text-black/45">
            Mood: {brief.mood} · Audience: {brief.targetAudience} · Market: {brief.geographicMarket}
          </p>
        </section>

        <ol className="space-y-4">
          {data.r.map((a, i) => (
            <ArtistCard key={`${a.n}-${i}`} artist={a} rank={i + 1} />
          ))}
        </ol>

        <footer className="space-y-4 border-t border-black/10 pt-8 text-center">
          <p className="text-sm text-black/50">Generated by Fieldnote</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/brief"
              className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Try your own brief
            </Link>
            <SaveToHistory data={data} />
          </div>
        </footer>
      </div>
    </PageSection>
  );
}
