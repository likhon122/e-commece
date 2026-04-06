import { PremiumFullPageLoading } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container py-10 sm:py-14">
      <div className="min-h-[60vh]">
        <PremiumFullPageLoading
          title="Setting up your Mythium experience"
          subtitle="Rendering layouts, preparing data, and delivering a polished view."
          className="h-full"
        />
      </div>
    </div>
  );
}
