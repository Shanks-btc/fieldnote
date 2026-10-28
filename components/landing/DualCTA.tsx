"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";

/** Two solid white cards side by side: try the demo, read the code. Used on the landing page and the product page. */
export function DualCTA() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-5 py-12 sm:px-6 sm:py-16 md:py-20">
      <FadeIn>
        <p className="mb-3 text-[10px] uppercase tracking-[0.06em] text-black/40">Start using Fieldnote</p>
        <h2 className="mb-10 text-[28px] sm:text-[32px] md:text-[36px] font-medium leading-[1.1] tracking-[-0.02em]">See it in action.</h2>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <FadeIn delay={0.1} className="h-full">
          <div className="flex h-full min-h-[240px] flex-col justify-between rounded-[28px] bg-white p-7 sm:min-h-[280px] sm:p-8 md:p-10">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.06em] text-black/30">Demo</p>
              <h3 className="mb-3 text-[24px] font-medium leading-[1.15] tracking-[-0.01em] text-black/85">Try a real brief</h3>
              <p className="max-w-[380px] text-[15px] leading-relaxed text-black/50">
                Start from a pre-filled Stranger Things scene, change anything, and see scored artist matches in about twenty
                seconds.
              </p>
            </div>
            <Link
              href="/brief"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-full bg-black px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-black/90"
            >
              Start a Brief →
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="h-full">
          <div className="flex h-full min-h-[240px] flex-col justify-between rounded-[28px] bg-white p-7 sm:min-h-[280px] sm:p-8 md:p-10">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.06em] text-black/30">Code</p>
              <h3 className="mb-3 text-[24px] font-medium leading-[1.15] tracking-[-0.01em] text-black/85">Read how it&apos;s built</h3>
              <p className="max-w-[380px] text-[15px] leading-relaxed text-black/50">
                The architecture, the Qloo API integration, the scoring engine, and the decisions we made along the way.
              </p>
            </div>
            <a
              href="https://github.com/shanks-btc/fieldnote"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-full border border-black/15 bg-transparent px-6 py-3 text-[14px] font-medium text-black transition-colors hover:bg-black/[0.03]"
            >
              View on GitHub
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
