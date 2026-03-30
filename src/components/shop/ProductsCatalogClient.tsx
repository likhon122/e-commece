"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "@/components/ui";
import type { IProduct } from "@/types";

interface ProductApiResponse {
  success: boolean;
  data: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function ProductsCatalogClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    // Get all params from URL
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "24";
    const sortBy = searchParams.get("sortBy") || "newest";
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");
    const isNew = searchParams.get("new");
    const minRating = searchParams.get("minRating");
    const inStock = searchParams.get("inStock");
    const tags = searchParams.getAll("tags");
    const sizes = searchParams.getAll("sizes");
    const colors = searchParams.getAll("colors");

    params.append("page", page);
    params.append("limit", limit);
    params.append("sortBy", sortBy);

    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (subcategory) params.append("subcategory", subcategory);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (featured) params.append("featured", featured);
    if (isNew) params.append("new", isNew);
    if (minRating) params.append("minRating", minRating);
    if (inStock) params.append("inStock", inStock);
    tags.forEach((tag) => params.append("tags", tag));
    sizes.forEach((size) => params.append("sizes", size));
    colors.forEach((color) => params.append("colors", color));

    return params.toString();
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?${buildQueryString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as ProductApiResponse;

      if (data.success) {
        setProducts(data.data || []);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore,
        });
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  if (loading) {
    return <ProductGridSkeleton count={12} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-secondary-200 bg-white py-16">
        <div className="text-6xl">🔍</div>
        <h3 className="mt-4 text-lg font-semibold text-secondary-900">
          No products found
        </h3>
        <p className="mt-2 text-secondary-500">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-sm text-secondary-600">
        Showing{" "}
        <span className="font-medium">
          {(pagination.page - 1) * 24 + 1}-
          {Math.min(pagination.page * 24, pagination.total)}
        </span>{" "}
        of <span className="font-medium">{pagination.total}</span> products
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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
  );
}
