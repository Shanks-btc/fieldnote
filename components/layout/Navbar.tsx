"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { FieldnoteMark } from "./FieldnoteMark";

const LINKS = [
  { href: "/product", label: "Product", external: false },
  { href: "/#how-it-works", label: "How it works", external: false },
  { href: "https://github.com/shanks-btc/fieldnote", label: "GitHub", external: true },
];

/**
 * Floating, blurred pill that hovers over the page. Fixed, so `main` reserves the top space.
 * From `sm` up the links sit inside the pill; below that they live in a menu opened by the button,
 * so every link stays reachable on a phone.
 */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  // Close on navigation, Escape, a tap outside the nav, or growing past the mobile breakpoint.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 640px)");
    const onResize = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-3">
      <div ref={root} className="pointer-events-auto relative w-full max-w-[420px] sm:w-auto sm:max-w-full">
        <nav
          aria-label="Primary"
          className="flex w-full items-center gap-1 rounded-[26px] bg-[rgba(225,225,225,0.6)] py-0.5 pl-5 pr-0.5 text-sm backdrop-blur-[20px] sm:w-auto"
        >
          <Link href="/" className="-my-3 mr-auto flex items-center gap-2 py-3 sm:mr-2">
            <FieldnoteMark size={18} />
            <span className="text-[15px] font-medium tracking-[-0.02em]">fieldnote</span>
          </Link>

          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="hidden px-3 py-3 text-[13px] text-black/60 transition-colors hover:text-black sm:block"
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="/brief"
            className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 sm:ml-2"
          >
            Open app
          </Link>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-black/70 transition-colors hover:text-black sm:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </nav>

        {open && (
          <ul
            id="mobile-menu"
            className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-[24px] bg-[rgba(245,245,245,0.95)] p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] backdrop-blur-[20px] sm:hidden"
          >
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="flex min-h-12 items-center justify-between rounded-[16px] px-4 text-[15px] font-medium text-black/80 transition-colors hover:bg-black/[0.05]"
                >
                  {l.label}
                  {l.external && <ArrowUpRight className="size-4 text-black/40" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
