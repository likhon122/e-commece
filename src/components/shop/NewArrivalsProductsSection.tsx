"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { IProduct } from "@/types";

type ProductApiResponse = {
  success: boolean;
  data: IProduct[];
};

export default function NewArrivalsProductsSection() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/products?new=true&limit=8", {
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
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#408A71]">
              <Sparkles className="h-4 w-4" />
              Just Dropped
            </span>
            <h2 className="mt-3 text-3xl font-bold text-[#091413] md:text-4xl">
              New Arrivals
            </h2>
            <p className="mt-2 max-w-md text-[#091413]/60">
              Be the first to discover our latest collection of premium fashion pieces
            </p>
          </div>
          <Link
            href="/products?new=true"
            className="group inline-flex items-center gap-2 rounded-full border border-[#285A48] bg-white px-6 py-3 font-semibold text-[#285A48] transition-all hover:bg-[#285A48] hover:text-white"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-gray-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {products.map((product) => (
              <motion.div
                key={product._id}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                }}
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
