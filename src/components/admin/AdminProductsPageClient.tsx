"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  LayoutList,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
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

type Product = {
  _id: string;
  name: string;
  slug: string;
  category?: { name?: string; _id?: string };
  soldCount: number;
  basePrice: number;
  salePrice?: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  variants: Array<{ stock: number; size?: string; color?: string }>;
  isActive: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt: string;
  shortDescription?: string;
};

type ProductResponse = {
  success: boolean;
  data: Product[];
};

type ViewMode = "grid" | "list";

export default function AdminProductsPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-high" | "price-low" | "name">("newest");
  const [editingQuick, setEditingQuick] = useState<string | null>(null);
  const [quickPrice, setQuickPrice] = useState("");
  const [quickSalePrice, setQuickSalePrice] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await fetchJson<ProductResponse>("/api/admin/products?limit=100");
        setProducts(payload.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    // Filter by search query
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      result = result.filter((product) =>
        [product.name, product.category?.name || "", product.slug]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      );
    }

    // Filter by active status
    if (filterActive === "active") {
      result = result.filter((p) => p.isActive);
    } else if (filterActive === "inactive") {
      result = result.filter((p) => !p.isActive);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "price-high":
        result.sort((a, b) => (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice));
        break;
      case "price-low":
        result.sort((a, b) => (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice));
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [products, query, filterActive, sortBy]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    const inactive = products.filter((p) => !p.isActive).length;
    const totalStock = products.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0), 0);
    const totalSold = products.reduce((sum, p) => sum + p.soldCount, 0);
    return { active, inactive, totalStock, totalSold, total: products.length };
  }, [products]);

  const handleToggleVisibility = async (productId: string, isActive: boolean) => {
    setError(null);
    setActionProductId(productId);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update product visibility");
      }

      setProducts((prev) =>
        prev.map((item) => (item._id === productId ? { ...item, isActive: !isActive } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product visibility");
    } finally {
      setActionProductId(null);
    }
  };

  const handleQuickPriceUpdate = async (productId: string) => {
    setError(null);
    setActionProductId(productId);
    try {
      const payload: { basePrice?: number; salePrice?: number | null } = {};
      if (quickPrice) payload.basePrice = Number(quickPrice);
      if (quickSalePrice) {
        payload.salePrice = Number(quickSalePrice);
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        throw new Error(result?.error || "Failed to update price");
      }

      setProducts((prev) =>
        prev.map((item) =>
          item._id === productId
            ? {
                ...item,
                basePrice: payload.basePrice ?? item.basePrice,
                salePrice: payload.salePrice !== undefined ? (payload.salePrice ?? undefined) : item.salePrice,
              }
            : item
        )
      );
      setEditingQuick(null);
      setQuickPrice("");
      setQuickSalePrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setActionProductId(null);
    }
  };

  const startQuickEdit = (product: Product) => {
    setEditingQuick(product._id);
    setQuickPrice(String(product.basePrice));
    setQuickSalePrice(product.salePrice ? String(product.salePrice) : "");
  };

  const getProductImage = (product: Product) => {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url || product.images?.[0]?.url || null;
  };

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Premium Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#f7fbf8] via-[#f8f4e8]/50 to-[#eef8f3]" />
      <div className="pointer-events-none fixed -left-40 top-0 h-96 w-96 rounded-full bg-[#408A71]/10 blur-[100px]" />
      <div className="pointer-events-none fixed -right-40 top-40 h-96 w-96 rounded-full bg-[#B0E4CC]/30 blur-[100px]" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-[#285A48]/10 bg-white/80 p-6 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.15)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-secondary-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#285A48] to-[#408A71] shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                Products Command Deck
              </h1>
              <p className="mt-2 text-sm text-secondary-600">
                Manage inventory, pricing, and catalog performance
              </p>
            </div>
            <Link href="/admin/products/new">
              <Button variant="primary" className="gap-2 rounded-xl shadow-lg">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            <div className="rounded-2xl border border-[#285A48]/10 bg-gradient-to-br from-white to-[#f7fff9] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Total</p>
                <Package className="h-4 w-4 text-[#285A48]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active</p>
                <Eye className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.active}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Inactive</p>
                <EyeOff className="h-4 w-4 text-red-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-red-700">{stats.inactive}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Stock</p>
                <Box className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Sold</p>
                <TrendingUp className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-violet-700">{stats.totalSold.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters & View Controls */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                <Input
                  placeholder="Search products by name, category, or slug..."
                  className="pl-10 rounded-xl"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
                    className="appearance-none rounded-xl border-2 border-[#285A48]/20 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-secondary-700 transition-all hover:border-[#285A48]/40 focus:border-[#285A48] focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none rounded-xl border-2 border-[#285A48]/20 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-secondary-700 transition-all hover:border-[#285A48]/40 focus:border-[#285A48] focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400 pointer-events-none" />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl border-2 border-[#285A48]/20 bg-white p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === "grid" ? "bg-[#285A48] text-white" : "text-secondary-500 hover:text-secondary-700"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all ${
                    viewMode === "list" ? "bg-[#285A48] text-white" : "text-secondary-500 hover:text-secondary-700"
                  }`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#B0E4CC]" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#285A48]" />
              </div>
              <p className="mt-4 text-sm font-medium text-secondary-600">Loading products...</p>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {!loading && !error && (
          <>
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => {
                  const stock = product.variants.reduce((sum, row) => sum + row.stock, 0);
                  const imageUrl = getProductImage(product);
                  const isEditing = editingQuick === product._id;

                  return (
                    <Card
                      key={product._id}
                      className="group relative overflow-hidden border-0 bg-white shadow-[0_4px_24px_-4px_rgba(40,90,72,0.12)] transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(40,90,72,0.2)] hover:-translate-y-1"
                    >
                      {/* Status Badges */}
                      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
                        {product.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                        {product.isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                            <Sparkles className="h-3 w-3" /> New
                          </span>
                        )}
                        {!product.isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link href={`/admin/products/${product._id}/edit`}>
                          <button className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-[#285A48] hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => startQuickEdit(product)}
                          className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-blue-500 hover:text-white"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(product._id, product.isActive)}
                          disabled={actionProductId === product._id}
                          className="rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-amber-500 hover:text-white disabled:opacity-50"
                        >
                          {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary-100 to-secondary-50">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-16 w-16 text-secondary-300" />
                          </div>
                        )}
                        {product.salePrice && product.salePrice < product.basePrice && (
                          <div className="absolute bottom-3 left-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                            {Math.round((1 - product.salePrice / product.basePrice) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <Badge variant={product.isActive ? "success" : "danger"} className="text-[10px]">
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-secondary-500">{product.category?.name || "Uncategorized"}</span>
                        </div>

                        <h3 className="line-clamp-2 text-sm font-semibold text-secondary-900">{product.name}</h3>

                        {/* Quick Price Edit */}
                        {isEditing ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={quickPrice}
                                onChange={(e) => setQuickPrice(e.target.value)}
                                placeholder="Base Price"
                                className="w-full rounded-lg border border-secondary-200 px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                value={quickSalePrice}
                                onChange={(e) => setQuickSalePrice(e.target.value)}
                                placeholder="Sale"
                                className="w-full rounded-lg border border-secondary-200 px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                className="flex-1 text-xs"
                                onClick={() => handleQuickPriceUpdate(product._id)}
                                isLoading={actionProductId === product._id}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setEditingQuick(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-baseline gap-2">
                            {product.salePrice && product.salePrice < product.basePrice ? (
                              <>
                                <span className="text-lg font-bold text-[#285A48]">
                                  {formatCurrency(product.salePrice)}
                                </span>
                                <span className="text-sm text-secondary-400 line-through">
                                  {formatCurrency(product.basePrice)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-secondary-900">
                                {formatCurrency(product.basePrice)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3 text-xs text-secondary-500">
                          <span className="flex items-center gap-1">
                            <Box className="h-3 w-3" /> Stock: {stock}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Sold: {product.soldCount}
                          </span>
                        </div>

                        {/* Full Edit Button */}
                        <Link href={`/admin/products/${product._id}/edit`} className="mt-3 block">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-xl text-xs">
                            <Edit3 className="h-3.5 w-3.5" /> Full Edit
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-secondary-100">
                    {filtered.map((product) => {
                      const stock = product.variants.reduce((sum, row) => sum + row.stock, 0);
                      const imageUrl = getProductImage(product);

                      return (
                        <div
                          key={product._id}
                          className="group flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-secondary-50/50 sm:flex-nowrap"
                        >
                          {/* Image */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary-100">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-8 w-8 text-secondary-300" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-secondary-900">{product.name}</h3>
                              {product.isFeatured && (
                                <Badge variant="warning" className="text-[10px]">Featured</Badge>
                              )}
                              {product.isNew && (
                                <Badge variant="default" className="text-[10px]">New</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-secondary-500">
                              {product.category?.name || "Uncategorized"} • {formatDate(product.createdAt)}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            {product.salePrice && product.salePrice < product.basePrice ? (
                              <>
                                <p className="font-bold text-[#285A48]">{formatCurrency(product.salePrice)}</p>
                                <p className="text-xs text-secondary-400 line-through">
                                  {formatCurrency(product.basePrice)}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-secondary-900">{formatCurrency(product.basePrice)}</p>
                            )}
                          </div>

                          {/* Stock & Sold */}
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-semibold text-secondary-900">{stock}</p>
                              <p className="text-xs text-secondary-500">Stock</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-secondary-900">{product.soldCount}</p>
                              <p className="text-xs text-secondary-500">Sold</p>
                            </div>
                          </div>

                          {/* Status */}
                          <Badge variant={product.isActive ? "success" : "danger"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/products/${product._id}/edit`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleToggleVisibility(product._id, product.isActive)}
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!filtered.length && (
              <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)]">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
                    <Box className="h-8 w-8 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900">No products found</h3>
                  <p className="mt-1 text-sm text-secondary-500">
                    {query ? "Try adjusting your search or filters" : "Add your first product to get started"}
                  </p>
                  {!query && (
                    <Link href="/admin/products/new" className="mt-4 inline-block">
                      <Button variant="primary" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Product
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Results Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-sm text-secondary-500">
            Showing {filtered.length} of {products.length} products
          </p>
        )}
      </div>
    </div>
  );
}
