/** Spotify mark, 16x16, brand green. Decorative: put the accessible name on the wrapping link. */
export function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954" aria-hidden="true" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34a.75.75 0 0 1-1.03.25c-2.82-1.72-6.36-2.11-10.54-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.6 11.65 1.34.35.21.46.68.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.99-8.15-2.57-11.97-1.4a.94.94 0 0 1-.55-1.8c4.36-1.32 9.78-.68 13.5 1.6.44.27.58.85.31 1.29zm.13-3.4C15.24 8.4 8.82 8.19 5.16 9.3a1.12 1.12 0 1 1-.65-2.15c4.2-1.27 11.28-1.03 15.72 1.6a1.12 1.12 0 0 1-1.11 1.93z" />
    </svg>
  );
}
