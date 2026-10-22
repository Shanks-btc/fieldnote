import { BriefForm } from "@/components/brief/BriefForm";
import { PageSection } from "@/components/layout/PageSection";
import { Eyebrow } from "@/components/shared/TextLink";

export const metadata = { title: "Brief — Fieldnote" };

export default function BriefPage() {
  return (
    <PageSection className="py-16 md:py-24">
      <Eyebrow className="text-[#999]">Creative brief</Eyebrow>
      <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1] tracking-[-0.04em] sm:text-6xl">
        Describe the placement.
      </h1>
      <p className="mb-20 mt-6 max-w-xl leading-relaxed text-[#555]">
        The more specific the scene, the sharper the match. We start you off with a real example you can edit.
      </p>
      <BriefForm />
    </PageSection>
  );
}
