import { BriefWorkspace } from "@/components/brief/BriefWorkspace";
import { PageSection } from "@/components/layout/PageSection";
import { Eyebrow } from "@/components/shared/TextLink";

export const metadata = { title: "Brief, Fieldnote" };

export default function BriefPage() {
  return (
    <PageSection className="px-4 pb-6 pt-3 sm:px-6 sm:pb-8 md:pb-8 md:pt-3">
      {/* One centered column shared by the heading, the tabs and the form card (or the history list). */}
      <div className="mx-auto w-full max-w-[720px]">
        <header className="text-center">
          {/* Decorative equalizer bars: "this is an audio tool" at a glance. */}
          <div className="fn-eq mb-2 flex h-5 items-end justify-center gap-[3px]" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <Eyebrow className="text-[#999]">Creative brief</Eyebrow>
          <h1 className="mt-2 text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
            Describe the placement.
          </h1>
          <p className="mx-auto mb-4 mt-2.5 max-w-[480px] text-balance leading-relaxed text-[#555]">
            The more specific the scene, the sharper the match. We start you off with a real example you can edit.
          </p>
        </header>
        <BriefWorkspace />
        <p className="mt-6 text-center text-[13px] text-black/40">
          Powered by Qloo taste intelligence
          <span aria-hidden className="mx-2 text-black/25">·</span>
          8 cultural domains
          <span aria-hidden className="mx-2 text-black/25">·</span>
          Spotify previews
        </p>
      </div>
    </PageSection>
  );
}
