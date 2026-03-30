import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/api/categories";
import { NotFoundMessage } from "@/components/ui";

export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all product categories at Mythium. Shop men's, women's fashion, accessories, and footwear.",
};

export default async function CategoriesPage() {
  const { data: categories, success, error } = await getCategories();

  if (!success || categories.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-[#285A48]">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">Categories</span>
            </nav>
          </div>
        </div>
        <div className="container py-16">
          <NotFoundMessage
            type="category"
            query={error || "No categories found. Please check back later."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#285A48]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">Categories</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">All Categories</h1>
          <p className="mt-2 text-gray-600">
            Explore our curated collections and find your perfect style
          </p>
        </div>

        <div className="grid gap-8">
          {categories.map((category) => (
            <section
              key={category._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-1 text-gray-600">{category.description}</p>
                  )}
                </div>
                <Link
                  href={`/categories/${category.slug}`}
                  className="hidden items-center gap-2 rounded-lg bg-[#285A48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#408A71] sm:flex"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                  {category.children.map((sub) => (
                    <Link
                      key={sub._id}
                      href={`/categories/${category.slug}/${sub.slug}`}
                      className="group rounded-xl border border-gray-200 p-4 transition-all hover:border-[#285A48]/30 hover:shadow-md"
                    >
                      {sub.image ? (
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={sub.image}
                            alt={sub.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-[#B0E4CC]/30 to-[#285A48]/20" />
                      )}
                      <h3 className="mt-3 text-sm font-medium text-gray-900 group-hover:text-[#285A48]">
                        {sub.name}
                      </h3>
                      {sub.productCount !== undefined && sub.productCount > 0 && (
                        <p className="text-xs text-gray-500">
                          {sub.productCount} products
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href={`/categories/${category.slug}`}
                className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-[#285A48] hover:underline sm:hidden"
              >
                View All {category.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
