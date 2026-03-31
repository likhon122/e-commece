import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductsCatalogClient from "@/components/shop/ProductsCatalogClient";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse our complete collection of premium fashion clothing and accessories at Mythium.",
};

export default async function ProductsPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-secondary-100 bg-secondary-50">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-secondary-500 hover:text-primary-600">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-secondary-400" />
            <span className="font-medium text-secondary-900">All Products</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <ProductsCatalogClient />
      </div>
    </div>
  );
}
