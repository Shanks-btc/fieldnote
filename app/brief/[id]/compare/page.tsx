import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/layout/PageSection";

export const metadata = { title: "Compare — Fieldnote" };

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageSection className="py-16 md:py-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">LLM only vs Qloo-grounded</h1>
        <Button asChild variant="outline">
          <Link href={`/brief/${id}/results`}>Back to results</Link>
        </Button>
      </div>
      <div className="border-y border-border py-16 text-center">
        <p className="font-medium">Nothing to compare yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          This view diffs an LLM-only shortlist against the Qloo-grounded one for the same brief.
        </p>
      </div>
    </PageSection>
  );
}
