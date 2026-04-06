import { PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container py-8">
      <PremiumSectionLoading
        title="Preparing secure checkout"
        subtitle="Verifying cart totals, delivery details, and payment channels."
        className="min-h-[50vh] flex items-center justify-center"
      />
    </div>
  );
}
