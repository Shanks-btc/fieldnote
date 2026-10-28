// Spotify Web API client (client-credentials flow). NOT IMPLEMENTED (Phase 6).
// Env: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET.
//
// Scope is deliberately small: Qloo already gives us the Spotify artist ID
// (Entity.spotifyId = external.spotify[0].id) and an image (Entity.imageUrl), so there is
// no name search or fuzzy matching. The only job is fetching top tracks for audio previews.

export interface SpotifyTrack {
  id: string;
  name: string;
  albumName: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  url: string;
}

// TODO(phase 6): getTopTracks(spotifyArtistId, market): Promise<SpotifyTrack[]>
//  - token caching/refresh for the client-credentials flow
//  - treat previewUrl as optional: Spotify has restricted preview_url for some apps
//  - fall back to Entity.imageUrl for album art when no track image is available
//  - when Qloo has no spotifyId for an artist, show the row without a preview (do not guess by name)
