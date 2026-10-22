import { PageSection } from "@/components/layout/PageSection";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata = { title: "Results — Fieldnote" };

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageSection className="py-16 md:py-24">
      <ResultsView id={id} />
    </PageSection>
  );
}
