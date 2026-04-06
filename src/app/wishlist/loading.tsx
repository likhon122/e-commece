import { PremiumCardGridLoading, PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <PremiumSectionLoading
        title="Loading your wishlist"
        subtitle="Fetching saved favorites and preparing instant cart actions."
      />
      <PremiumCardGridLoading count={8} />
    </div>
  );
}
