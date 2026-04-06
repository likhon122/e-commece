import Link from "next/link";
import { ArrowRight, PackageCheck, Ruler, ShieldCheck, Sparkles } from "lucide-react";

const resources = [
  {
    title: "Size & Fit Assistant",
    description:
      "Find ideal silhouettes, fit confidence, and practical sizing tips before checkout.",
    href: "/search?search=size",
    icon: Ruler,
  },
  {
    title: "Fabric & Care Resource",
    description:
      "Understand material behavior and care methods to keep pieces premium for longer.",
    href: "/search?search=fabric",
    icon: Sparkles,
  },
  {
    title: "Delivery & Return Guide",
    description:
      "Track delivery expectations, support coverage, and hassle-free post-purchase flow.",
    href: "/account/orders",
    icon: PackageCheck,
  },
  {
    title: "Secure Payment Support",
    description:
      "Get quick clarity on payment options, confirmation stages, and transaction safety.",
    href: "/checkout",
    icon: ShieldCheck,
  },
];

export default function StyleResourcesSection() {
  return (
    <section className="px-4 py-10 sm:py-12">
      <div className="container rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#408A71]">Shopping Resources</p>
          <h3 className="mt-3 text-3xl font-bold text-[#091413] md:text-4xl">Your Premium Style Toolkit</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#091413]/65 md:text-base">
            Helpful resources designed to make every purchase smarter, faster, and more confident.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className="group rounded-2xl border border-[#a5d5c1]/60 bg-white/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#75b597]/75"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#9fd0bb]/70 bg-white text-[#285A48] shadow-md transition-transform group-hover:scale-110">
                <resource.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#091413]">{resource.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#091413]/65">{resource.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#285A48]">
                Explore Resource
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
