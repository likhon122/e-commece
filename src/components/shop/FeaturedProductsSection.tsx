"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { IProduct } from "@/types";

type ProductApiResponse = {
  success: boolean;
  data: IProduct[];
};

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/products?featured=true&limit=8", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as ProductApiResponse;
        if (response.ok && payload.success) {
          setProducts(payload.data || []);
        }
      } catch {
        // Best-effort section; keep homepage stable.
      }
    };

    run();
  }, []);

  if (!products.length) return null;

  return (
    <section className="container py-16 sm:py-20">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#285A48]">Featured Products</p>
          <h3 className="mt-2 font-display text-3xl text-[#0f1e1b]">Premium Picks</h3>
        </div>
        <Link href="/products" className="text-sm font-semibold text-[#285A48] hover:underline">
          Browse all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
