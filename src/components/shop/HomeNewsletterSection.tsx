"use client";

import { useState } from "react";
import { Crown, Mail } from "lucide-react";
import { Button } from "@/components/ui";

export default function HomeNewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="px-4 -mt-16">
      <div className="container relative">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-8 text-center sm:p-10 md:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#9fd0bb]/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#285A48]">
            <Crown className="h-4 w-4" />
            Member Exclusive
          </span>

          <h3 className="mt-5 text-3xl font-bold text-[#091413] sm:text-4xl">
            Unlock Premium Updates
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-[#091413]/65">
            Get first access to new drops, curated style insights, and
            high-value offers.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-7 flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#285A48]/70" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-[#9fd0bb]/70 bg-white py-4 pl-11 pr-4 text-base text-[#091413] placeholder:text-[#091413]/45 outline-none transition-colors focus:border-[#408A71]"
              />
            </div>
            <Button
              type="submit"
              className="rounded-2xl border border-[#7dbca2] bg-white px-8 py-4 font-semibold text-[#285A48] hover:bg-[#285A48] hover:text-white"
            >
              Join Now
            </Button>
          </form>

          <p className="mt-3 text-xs text-[#091413]/55">
            {submitted
              ? "Thanks for joining. Premium updates will be shared with you soon."
              : "No spam. Only useful updates, launch alerts, and product highlights."}
          </p>
        </div>
      </div>
    </section>
  );
}
