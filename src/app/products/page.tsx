import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import ProductsCatalogClient from "@/components/shop/ProductsCatalogClient";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse our complete collection of premium fashion clothing and accessories at Mythium.",
};

// Filter options
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const colors = [
  { name: "Black", code: "#000000" },
  { name: "White", code: "#FFFFFF" },
  { name: "Navy", code: "#1e3a5f" },
  { name: "Red", code: "#dc2626" },
  { name: "Green", code: "#16a34a" },
  { name: "Blue", code: "#2563eb" },
];

const sortOptions = [
  { name: "Newest", value: "newest" },
  { name: "Price: Low to High", value: "price_asc" },
  { name: "Price: High to Low", value: "price_desc" },
  { name: "Most Popular", value: "popularity" },
  { name: "Best Rated", value: "rating" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-secondary-100 bg-secondary-50">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-secondary-500 hover:text-primary-600"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-secondary-400" />
            <span className="font-medium text-secondary-900">All Products</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="rounded-xl border border-secondary-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <SlidersHorizontal className="h-5 w-5 text-secondary-500" />
              </div>

              {/* Price Range */}
              <div className="mt-6">
                <h3 className="font-medium text-secondary-900">Price Range</h3>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
                  />
                  <span className="text-secondary-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-6">
                <h3 className="font-medium text-secondary-900">Sizes</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <label
                      key={size}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-secondary-200 text-sm font-medium transition-colors hover:border-primary-500 hover:text-primary-600 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:checked]:text-primary-600"
                    >
                      <input
                        type="checkbox"
                        name="sizes"
                        value={size}
                        className="sr-only"
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mt-6">
                <h3 className="font-medium text-secondary-900">Colors</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <label
                      key={color.name}
                      className="group cursor-pointer"
                      title={color.name}
                    >
                      <input
                        type="checkbox"
                        name="colors"
                        value={color.name}
                        className="sr-only peer"
                      />
                      <div
                        className="h-8 w-8 rounded-full border-2 border-secondary-200 transition-all peer-checked:ring-2 peer-checked:ring-primary-500 peer-checked:ring-offset-2"
                        style={{ backgroundColor: color.code }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button className="mt-6 w-full rounded-lg border border-secondary-200 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50">
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-secondary-600">
                Showing <span className="font-medium">products</span>
              </p>

              <select
                className="rounded-lg border border-secondary-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue={
                  typeof params.sortBy === "string" ? params.sortBy : "newest"
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <ProductsCatalogClient />

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:opacity-50">
                Previous
              </button>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                      page === 1
                        ? "bg-primary-600 text-white"
                        : "text-secondary-700 hover:bg-secondary-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
