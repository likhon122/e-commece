"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { PremiumCardGridLoading } from "@/components/ui";
import type { IProduct } from "@/types";

type ProductApiResponse = {
  success: boolean;
  data: IProduct[];
};

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/products?featured=true&limit=12", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as ProductApiResponse;
        if (response.ok && payload.success) {
          setProducts(payload.data || []);
        }
      } catch {
        // Best-effort section; keep homepage stable.
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (!loading && !products.length) return null;

  return (
    <section className="px-4 py-10 sm:py-12">
      <div className="container rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-6 backdrop-blur-xl sm:p-8">
        <motion.div
          className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-[#408A71]">
              <Crown className="h-4 w-4" />
              Featured Products
            </span>
            <h3 className="mt-2 text-3xl font-bold text-[#091413] md:text-4xl">Premium Picks</h3>
            <p className="mt-2 text-sm text-[#091413]/65 md:text-base">
              Signature styles selected for quality, versatility, and elevated everyday wear.
            </p>
          </div>
          <Link
            href="/products?featured=true"
            className="group inline-flex items-center gap-2 rounded-full border border-[#7dbca2] bg-white px-5 py-2.5 text-sm font-semibold text-[#285A48] transition-all hover:bg-[#285A48] hover:text-white"
          >
            Browse Featured
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {loading ? (
          <PremiumCardGridLoading count={12} className="sm:grid-cols-3 xl:grid-cols-6" />
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            {products.map((product) => (
              <motion.div
                key={product._id}
                variants={{
                  initial: { opacity: 0, y: 14 },
                  animate: { opacity: 1, y: 0 },
                }}
                className="rounded-2xl border border-[#a5d5c1]/60 bg-white/58 p-2"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
