import { PremiumFullPageLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container py-8 sm:py-12">
      <PremiumFullPageLoading
        title="Opening the Admin Command Center"
        subtitle="Syncing live metrics, order feeds, and operational controls."
      />
    </div>
  );
}
