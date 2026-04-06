import { PremiumCardGridLoading, PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <PremiumSectionLoading
        title="Loading curated categories"
        subtitle="Preparing category insights and featured picks for you."
      />
      <PremiumCardGridLoading count={8} />
    </div>
  );
}
