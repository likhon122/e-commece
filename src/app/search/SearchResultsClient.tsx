"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Grid3X3,
  LayoutGrid,
  Search,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { Button, EmptyState, NotFoundMessage } from "@/components/ui";
import ProductCard from "@/components/shop/ProductCard";
import type { IProduct } from "@/types";
import type { ProductFacets } from "@/lib/api/products";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface Filters {
  search: string;
  minPrice: string;
  maxPrice: string;
  sizes: string[];
  colors: string[];
  sortBy: string;
  category: string;
}

interface SearchResultsClientProps {
  initialQuery: string;
  initialProducts: IProduct[];
  initialPagination: Pagination;
  facets: ProductFacets;
  initialFilters: Filters;
}

const sortOptions = [
  { label: "Relevance", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popularity" },
  { label: "Best Rated", value: "rating" },
];

export default function SearchResultsClient({
  initialQuery,
  initialProducts,
  initialPagination,
  facets,
  initialFilters,
}: SearchResultsClientProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products] = useState<IProduct[]>(initialProducts);
  const [pagination] = useState<Pagination>(initialPagination);
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const availableSizes = facets.sizes.length > 0 ? facets.sizes : ["XS", "S", "M", "L", "XL", "XXL"];
  const availableColors =
    facets.colors.length > 0
      ? facets.colors
      : [
          { name: "Black", code: "#000000" },
          { name: "White", code: "#FFFFFF" },
          { name: "Navy", code: "#1e3a5f" },
          { name: "Red", code: "#dc2626" },
        ];

  const buildUrl = useCallback(
    (newFilters: Partial<Filters>, newPage?: number) => {
      const params = new URLSearchParams();
      const mergedFilters = { ...filters, ...newFilters };

      if (mergedFilters.search) params.set("q", mergedFilters.search);
      if (mergedFilters.minPrice) params.set("minPrice", mergedFilters.minPrice);
      if (mergedFilters.maxPrice) params.set("maxPrice", mergedFilters.maxPrice);
      if (mergedFilters.sortBy !== "newest") params.set("sortBy", mergedFilters.sortBy);
      if (mergedFilters.category) params.set("category", mergedFilters.category);
      mergedFilters.sizes.forEach((size) => params.append("sizes", size));
      mergedFilters.colors.forEach((color) => params.append("colors", color));
      if (newPage && newPage > 1) params.set("page", newPage.toString());

      return `/search?${params.toString()}`;
    },
    [filters]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery };
    setFilters(newFilters);
    router.push(buildUrl({ search: searchQuery }));
  };

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.push(buildUrl(filters));
    setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters: Filters = {
      search: searchQuery,
      minPrice: "",
      maxPrice: "",
      sizes: [],
      colors: [],
      sortBy: "newest",
      category: "",
    };
    setFilters(clearedFilters);
    router.push(buildUrl(clearedFilters));
  };

  const handleSortChange = (value: string) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    router.push(buildUrl({ sortBy: value }));
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl({}, newPage));
  };

  const activeFiltersCount = [filters.minPrice, filters.maxPrice, ...filters.sizes, ...filters.colors].filter(
    Boolean
  ).length;

  // No query provided
  if (!initialQuery) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Search className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Start Your Search</h2>
          <p className="mt-2 text-gray-600">
            Enter a keyword to search for products in our catalog.
          </p>
          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-12 pr-4 text-lg focus:border-[#285A48] focus:outline-none focus:ring-2 focus:ring-[#285A48]/20"
                autoFocus
              />
            </div>
            <Button type="submit" variant="primary" className="mt-4 w-full" size="lg">
              Search
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products..."
            className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-24 text-base focus:border-[#285A48] focus:outline-none focus:ring-2 focus:ring-[#285A48]/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#285A48] px-4 py-2 text-sm font-medium text-white hover:bg-[#408A71]"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden w-72 flex-shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-[#285A48] hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Clear ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Price Range */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Price Range (৳)</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  placeholder="Min"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#285A48] focus:outline-none"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  placeholder="Max"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#285A48] focus:outline-none"
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Sizes</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      const newSizes = filters.sizes.includes(size)
                        ? filters.sizes.filter((s) => s !== size)
                        : [...filters.sizes, size];
                      handleFilterChange("sizes", newSizes);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      filters.sizes.includes(size)
                        ? "border-[#285A48] bg-[#285A48] text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Colors</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      const newColors = filters.colors.includes(color.name)
                        ? filters.colors.filter((c) => c !== color.name)
                        : [...filters.colors, color.name];
                      handleFilterChange("colors", newColors);
                    }}
                    title={color.name}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      filters.colors.includes(color.name)
                        ? "ring-2 ring-[#285A48] ring-offset-2"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color.code }}
                  />
                ))}
              </div>
            </div>

            <Button onClick={applyFilters} className="mt-6 w-full" variant="primary">
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-[#285A48] px-2 py-0.5 text-xs text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Grid Toggle */}
              <div className="hidden items-center gap-1 rounded-lg border border-gray-200 p-1 sm:flex">
                <button
                  onClick={() => setGridCols(3)}
                  className={`rounded p-1.5 ${
                    gridCols === 3 ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`rounded p-1.5 ${
                    gridCols === 4 ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-[#285A48] focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <NotFoundMessage type="search" query={initialQuery} />
          ) : (
            <>
              <div
                className={`grid gap-4 ${
                  gridCols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (pagination.totalPages > 5 && pagination.page > 3) {
                        pageNum = pagination.page - 2 + i;
                      }
                      if (pageNum > pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? "bg-[#285A48] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700">Price Range (৳)</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">Sizes</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        const newSizes = filters.sizes.includes(size)
                          ? filters.sizes.filter((s) => s !== size)
                          : [...filters.sizes, size];
                        handleFilterChange("sizes", newSizes);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                        filters.sizes.includes(size)
                          ? "border-[#285A48] bg-[#285A48] text-white"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">Colors</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        const newColors = filters.colors.includes(color.name)
                          ? filters.colors.filter((c) => c !== color.name)
                          : [...filters.colors, color.name];
                        handleFilterChange("colors", newColors);
                      }}
                      title={color.name}
                      className={`h-10 w-10 rounded-full border-2 ${
                        filters.colors.includes(color.name)
                          ? "ring-2 ring-[#285A48] ring-offset-2"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color.code }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 bg-white p-6">
              <Button onClick={clearFilters} variant="outline" className="flex-1">
                Clear All
              </Button>
              <Button onClick={applyFilters} variant="primary" className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
