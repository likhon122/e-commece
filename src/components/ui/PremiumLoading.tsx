import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumLoadingProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

function PremiumSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16", className)}>
      <span className="absolute inset-0 rounded-full border-2 border-[#285A48]/20" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#408A71] border-t-[#285A48] [animation-duration:1100ms]" />
      <span className="absolute inset-[9px] rounded-full border border-[#408A71]/35 bg-white/70" />
      <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#285A48]" />
    </div>
  );
}

export function PremiumFullPageLoading({
  title = "Preparing your premium experience",
  subtitle = "Polishing content, syncing data, and rendering your next view.",
  className,
}: PremiumLoadingProps) {
  return (
    <section className={cn("relative isolate overflow-hidden rounded-[2rem] border border-[#ccead9] bg-[radial-gradient(circle_at_top_right,#dcf8e8_0%,transparent_52%),linear-gradient(135deg,#ffffff_0%,#f4fcf7_48%,#eaf8f1_100%)] px-6 py-14 shadow-[0_28px_70px_-50px_rgba(18,64,49,0.6)]", className)}>
      <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-[#408A71]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-[#285A48]/12 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
        <PremiumSpinner />
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#bce7d2] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#285A48]">
          <Sparkles className="h-3.5 w-3.5" />
          Mythium Experience
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0d1f18] sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-[#285A48]/80 sm:text-base">{subtitle}</p>

        <div className="mt-7 w-full space-y-3">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/90">
            <div className="h-full w-2/3 animate-[mythium-progress_1.9s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#285A48] via-[#4d9d80] to-[#7ac7aa]" />
          </div>
          <div className="mx-auto h-2.5 w-4/5 overflow-hidden rounded-full bg-white/80">
            <div className="h-full w-3/5 animate-[mythium-progress_2.3s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#4d9d80] via-[#285A48] to-[#4d9d80]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PremiumSectionLoading({
  title = "Loading content",
  subtitle = "Please hold while we prepare this section.",
  className,
}: PremiumLoadingProps) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl border border-[#d4efe1] bg-[linear-gradient(135deg,#ffffff_0%,#f5fcf8_100%)] p-8 text-center shadow-[0_18px_42px_-34px_rgba(18,64,49,0.62)]", className)}>
      <div className="pointer-events-none absolute -top-14 right-0 h-32 w-32 rounded-full bg-[#408A71]/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/4 h-28 w-28 rounded-full bg-[#285A48]/14 blur-2xl" />

      <div className="relative flex flex-col items-center">
        <PremiumSpinner className="h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold text-[#0d1f18]">{title}</h3>
        <p className="mt-1 text-sm text-[#285A48]/80">{subtitle}</p>
      </div>
    </div>
  );
}

export function PremiumCardGridLoading({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-2xl border border-[#d9efe3] bg-white p-3 shadow-[0_12px_34px_-30px_rgba(17,43,34,0.6)]"
        >
          <div className="premium-shimmer aspect-[3/4] w-full rounded-xl" />
          <div className="mt-4 space-y-2.5">
            <div className="premium-shimmer h-3.5 w-3/4 rounded-md" />
            <div className="premium-shimmer h-3.5 w-1/2 rounded-md" />
            <div className="premium-shimmer h-5 w-1/3 rounded-md" />
          </div>
        </article>
      ))}
    </div>
  );
}