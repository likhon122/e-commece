"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, RefreshCw } from "lucide-react";
import ProductCard from "./ProductCard";
import { Button, PremiumSectionLoading, ProductGridSkeleton } from "@/components/ui";
import type { IProduct } from "@/types";

interface ProductApiResponse {
  success: boolean;
  data: IProduct[];
  facets?: {
    priceRange?: { minPrice: number; maxPrice: number };
    sizes?: string[];
    colors?: Array<{ name: string; code: string }>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

interface CategoriesResponse {
  success: boolean;
  data: CategoryNode[];
}

interface Filters {
  search: string;
  category: string;
  subcategory: string;
  minPrice: string;
  maxPrice: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  sortBy: string;
}

const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const defaultColors = [
  { name: "Black", code: "#000000" },
  { name: "White", code: "#FFFFFF" },
  { name: "Navy", code: "#1e3a5f" },
  { name: "Red", code: "#dc2626" },
  { name: "Green", code: "#16a34a" },
  { name: "Blue", code: "#2563eb" },
];

const defaultFilters: Filters = {
  search: "",
  category: "",
  subcategory: "",
  minPrice: "",
  maxPrice: "",
  sizes: [],
  colors: [],
  inStock: false,
  sortBy: "newest",
};

export default function ProductsCatalogClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [facets, setFacets] = useState<NonNullable<ProductApiResponse["facets"]>>({
    priceRange: { minPrice: 0, maxPrice: 10000 },
    sizes: [],
    colors: [],
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  const parseFiltersFromUrl = useCallback((): Filters => {
    return {
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sizes: searchParams.getAll("sizes"),
      colors: searchParams.getAll("colors"),
      inStock: searchParams.get("inStock") === "true",
      sortBy: searchParams.get("sortBy") || "newest",
    };
  }, [searchParams]);

  const buildQueryStringFromFilters = useCallback(
    (value: Filters, page?: number) => {
      const params = new URLSearchParams();
      params.set("page", String(page || 1));
      params.set("limit", "24");
      params.set("sortBy", value.sortBy || "newest");

      if (value.search) params.set("search", value.search);
      if (value.category) params.set("category", value.category);
      if (value.subcategory) params.set("subcategory", value.subcategory);
      if (value.minPrice) params.set("minPrice", value.minPrice);
      if (value.maxPrice) params.set("maxPrice", value.maxPrice);
      if (value.inStock) params.set("inStock", "true");
      value.sizes.forEach((size) => params.append("sizes", size));
      value.colors.forEach((color) => params.append("colors", color));

      return params.toString();
    },
    [],
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as ProductApiResponse;

      if (data.success) {
        setProducts(data.data || []);
        if (data.facets) {
          setFacets({
            priceRange: data.facets.priceRange || { minPrice: 0, maxPrice: 10000 },
            sizes: data.facets.sizes || [],
            colors: data.facets.colors || [],
          });
        }
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore,
        });
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const data = (await response.json()) as CategoriesResponse;
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    setFilters(parseFiltersFromUrl());
  }, [parseFiltersFromUrl]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const availableSubcategories = useMemo(() => {
    const selected = categories.find((entry) => entry.slug === filters.category);
    return selected?.children || [];
  }, [categories, filters.category]);

  const availableSizes = facets.sizes?.length ? facets.sizes : defaultSizes;
  const availableColors = facets.colors?.length ? facets.colors : defaultColors;

  const applyFilters = (value: Filters, page: number = 1) => {
    const queryString = buildQueryStringFromFilters(value, page);
    router.push(`/products?${queryString}`, { scroll: false });
  };

  const handleFilterUpdate = (partial: Partial<Filters>) => {
    const updated = { ...filters, ...partial };
    if (partial.category !== undefined) {
      updated.subcategory = "";
    }
    setFilters(updated);
  };

  const handlePageChange = (newPage: number) => {
    applyFilters(filters, newPage);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumSectionLoading
          title="Loading product catalog"
          subtitle="Applying filters, ranking inventory, and preparing premium cards."
          className="min-h-[220px] flex items-center justify-center"
        />
        <ProductGridSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-xl border border-secondary-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
          <SlidersHorizontal className="h-5 w-5 text-secondary-500" />
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Search</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <input
              value={filters.search}
              onChange={(event) => handleFilterUpdate({ search: event.target.value })}
              placeholder="Search products"
              className="w-full rounded-lg border border-secondary-200 py-2 pl-10 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Category</label>
          <select
            value={filters.category}
            onChange={(event) => handleFilterUpdate({ category: event.target.value })}
            className="mt-2 w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Subcategory</label>
          <select
            value={filters.subcategory}
            onChange={(event) =>
              handleFilterUpdate({ subcategory: event.target.value })
            }
            disabled={!filters.category}
            className="mt-2 w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm disabled:bg-secondary-50"
          >
            <option value="">All Subcategories</option>
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory._id} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Price Range</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min={0}
              value={filters.minPrice}
              onChange={(event) => handleFilterUpdate({ minPrice: event.target.value })}
              placeholder={String(facets.priceRange?.minPrice || 0)}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={filters.maxPrice}
              onChange={(event) => handleFilterUpdate({ maxPrice: event.target.value })}
              placeholder={String(facets.priceRange?.maxPrice || 0)}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Sizes</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  const next = filters.sizes.includes(size)
                    ? filters.sizes.filter((entry) => entry !== size)
                    : [...filters.sizes, size];
                  handleFilterUpdate({ sizes: next });
                }}
                className={`rounded-md border px-3 py-1 text-sm ${
                  filters.sizes.includes(size)
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-secondary-200 text-secondary-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-secondary-900">Colors</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <button
                key={color.name}
                type="button"
                title={color.name}
                onClick={() => {
                  const next = filters.colors.includes(color.name)
                    ? filters.colors.filter((entry) => entry !== color.name)
                    : [...filters.colors, color.name];
                  handleFilterUpdate({ colors: next });
                }}
                className={`h-8 w-8 rounded-full border-2 ${
                  filters.colors.includes(color.name)
                    ? "ring-2 ring-primary-500 ring-offset-2"
                    : "border-secondary-200"
                }`}
                style={{ backgroundColor: color.code }}
              />
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm text-secondary-800">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(event) => handleFilterUpdate({ inStock: event.target.checked })}
          />
          In stock only
        </label>

        <div className="mt-6 flex gap-2">
          <Button onClick={() => applyFilters(filters, 1)} className="w-full" variant="primary">
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setFilters(defaultFilters);
              applyFilters(defaultFilters, 1);
            }}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </aside>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary-600">
            Showing <span className="font-medium">{(pagination.page - 1) * 24 + 1}</span>-<span className="font-medium">{Math.min(pagination.page * 24, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> products
          </p>

          <select
            value={filters.sortBy}
            onChange={(event) => {
              const next = { ...filters, sortBy: event.target.value };
              setFilters(next);
              applyFilters(next, 1);
            }}
            className="rounded-lg border border-secondary-200 px-4 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Most Popular</option>
            <option value="rating">Best Rated</option>
          </select>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-secondary-200 bg-white py-16">
            <div className="text-6xl">🔍</div>
            <h3 className="mt-4 text-lg font-semibold text-secondary-900">
              No products found
            </h3>
            <p className="mt-2 text-secondary-500">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:opacity-50"
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
                            ? "bg-primary-600 text-white"
                            : "text-secondary-700 hover:bg-secondary-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
