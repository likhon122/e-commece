import { PremiumCardGridLoading, PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container space-y-6 py-8">
      <PremiumSectionLoading
        title="Curating the product catalog"
        subtitle="Building filters, sorting options, and premium product cards."
      />
      <PremiumCardGridLoading count={12} />
    </div>
  );
}
