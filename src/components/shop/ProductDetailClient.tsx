"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Badge, Button, PremiumSectionLoading } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";

type ProductDetailResponse = {
  success: boolean;
  data: {
    product: IProduct;
  };
};

type MediaItem = { type: "image" | "video"; url: string; alt: string };

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/products/${slug}`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as ProductDetailResponse;

        if (!response.ok || !payload.success) {
          throw new Error("Failed to load product");
        }

        setProduct(payload.data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!product) return [];
    const items: MediaItem[] = [];
    if (product.video?.url) {
      items.push({ type: "video", url: product.video.url, alt: product.video.alt });
    }
    for (const image of product.images || []) {
      items.push({ type: "image", url: image.url, alt: image.alt });
    }
    return items;
  }, [product]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-8">
        <PremiumSectionLoading
          title="Loading product details"
          subtitle="Rendering media gallery, price intelligence, and variant data."
          className="min-h-[58vh] flex items-center justify-center"
        />
      </div>
    );
  }

  if (error || !product) {
    return <div className="container py-14 text-sm text-red-600">{error || "Product not found"}</div>;
  }

  const selected = mediaItems[selectedIndex];

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary-100">
            {selected?.type === "video" ? (
              <video controls autoPlay muted loop playsInline className="h-full w-full object-cover">
                <source src={selected.url} />
              </video>
            ) : selected?.url ? (
              <Image src={selected.url} alt={selected.alt} fill className="object-cover" />
            ) : null}
            {product.video?.url && (
              <Badge className="absolute left-4 top-4" variant="default">Video</Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {mediaItems.map((item, index) => (
              <button
                key={`${item.type}-${item.url}`}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                  selectedIndex === index ? "border-primary-600" : "border-transparent"
                }`}
              >
                {item.type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-black text-xs text-white">Video</div>
                ) : (
                  <Image src={item.url} alt={item.alt} fill className="object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-secondary-900">{product.name}</h1>
          <p className="mt-3 text-secondary-600">{product.shortDescription}</p>
          <div className="mt-6 flex items-center gap-2">
            {product.salePrice ? (
              <>
                <span className="text-3xl font-bold text-primary-600">{formatPrice(product.salePrice)}</span>
                <span className="text-lg text-secondary-400 line-through">{formatPrice(product.basePrice)}</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-secondary-900">{formatPrice(product.basePrice)}</span>
            )}
          </div>
          <p className="mt-6 whitespace-pre-line text-secondary-700">{product.description}</p>
          <div className="mt-8">
            <Button size="lg">Add to Cart</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
