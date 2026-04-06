"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button, PremiumSectionLoading } from "@/components/ui";
import { useCartStore, useWishlistStore } from "@/store";
import { formatPrice } from "@/lib/utils";
import type { IProduct } from "@/types";

type WishlistProductsResponse = {
  success: boolean;
  data: IProduct[];
  error?: string;
};

interface WishlistPageClientProps {
  compactHeader?: boolean;
}

export default function WishlistPageClient({ compactHeader = false }: WishlistPageClientProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  const pathname = usePathname();

  const { items, setItems, removeItem } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const syncedLocalRef = useRef(false);

  const headerTitle = compactHeader ? "Wishlist" : "My Wishlist";
  const headerSubtitle = compactHeader
    ? "Items you saved for later"
    : "Items you've saved for later";

  const itemsKey = useMemo(() => items.join("|"), [items]);

  const areSameIds = (left: string[], right: string[]) => {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  };

  const fetchWishlistProducts = useCallback(async (sourceIds: string[]) => {
    setLoading(true);
    try {
      const endpoint = isAuthenticated
        ? "/api/wishlist"
        : `/api/wishlist?ids=${encodeURIComponent(sourceIds.join(","))}`;

      const response = await fetch(endpoint, {
        credentials: "include",
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") || "";
      const payload: WishlistProductsResponse | null = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to load wishlist");
      }

      const nextProducts = payload.data || [];
      const nextIds = nextProducts.map((item) => item._id);
      setProducts(nextProducts);

      const currentIds = useWishlistStore.getState().items;
      if (!areSameIds(currentIds, nextIds)) {
        setItems(nextIds);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load wishlist");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setItems]);

  useEffect(() => {
    const run = async () => {
      if (status === "loading") return;

      const localIds = useWishlistStore.getState().items;

      if (isAuthenticated && !syncedLocalRef.current && localIds.length > 0) {
        try {
          await fetch("/api/wishlist", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: localIds }),
          });
        } catch {
          // Intentionally ignore sync failure and continue.
        } finally {
          syncedLocalRef.current = true;
        }
      }

      await fetchWishlistProducts(localIds);
    };

    run();
  }, [fetchWishlistProducts, isAuthenticated, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isAuthenticated) {
      fetchWishlistProducts(items);
    }
  }, [fetchWishlistProducts, isAuthenticated, items, itemsKey, status]);

  const isEmpty = useMemo(() => !loading && products.length === 0, [loading, products.length]);

  const handleRemove = async (productId: string) => {
    setProcessingId(productId);
    removeItem(productId);
    setProducts((prev) => prev.filter((item) => item._id !== productId));

    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to remove wishlist item");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove item");
      }
    }

    setProcessingId(null);
  };

  const handleAddToCart = (product: IProduct) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      const callbackUrl = encodeURIComponent(pathname || "/wishlist");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    const availableVariant = product.variants.find((variant) => variant.stock > 0);
    if (!availableVariant) {
      toast.error("This product is out of stock");
      return;
    }

    addItem(product, availableVariant, 1);
    openCart();
    toast.success("Added to cart");
  };

  const handleMoveAllToCart = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      const callbackUrl = encodeURIComponent(pathname || "/wishlist");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    let addedCount = 0;

    for (const product of products) {
      const availableVariant = product.variants.find((variant) => variant.stock > 0);
      if (!availableVariant) continue;
      addItem(product, availableVariant, 1);
      addedCount += 1;
    }

    if (!addedCount) {
      toast.error("No in-stock products available to add");
      return;
    }

    openCart();
    toast.success(`${addedCount} item${addedCount > 1 ? "s" : ""} added to cart`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{headerTitle}</h1>
          <p className="text-secondary-600">{headerSubtitle}</p>
        </div>
        {!isEmpty && !loading && (
          <Button onClick={handleMoveAllToCart} variant="outline" className="gap-2">
            <ShoppingBag className="h-4 w-4" /> Move All To Cart
          </Button>
        )}
      </div>

      {loading && (
        <PremiumSectionLoading
          title="Loading wishlist"
          subtitle="Fetching your saved favorites and stock-aware cart actions."
          className="min-h-[280px] flex items-center justify-center"
        />
      )}

      {isEmpty && (
        <div className="rounded-xl border border-secondary-200 bg-white p-12 text-center">
          <Heart className="mx-auto h-16 w-16 text-secondary-300" />
          <h2 className="mt-4 text-lg font-semibold text-secondary-900">Your wishlist is empty</h2>
          <p className="mt-2 text-secondary-600">Save products by tapping the heart icon.</p>
          <Link href="/products">
            <Button className="mt-6">Browse Products</Button>
          </Link>
        </div>
      )}

      {!loading && !isEmpty && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const imageUrl = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url;
            const outOfStock = product.variants.every((variant) => variant.stock <= 0);

            return (
              <div
                key={product._id}
                className="group mx-auto w-full max-w-[290px] overflow-hidden rounded-[1.45rem] border border-[#B0E4CC]/55 bg-[linear-gradient(165deg,#ffffff_0%,#fafffc_48%,#f4fbf8_100%)] p-3 shadow-[0_14px_34px_-28px_rgba(24,50,39,0.6)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#75b597]/75 hover:shadow-[0_26px_44px_-24px_rgba(24,50,39,0.58)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[#B0E4CC]/40 bg-secondary-100">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 38vw, (max-width: 1280px) 28vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#091413]/35 via-black/5 to-transparent" />
                  <div className="pointer-events-none absolute -inset-x-1/2 top-0 h-full w-1/2 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-[260%] group-hover:opacity-100" />
                  <button
                    onClick={() => handleRemove(product._id)}
                    disabled={processingId === product._id}
                    className="absolute right-2 top-2 rounded-full border border-[#B0E4CC]/45 bg-white/95 p-2 text-red-500 shadow-md backdrop-blur transition-colors hover:bg-red-50"
                  >
                    {processingId === product._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-3.5">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#285A48]/65">
                    Wishlist Pick
                  </p>
                  <Link href={`/products/${product.slug}`} className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#091413] hover:text-[#285A48]">
                    {product.name}
                  </Link>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(product.salePrice || product.basePrice)}
                    </span>
                    {product.salePrice && (
                      <span className="text-xs text-secondary-400 line-through">
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={outOfStock}
                    className="mt-3.5 w-full gap-2 border border-[#A7D8C4]/70 bg-white/95 text-[#285A48] hover:bg-[#285A48] hover:text-white"
                    size="sm"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
