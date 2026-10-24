import { BriefWorkspace } from "@/components/brief/BriefWorkspace";
import { PageSection } from "@/components/layout/PageSection";
import { Eyebrow } from "@/components/shared/TextLink";

export const metadata = { title: "Brief, Fieldnote" };

export default function BriefPage() {
  return (
    <PageSection className="py-10 sm:py-16 md:py-24">
      <Eyebrow className="text-[#999]">Creative brief</Eyebrow>
      <h1 className="mt-6 max-w-3xl text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[44px] md:text-[56px]">
        Describe the placement.
      </h1>
      <p className="mb-20 mt-6 max-w-xl leading-relaxed text-[#555]">
        The more specific the scene, the sharper the match. We start you off with a real example you can edit.
      </p>
      <BriefWorkspace />
    </PageSection>
  );
}
