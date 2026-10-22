import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls are bottom-border only: a 1px hairline that darkens on focus.
 * No outline box, no rounding. The focus state uses a 1px inset shadow rather than a thicker
 * border so the layout doesn't shift.
 */
const field =
  "w-full rounded-none border-0 border-b border-input bg-transparent px-0 text-base text-foreground placeholder:text-muted-foreground transition-shadow focus-visible:outline-none focus-visible:shadow-[0_1px_0_0_var(--foreground)] focus-visible:border-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:shadow-[0_1px_0_0_var(--destructive)]";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "flex h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "block min-h-11 resize-none py-2.5 leading-relaxed [field-sizing:content]", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "flex h-11 cursor-pointer", className)} {...props} />;
}
