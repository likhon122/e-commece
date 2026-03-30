import type { Metadata } from "next";
import WishlistPageClient from "@/components/shop/WishlistPageClient";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Saved products you love",
};

export default function WishlistPage() {
  return (
    <div className="container py-8">
      <WishlistPageClient />
    </div>
  );
}
