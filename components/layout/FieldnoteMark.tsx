/** Fieldnote logo mark: a geometric quarter note. Uses currentColor, so it is black in the nav and white in the footer. */
export function FieldnoteMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="9" cy="17" rx="5" ry="3.5" transform="rotate(-15 9 17)" fill="currentColor" />
      <line x1="13.5" y1="4" x2="13.5" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 4 C 16 4, 19 6, 19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
