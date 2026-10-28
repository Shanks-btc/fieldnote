import { Check, Circle, Loader2, Minus, X } from "lucide-react";
import type { StepStatus as Status } from "@/lib/agent/types";

export function StepStatusIcon({ status }: { status: Status }) {
  const base = "size-5";
  switch (status) {
    case "running":
      return <Loader2 className={`${base} animate-spin`} aria-label="Running" />;
    case "ok":
      return <Check className={`${base} text-emerald-600`} aria-label="Complete" />;
    case "partial":
    case "empty":
      return <Minus className={`${base} text-amber-600`} aria-label={status === "empty" ? "No results" : "Partial"} />;
    case "skipped":
      return <Minus className={`${base} text-muted-foreground/60`} aria-label="Skipped" />;
    case "error":
      return <X className={`${base} text-destructive`} aria-label="Failed" />;
    default:
      return <Circle className={`${base} text-muted-foreground/50`} aria-label="Pending" />;
  }
}
