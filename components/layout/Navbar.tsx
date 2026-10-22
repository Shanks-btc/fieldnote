import Link from "next/link";
import { FieldnoteMark } from "./FieldnoteMark";

const LINKS = [
  { href: "/#how-it-works", label: "How it works", external: false },
  { href: "https://github.com/shanks-btc/fieldnote", label: "GitHub", external: true },
];

/** Floating, blurred pill that hovers over the page. Fixed, so `main` reserves the top space. */
export function Navbar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-3">
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex max-w-full items-center gap-1 rounded-[26px] bg-[rgba(225,225,225,0.6)] py-1.5 pl-5 pr-1.5 text-sm backdrop-blur-[20px]"
      >
        <Link href="/" className="mr-2 flex items-center gap-2">
          <FieldnoteMark size={18} />
          <span className="text-[15px] font-medium tracking-[-0.02em]">fieldnote</span>
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="hidden px-3 py-2 text-[13px] text-black/60 transition-colors hover:text-black sm:block"
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/brief"
          className="ml-2 inline-flex h-9 items-center justify-center rounded-full bg-black px-5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Open app
        </Link>
      </nav>
    </div>
  );
}
