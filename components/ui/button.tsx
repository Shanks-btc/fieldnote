import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * `solid` (black pill) is reserved for the one primary action: the brief form submit.
 * Everything else is `default`/`outline` hairline pills, or a TextLink in running copy.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
        solid: "bg-foreground text-background hover:bg-foreground/85",
        outline: "border border-border bg-background text-foreground hover:border-foreground",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
