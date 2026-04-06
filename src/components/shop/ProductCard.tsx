"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { IProduct } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/store";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: IProduct;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url;
  const productVideoUrl = product.video?.url;
  const discount = calculateDiscount(product.basePrice, product.salePrice || 0);
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      toast.error("Please login to add items to cart");
      const callbackUrl = encodeURIComponent(pathname || "/products");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    // Add first available variant
    const availableVariant = product.variants.find((v) => v.stock > 0);
    if (availableVariant) {
      addItem(product, availableVariant, 1);
      openCart();
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasInWishlist = inWishlist;
    toggleItem(product._id);

    if (status !== "authenticated") {
      return;
    }

    try {
      const response = await fetch(
        wasInWishlist
          ? `/api/wishlist?productId=${encodeURIComponent(product._id)}`
          : "/api/wishlist",
        {
          method: wasInWishlist ? "DELETE" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: wasInWishlist
            ? undefined
            : JSON.stringify({ productId: product._id }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update wishlist");
      }
    } catch (error) {
      // Roll back optimistic update if server update fails.
      toggleItem(product._id);
      toast.error(
        error instanceof Error ? error.message : "Failed to update wishlist",
      );
    }
  };

  const isOutOfStock = product.variants.every((v) => v.stock === 0);
  const colorSwatches = Array.from(
    new Set(product.variants.map((variant) => variant.colorCode).filter(Boolean)),
  );

  return (
    <div className={cn("group relative h-full", className)}>
      <Link href={`/products/${product.slug}`}>
        <article className="relative h-full overflow-hidden rounded-[1.45rem] border border-[#B0E4CC]/55 bg-[linear-gradient(165deg,#ffffff_0%,#fafffc_48%,#f4fbf8_100%)] p-3 shadow-[0_14px_34px_-28px_rgba(24,50,39,0.6)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#75b597]/75 hover:shadow-[0_26px_44px_-24px_rgba(24,50,39,0.58)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#B0E4CC]/35 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[#B0E4CC]/40 bg-secondary-100">
            {primaryImage ? (
              <>
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {productVideoUrl && (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  >
                    <source src={productVideoUrl} />
                  </video>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-secondary-400">
                <ShoppingBag className="h-12 w-12" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#091413]/35 via-transparent to-transparent" />
            <div className="pointer-events-none absolute -inset-x-1/2 top-0 h-full w-1/2 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-[260%] group-hover:opacity-100" />

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
              {product.isNew && <Badge variant="default">New</Badge>}
              {isOutOfStock && <Badge variant="secondary">Out of Stock</Badge>}
            </div>

            <button
              onClick={handleToggleWishlist}
              className={cn(
                "absolute right-3 top-3 rounded-full border border-[#B0E4CC]/40 bg-white/95 p-2 text-[#285A48] shadow-md backdrop-blur transition-all hover:scale-105",
                inWishlist ? "text-red-500 border-red-200/80" : "hover:text-red-500",
              )}
            >
              <Heart className={cn("h-5 w-5", inWishlist && "fill-red-500")} />
            </button>

            {!isOutOfStock ? (
              <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#A7D8C4]/70 bg-white/95 py-2.5 text-sm font-semibold text-[#285A48] shadow-lg transition-all hover:bg-[#285A48] hover:text-white"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3.5 space-y-2.5">
            {typeof product.category === "object" && product.category.name ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#285A48]/70">
                {product.category.name}
              </p>
            ) : null}

            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#091413] transition-colors group-hover:text-[#285A48]">
              {product.name}
            </h3>

            {product.ratings.count > 0 ? (
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-[#091413]/80">
                  {product.ratings.average.toFixed(1)}
                </span>
                <span className="text-[#091413]/50">({product.ratings.count})</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {product.salePrice ? (
                <>
                  <span className="text-lg font-bold text-[#285A48]">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-sm text-secondary-400 line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-[#091413]">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>

            {product.variants.length > 1 ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  {colorSwatches.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="h-4 w-4 rounded-full border border-[#B0E4CC]/80"
                      style={{ backgroundColor: color }}
                      title={
                        product.variants.find((variant) => variant.colorCode === color)
                          ?.color
                      }
                    />
                  ))}
                  {colorSwatches.length > 4 ? (
                    <span className="text-xs font-medium text-[#091413]/55">
                      +{colorSwatches.length - 4}
                    </span>
                  ) : null}
                </div>

                <span className="rounded-full bg-[#B0E4CC]/22 px-2 py-0.5 text-[11px] font-medium text-[#285A48]">
                  {isOutOfStock ? "Sold Out" : "In Stock"}
                </span>
              </div>
            ) : null}
          </div>
        </article>
      </Link>
    </div>
  );
}
