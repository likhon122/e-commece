import { PremiumCardGridLoading, PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <PremiumSectionLoading
        title="Scanning premium results"
        subtitle="Matching products, ratings, and filters to your search intent."
      />
      <PremiumCardGridLoading count={8} />
    </div>
  );
}
