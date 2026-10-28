import { cn } from "@/lib/utils";

/** Monospace inline value for endpoints, IDs and scores. */
export function MonoValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <code className={cn("font-mono text-[0.8125rem] tabular-nums", className)}>{children}</code>;
}
