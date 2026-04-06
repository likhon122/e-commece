import { PremiumCardGridLoading, PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <PremiumSectionLoading
        title="Restoring your cart"
        subtitle="Syncing selected products, variants, and price totals."
      />
      <PremiumCardGridLoading count={4} className="md:grid-cols-2" />
    </div>
  );
}
