import { cn } from "@/lib/utils";

/** One container width (1100px) for every page, so content always lines up with the logo. */
export function PageSection({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-6 md:py-[120px]", className)}>
      {children}
    </section>
  );
}
