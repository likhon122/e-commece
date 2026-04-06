import { PremiumSectionLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container py-8">
      <PremiumSectionLoading
        title="Loading your account workspace"
        subtitle="Syncing profile, orders, and personalized account tools."
        className="min-h-[55vh] flex items-center justify-center"
      />
    </div>
  );
}
