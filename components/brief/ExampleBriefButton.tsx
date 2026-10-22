"use client";

export function ExampleBriefButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-my-3 py-3 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Reset to example
    </button>
  );
}
