"use client";

import Link from "next/link";
import Image from "next/image";
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

  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url;
  const productVideoUrl = product.video?.url;
  const discount = calculateDiscount(product.basePrice, product.salePrice || 0);
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
          body: wasInWishlist ? undefined : JSON.stringify({ productId: product._id }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update wishlist");
      }
    } catch (error) {
      // Roll back optimistic update if server update fails.
      toggleItem(product._id);
      toast.error(error instanceof Error ? error.message : "Failed to update wishlist");
    }
  };

  const isOutOfStock = product.variants.every((v) => v.stock === 0);

  return (
    <div className={cn("group relative", className)}>
      <Link href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary-100">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {productVideoUrl && (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
            {product.isNew && <Badge variant="default">New</Badge>}
            {isOutOfStock && <Badge variant="secondary">Out of Stock</Badge>}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute right-3 top-3 rounded-full bg-white p-2 shadow-md transition-all",
              inWishlist
                ? "text-red-500"
                : "text-secondary-400 hover:text-red-500",
            )}
          >
            <Heart className={cn("h-5 w-5", inWishlist && "fill-red-500")} />
          </button>

          {/* Quick Add Button */}
          {!isOutOfStock && (
            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-medium text-secondary-900 shadow-lg transition-colors hover:bg-primary-600 hover:text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4">
          {/* Category */}
          {typeof product.category === "object" && product.category.name && (
            <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h3 className="mt-1 text-sm font-medium text-secondary-900 line-clamp-2 group-hover:text-primary-600">
            {product.name}
          </h3>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-secondary-700">
                {product.ratings.average.toFixed(1)}
              </span>
              <span className="text-sm text-secondary-500">
                ({product.ratings.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            {product.salePrice ? (
              <>
                <span className="text-lg font-semibold text-primary-600">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm text-secondary-400 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              </>
            ) : (
              <span className="text-lg font-semibold text-secondary-900">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>

          {/* Color Options */}
          {product.variants.length > 1 && (
            <div className="mt-3 flex gap-1">
              {[...new Set(product.variants.map((v) => v.colorCode))]
                .slice(0, 4)
                .map((color) => (
                  <div
                    key={color}
                    className="h-4 w-4 rounded-full border border-secondary-200"
                    style={{ backgroundColor: color }}
                    title={
                      product.variants.find((v) => v.colorCode === color)?.color
                    }
                  />
                ))}
              {[...new Set(product.variants.map((v) => v.colorCode))].length >
                4 && (
                <span className="text-xs text-secondary-500">
                  +
                  {[...new Set(product.variants.map((v) => v.colorCode))]
                    .length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
