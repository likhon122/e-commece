
import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search as SearchIcon } from "lucide-react";
import { getProducts, getProductFacets } from "@/lib/api/products";
import SearchResultsClient from "./SearchResultsClient";

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q as string | undefined;

  return {
    title: query ? `Search: ${query}` : "Search Products",
    description: query
      ? `Search results for "${query}" at Mythium`
      : "Search for products at Mythium",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;

  const query = (resolvedSearchParams.q as string) || "";
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
  const category = resolvedSearchParams.category as string | undefined;

  // Fetch products with search query
  const { data: products, pagination } = await getProducts({
    search: query,
    category,
    page,
    limit: 24,
    sortBy,
    minPrice,
    maxPrice,
    sizes,
    colors,
  });

  // Fetch facets for filters
  const facets = await getProductFacets();

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
            <span className="font-medium text-gray-900">Search</span>
          </nav>
        </div>
      </div>

      {/* Search Header */}
      <div className="bg-gradient-to-r from-[#285A48] to-[#408A71] py-12">
        <div className="container">
          <div className="flex items-center gap-3">
            <SearchIcon className="h-8 w-8 text-white/60" />
            <div>
              {query ? (
                <>
                  <p className="text-sm font-medium uppercase tracking-wider text-white/60">
                    Search Results
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">
                    &quot;{query}&quot;
                  </h1>
                </>
              ) : (
                <h1 className="text-3xl font-bold text-white md:text-4xl">
                  Search Products
                </h1>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-white/60">
            {pagination.total} {pagination.total === 1 ? "product" : "products"} found
          </p>
        </div>
      </div>

      {/* Search Results - Client Component */}
      <SearchResultsClient
        initialQuery={query}
        initialProducts={products}
        initialPagination={pagination}
        facets={facets}
        initialFilters={{
          search: query,
          minPrice: minPrice?.toString() || "",
          maxPrice: maxPrice?.toString() || "",
          sizes,
          colors,
          sortBy,
          category: category || "",
        }}
      />
    </div>
  );
}
