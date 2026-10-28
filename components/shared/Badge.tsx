import { cn } from "@/lib/utils";

type Tone = "neutral" | "outline" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  outline: "border border-border text-muted-foreground",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-800",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
