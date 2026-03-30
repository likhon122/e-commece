"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Box, EyeOff, Eye, Pencil, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { fetchJson, formatCurrency, formatDate } from "./utils";

type ProductResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    category?: { name?: string };
    soldCount: number;
    basePrice: number;
    salePrice?: number;
    variants: Array<{ stock: number }>;
    isActive: boolean;
    createdAt: string;
  }>;
};

export default function AdminProductsPageClient() {
  const [products, setProducts] = useState<ProductResponse["data"]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchJson<ProductResponse>(
          "/api/admin/products?limit=100",
        );
        setProducts(payload.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch products",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) =>
      [product.name, product.category?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [products, query]);

  const handleToggleVisibility = async (
    productId: string,
    isActive: boolean,
  ) => {
    setError(null);
    setActionProductId(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "Failed to update product visibility",
        );
      }

      setProducts((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, isActive: !isActive } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product visibility",
      );
    } finally {
      setActionProductId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Products Command Deck
            </h1>
            <p className="mt-1 text-sm text-secondary-600">
              Live inventory and catalog performance overview.
            </p>
          </div>
          <Link href="/admin/products/new">
            <Button variant="primary" className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardHeader className="space-y-4">
          <CardTitle>Catalog</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
            <Input
              placeholder="Search by product or category"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-secondary-600">Loading products...</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3">
              {filtered.map((product) => {
                const stock = product.variants.reduce(
                  (sum, row) => sum + row.stock,
                  0,
                );
                return (
                  <div
                    key={product._id}
                    className="grid gap-3 rounded-xl border border-secondary-100 p-4 text-sm sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-secondary-900">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-secondary-500">
                        {product.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <p className="text-secondary-700">
                      {formatCurrency(product.salePrice || product.basePrice)}
                    </p>
                    <p className="text-secondary-700">Stock: {stock}</p>
                    <p className="text-secondary-500">
                      {formatDate(product.createdAt)}
                    </p>
                    <Badge variant={product.isActive ? "success" : "danger"}>
                      {product.isActive ? "active" : "inactive"}
                    </Badge>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/products/${product._id}/edit`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          handleToggleVisibility(product._id, product.isActive)
                        }
                        isLoading={actionProductId === product._id}
                      >
                        {product.isActive ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {product.isActive ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center text-secondary-500">
                  <Box className="mx-auto mb-3 h-5 w-5" />
                  No products found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
