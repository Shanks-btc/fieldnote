import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Understated call to action: text with an arrow, no box.
 * `primary` carries a dark underline rule; `secondary` is plain gray text.
 */
export function TextLink({
  href,
  variant = "primary",
  arrow = variant === "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-base transition-colors",
        variant === "primary"
          ? "border-b border-foreground pb-1 font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />}
    </Link>
  );
}

/** Small uppercase monospace label used above headings. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground", className)}>{children}</p>
  );
}
