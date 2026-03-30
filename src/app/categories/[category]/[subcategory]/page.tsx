import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryBySlug, getCategoryBreadcrumb } from "@/lib/api/categories";
import { getProducts, getProductFacets } from "@/lib/api/products";
import CategoryProductsClient from "../CategoryProductsClient";

interface SubcategoryPageProps {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: SubcategoryPageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const { data: subcategoryData } = await getCategoryBySlug(subcategory);
  const { category: parentCategory } = await getCategoryBreadcrumb(category);

  if (!subcategoryData) {
    return { title: "Category Not Found" };
  }

  return {
    title: subcategoryData.seoTitle || `${subcategoryData.name} - ${parentCategory?.name || ""}`,
    description:
      subcategoryData.seoDescription ||
      subcategoryData.description ||
      `Shop ${subcategoryData.name} in ${parentCategory?.name || ""} at Mythium.`,
  };
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: SubcategoryPageProps) {
  const { category: categorySlug, subcategory: subcategorySlug } = await params;
  const resolvedSearchParams = await searchParams;

  // Fetch category and subcategory data
  const [categoryResult, subcategoryResult] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getCategoryBySlug(subcategorySlug),
  ]);

  const categoryData = categoryResult.data;
  const subcategoryData = subcategoryResult.data;

  if (!categoryData || !subcategoryData) {
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
    subcategory: subcategorySlug,
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
  const facets = await getProductFacets(subcategorySlug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-500 hover:text-[#285A48]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link href="/categories" className="text-gray-500 hover:text-[#285A48]">
              Categories
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              href={`/categories/${categorySlug}`}
              className="text-gray-500 hover:text-[#285A48]"
            >
              {categoryData.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{subcategoryData.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-[#285A48] to-[#408A71] py-12">
        <div className="container">
          <p className="text-sm font-medium uppercase tracking-wider text-white/60">
            {categoryData.name}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">
            {subcategoryData.name}
          </h1>
          {subcategoryData.description && (
            <p className="mt-3 max-w-2xl text-lg text-white/80">
              {subcategoryData.description}
            </p>
          )}
          <p className="mt-4 text-sm text-white/60">
            {pagination.total} {pagination.total === 1 ? "product" : "products"} found
          </p>
        </div>
      </div>

      {/* Products Section - Client Component for filters */}
      <CategoryProductsClient
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
        categoryName={subcategoryData.name}
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
