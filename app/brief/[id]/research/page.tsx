import { PageSection } from "@/components/layout/PageSection";
import { ResearchView } from "@/components/research/ResearchView";

export const metadata = { title: "Research — Fieldnote" };

export default async function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageSection className="py-16 md:py-24">
      <ResearchView id={id} />
    </PageSection>
  );
}
