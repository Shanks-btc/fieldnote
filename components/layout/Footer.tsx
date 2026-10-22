import Link from "next/link";
import { FieldnoteMark } from "./FieldnoteMark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works", external: false },
      { label: "Try the demo", href: "/brief", external: false },
    ],
  },
  {
    title: "Technology",
    links: [
      { label: "Qloo", href: "https://qloo.com", external: true },
      { label: "Qloo API docs", href: "https://docs.qloo.com", external: true },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/shanks-btc/fieldnote", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-black px-5 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-[280px]">
            <div className="flex items-center gap-2">
              <FieldnoteMark size={18} className="text-white" />
              <span className="text-[16px] font-medium tracking-[-0.02em]">fieldnote</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/50">
              Music sync placement intelligence. Find the artist your audience already loves.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-10">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[10px] uppercase tracking-[0.06em] text-white/30">{col.title}</p>
                <div className="flex flex-col md:gap-2">
                  {col.links.map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-block py-3 text-[13px] text-white/60 transition-colors hover:text-white md:py-1"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-[12px] text-white/30">Built on Qloo&apos;s taste graph. Taste data by Qloo.</p>
          <p className="text-[12px] text-white/30">© 2026 Fieldnote</p>
        </div>
      </div>
    </footer>
  );
}
