const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

/**
 * Spotify artist ID from Qloo's stored ID, or failing that from an open.spotify.com URL or a
 * spotify:artist: URI. Returns null unless the result looks like a real 22-character ID, since the
 * value ends up in an iframe src.
 */
export function getSpotifyArtistId(artistId: string | null, spotifyUrl: string | null): string | null {
  if (artistId && SPOTIFY_ID.test(artistId)) return artistId;
  const m = spotifyUrl?.match(/artist[/:]([A-Za-z0-9]+)/);
  return m && SPOTIFY_ID.test(m[1]) ? m[1] : null;
}

/** Spotify's official artist embed: artist header plus top tracks with 30s previews. No API key needed. */
export function SpotifyEmbed({ artistId, artistName, compact = true }: { artistId: string; artistName: string; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl bg-black/30">
      <iframe
        src={`https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`}
        width="100%"
        height={compact ? 152 : 352}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block rounded-xl"
        title={`Spotify player for ${artistName}`}
      />
    </div>
  );
}
