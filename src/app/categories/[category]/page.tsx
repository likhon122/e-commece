import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryBySlug } from "@/lib/api/categories";
import { getProducts, getProductFacets } from "@/lib/api/products";
import CategoryProductsClient from "./CategoryProductsClient";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const { data: categoryData } = await getCategoryBySlug(category);

  if (!categoryData) {
    return { title: "Category Not Found" };
  }

  return {
    title: categoryData.seoTitle || categoryData.name,
    description:
      categoryData.seoDescription ||
      categoryData.description ||
      `Shop ${categoryData.name} at Mythium. Discover premium quality products.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const resolvedSearchParams = await searchParams;

  // Fetch category data
  const { data: categoryData, success } = await getCategoryBySlug(categorySlug);

  if (!success || !categoryData) {
    notFound();
  }

  // Parse search params for filters
  const page = parseInt((resolvedSearchParams.page as string) || "1");
  const sortBy = (resolvedSearchParams.sortBy as string) || "newest";
  const minPrice = resolvedSearchParams.minPrice
    ? parseInt(resolvedSearchParams.minPrice as string)
    : undefined;
  const maxPrice = resolvedSearchParams.maxPrice
    ? parseInt(resolvedSearchParams.maxPrice as string)
    : undefined;
  const sizes = resolvedSearchParams.sizes
    ? Array.isArray(resolvedSearchParams.sizes)
      ? resolvedSearchParams.sizes
      : [resolvedSearchParams.sizes]
    : [];
  const colors = resolvedSearchParams.colors
    ? Array.isArray(resolvedSearchParams.colors)
      ? resolvedSearchParams.colors
      : [resolvedSearchParams.colors]
    : [];
  const search = resolvedSearchParams.search as string | undefined;

  // Fetch products with filters
  const { data: products, pagination } = await getProducts({
    category: categorySlug,
    page,
    limit: 24,
    sortBy,
    minPrice,
    maxPrice,
    sizes,
    colors,
    search,
  });

  // Fetch facets for filters
  const facets = await getProductFacets(categorySlug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#285A48]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link href="/categories" className="text-gray-500 hover:text-[#285A48]">
              Categories
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{categoryData.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-[#285A48] to-[#408A71] py-12">
        <div className="container">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {categoryData.name}
          </h1>
          {categoryData.description && (
            <p className="mt-3 max-w-2xl text-lg text-white/80">
              {categoryData.description}
            </p>
          )}
          <p className="mt-4 text-sm text-white/60">
            {pagination.total} {pagination.total === 1 ? "product" : "products"} found
          </p>
        </div>
      </div>

      {/* Subcategories */}
      {categoryData.children && categoryData.children.length > 0 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Shop by Subcategory
            </h2>
            <div className="flex flex-wrap gap-3">
              {categoryData.children.map((sub) => (
                <Link
                  key={sub._id}
                  href={`/categories/${categorySlug}/${sub.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-[#285A48] hover:bg-[#285A48] hover:text-white"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Section - Client Component for filters */}
      <CategoryProductsClient
        categorySlug={categorySlug}
        categoryName={categoryData.name}
        initialProducts={products}
        initialPagination={pagination}
        facets={facets}
        initialFilters={{
          search: search || "",
          minPrice: minPrice?.toString() || "",
          maxPrice: maxPrice?.toString() || "",
          sizes,
          colors,
          sortBy,
        }}
      />
    </div>
  );
}
