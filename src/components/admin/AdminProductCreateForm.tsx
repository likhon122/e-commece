"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { fetchJson } from "./utils";

type CategoryResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    parent?: string | null;
    isActive: boolean;
  }>;
};

type ProductDetailResponse = {
  success: boolean;
  data: {
    _id: string;
    name: string;
    description: string;
    shortDescription: string;
    category: string;
    subcategory?: string;
    brand?: string;
    basePrice: number;
    salePrice?: number;
    images: UploadedMedia[];
    video?: UploadedVideo;
    variants: Array<{
      sku: string;
      size: string;
      color: string;
      colorCode: string;
      stock: number;
      price?: number;
    }>;
    specifications?: Array<{ key: string; value: string }>;
    tags?: string[];
    isActive: boolean;
    isFeatured: boolean;
    isNew: boolean;
  };
};

type VariantForm = {
  sku: string;
  size: string;
  color: string;
  colorCode: string;
  stock: string;
  price: string;
};

type UploadedMedia = {
  url: string;
  alt: string;
  isPrimary: boolean;
};

type UploadedVideo = {
  url: string;
  alt: string;
};

const acceptedVideoExtensions = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".m4v",
  ".3gp",
];

const initialVariant = (): VariantForm => ({
  sku: "",
  size: "",
  color: "",
  colorCode: "#000000",
  stock: "0",
  price: "",
});

type AdminProductCreateFormProps = {
  mode?: "create" | "edit";
  productId?: string;
};

export default function AdminProductCreateForm({
  mode = "create",
  productId,
}: AdminProductCreateFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [categories, setCategories] = useState<
    Array<{ _id: string; name: string; parent?: string | null; isActive: boolean }>
  >([]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [images, setImages] = useState<UploadedMedia[]>([]);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [specText, setSpecText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [variants, setVariants] = useState<VariantForm[]>([initialVariant()]);

  const requiredMark = <span className="ml-1 text-red-600">*</span>;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const payload = await fetchJson<CategoryResponse>("/api/admin/categories");
        setCategories(payload.data || []);
      } catch {
        setError("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      if (!isEditMode || !productId) {
        setLoadingProduct(false);
        return;
      }

      try {
        const payload = await fetchJson<ProductDetailResponse>(
          `/api/admin/products/${productId}`,
        );
        const product = payload.data;

        setName(product.name || "");
        setShortDescription(product.shortDescription || "");
        setDescription(product.description || "");
        setSelectedCategoryId(String(product.subcategory || product.category || ""));
        setBrand(product.brand || "");
        setBasePrice(String(product.basePrice ?? ""));
        setSalePrice(
          product.salePrice !== undefined ? String(product.salePrice) : "",
        );
        setImages(product.images || []);
        setVideo(product.video || null);
        setTagsText((product.tags || []).join(", "));
        setSpecText(
          (product.specifications || [])
            .map((item) => `${item.key}:${item.value}`)
            .join("\n"),
        );
        setIsActive(Boolean(product.isActive));
        setIsFeatured(Boolean(product.isFeatured));
        setIsNew(Boolean(product.isNew));
        setVariants(
          (product.variants || []).length
            ? product.variants.map((variant) => ({
                sku: variant.sku || "",
                size: variant.size || "",
                color: variant.color || "",
                colorCode: variant.colorCode || "#000000",
                stock: String(variant.stock ?? 0),
                price: variant.price !== undefined ? String(variant.price) : "",
              }))
            : [initialVariant()],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [isEditMode, productId]);

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [tagsText],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; parent?: string | null; isActive: boolean }>();
    for (const item of categories) {
      map.set(item._id, item);
    }
    return map;
  }, [categories]);

  const categoryOptions = useMemo(() => {
    const childrenByParent = new Map<
      string | null,
      Array<{ _id: string; name: string; parent?: string | null; isActive: boolean }>
    >();

    for (const item of categories) {
      const parentId = item.parent || null;
      const current = childrenByParent.get(parentId) || [];
      current.push(item);
      childrenByParent.set(parentId, current);
    }

    for (const rows of childrenByParent.values()) {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    }

    const flattened: Array<{ _id: string; name: string; depth: number; path: string }> = [];

    const walk = (parentId: string | null, depth: number, pathParts: string[]) => {
      const children = childrenByParent.get(parentId) || [];
      for (const child of children) {
        const nextPath = [...pathParts, child.name];
        flattened.push({
          _id: child._id,
          name: child.name,
          depth,
          path: nextPath.join(" > "),
        });
        walk(child._id, depth + 1, nextPath);
      }
    };

    walk(null, 0, []);

    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) return flattened;

    return flattened.filter((item) => item.path.toLowerCase().includes(keyword));
  }, [categories, categorySearch]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return "Select category";
    return categoryById.get(selectedCategoryId)?.name || "Select category";
  }, [categoryById, selectedCategoryId]);

  const resolveCategoryPayload = (targetId: string): { category: string; subcategory?: string } => {
    const selected = categoryById.get(targetId);
    if (!selected) {
      return { category: targetId };
    }

    let rootId = selected._id;
    let parentId = selected.parent || null;

    while (parentId) {
      const parentNode = categoryById.get(parentId);
      if (!parentNode) break;
      rootId = parentNode._id;
      parentId = parentNode.parent || null;
    }

    if (rootId === selected._id) {
      return { category: selected._id };
    }

    return {
      category: rootId,
      subcategory: selected._id,
    };
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, initialVariant()]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateVariant = (
    index: number,
    key: keyof VariantForm,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, [key]: value } : variant,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (uploadingImage || uploadingVideo) {
      const message =
        "Please wait until media upload completes before creating the product.";
      setError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!name.trim()) nextFieldErrors.name = "Product name is required";
    if (name.trim().length < 3)
      nextFieldErrors.name = "Product name must be at least 3 characters";
    if (!selectedCategoryId) nextFieldErrors.category = "Category is required";
    if (!shortDescription.trim())
      nextFieldErrors.shortDescription = "Short description is required";
    if (shortDescription.trim().length < 10) {
      nextFieldErrors.shortDescription =
        "Short description must be at least 10 characters";
    }
    if (!description.trim())
      nextFieldErrors.description = "Full description is required";
    if (description.trim().length < 20) {
      nextFieldErrors.description =
        "Description must be at least 20 characters";
    }
    if (!basePrice || Number(basePrice) < 0)
      nextFieldErrors.basePrice = "Valid base price is required";
    if (!images.length) nextFieldErrors.images = "Upload at least one image";
    if (images.length > 5)
      nextFieldErrors.images = "You can upload maximum 5 images";

    variants.forEach((variant, index) => {
      if (!variant.sku.trim())
        nextFieldErrors[`variant-${index}-sku`] = "SKU is required";
      if (!variant.size.trim())
        nextFieldErrors[`variant-${index}-size`] = "Size is required";
      if (!variant.color.trim())
        nextFieldErrors[`variant-${index}-color`] = "Color is required";
      if (!/^#[0-9A-Fa-f]{6}$/.test(variant.colorCode)) {
        nextFieldErrors[`variant-${index}-colorCode`] =
          "Color code must be valid hex";
      }
      if (variant.stock === "" || Number(variant.stock) < 0) {
        nextFieldErrors[`variant-${index}-stock`] = "Stock must be 0 or more";
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitting(false);
      setError("Please fix validation errors and submit again.");
      return;
    }

    try {
      const specifications = specText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [key, ...rest] = line.split(":");
          return {
            key: key?.trim(),
            value: rest.join(":").trim(),
          };
        })
        .filter((item) => item.key && item.value) as Array<{
        key: string;
        value: string;
      }>;

      const categoryPayload = resolveCategoryPayload(selectedCategoryId);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        category: categoryPayload.category,
        subcategory: categoryPayload.subcategory,
        brand: brand.trim() || undefined,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        images,
        video: video || undefined,
        variants: variants.map((variant) => ({
          sku: variant.sku.trim(),
          size: variant.size.trim(),
          color: variant.color.trim(),
          colorCode: variant.colorCode,
          stock: Number(variant.stock),
          price: variant.price ? Number(variant.price) : undefined,
        })),
        specifications: specifications.length ? specifications : undefined,
        tags: parsedTags.length ? parsedTags : undefined,
        isActive,
        isFeatured,
        isNew,
      };

      const endpoint =
        isEditMode && productId
          ? `/api/admin/products/${productId}`
          : "/api/admin/products";

      const response = await fetch(endpoint, {
        method: isEditMode ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const apiError =
          result?.error ||
          `Failed to ${isEditMode ? "update" : "create"} product`;
        const serverFieldErrors = result?.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";
        throw new Error(
          [apiError, serverFieldErrors].filter(Boolean).join(" "),
        );
      }

      toast.success(
        `Product ${isEditMode ? "updated" : "created"} successfully`,
      );
      router.push("/admin/products");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save product";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const uploadMediaFile = async (file: File, kind: "image" | "video") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || `Failed to upload ${kind}`);
    }

    return result.data as { url: string };
  };

  const handleImagesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      setFieldErrors((prev) => ({
        ...prev,
        images: "Maximum 5 images allowed",
      }));
      return;
    }

    setUploadingImage(true);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error("Only image files are allowed in photo upload");
          }
          const media = await uploadMediaFile(file, "image");
          return {
            url: media.url,
            alt: file.name.replace(/\.[^.]+$/, ""),
            isPrimary: false,
          } as UploadedMedia;
        }),
      );

      setImages((prev) => {
        const merged = [...prev, ...uploaded].slice(0, 5);
        return merged.map((item, index) => ({
          ...item,
          isPrimary: index === 0,
        }));
      });
      toast.success("Image upload complete");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload images",
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isVideoMime = file.type.startsWith("video/");
    const isVideoExtension = acceptedVideoExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (!isVideoMime && !isVideoExtension) {
      const message =
        "Please upload a valid video file (mp4/webm/ogg/mov/m4v/3gp)";
      setError(message);
      toast.error(message);
      return;
    }

    setUploadingVideo(true);
    try {
      const uploaded = await uploadMediaFile(file, "video");
      setVideo({
        url: uploaded.url,
        alt: `${name.trim() || "Product"} preview video`,
      });
      setError(null);
      toast.success("Video upload complete");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload video";
      setError(message);
      toast.error(message);
    } finally {
      setUploadingVideo(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEditMode ? "Edit Product" : "Create New Product"}
        </h1>
        <p className="mt-1 text-sm text-secondary-600">
          {isEditMode
            ? "Update pricing, media, variants, and publishing status."
            : "Add a product with pricing, media, variants, and inventory details."}
        </p>
      </div>

      {isEditMode && loadingProduct && (
        <Card className="border-[#285A48]/20 bg-white/90">
          <CardContent className="py-8 text-sm text-secondary-600">
            Loading product details...
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-[#285A48]/20 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#285A48]" /> Core Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input
              label="Product Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            {fieldErrors.name && (
              <p className="-mt-2 text-sm text-red-600">{fieldErrors.name}</p>
            )}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Category{requiredMark}
              </label>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-left text-sm text-[#091413] transition-all hover:border-[#408A71]"
                disabled={loadingCategories}
                onClick={() => setCategoryPickerOpen((prev) => !prev)}
              >
                <span className="truncate">
                  {loadingCategories ? "Loading categories..." : selectedCategoryName}
                </span>
                <ChevronRight
                  className={`h-4 w-4 text-[#285A48] transition-transform ${categoryPickerOpen ? "rotate-90" : ""}`}
                />
              </button>
              {categoryPickerOpen && !loadingCategories && (
                <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-[#B0E4CC]/50 bg-white p-3 shadow-2xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#285A48]/60" />
                    <input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder="Search category"
                      className="h-10 w-full rounded-lg border border-[#B0E4CC] bg-[#f7fff9] pl-9 pr-3 text-sm text-[#091413] outline-none focus:border-[#408A71]"
                    />
                  </div>

                  <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
                    {categoryOptions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${selectedCategoryId === item._id ? "bg-[#285A48]/10 font-semibold text-[#285A48]" : "hover:bg-[#f3fbf6]"}`}
                        style={{ paddingLeft: `${item.depth * 16 + 12}px` }}
                        onClick={() => {
                          setSelectedCategoryId(item._id);
                          setCategoryPickerOpen(false);
                        }}
                      >
                        {item.depth > 0 && <span className="mr-2 text-[#285A48]/40">└</span>}
                        <div className="min-w-0">
                          <p className="truncate">{item.name}</p>
                          <p className="truncate text-xs text-secondary-500">{item.path}</p>
                        </div>
                      </button>
                    ))}
                    {!categoryOptions.length && (
                      <p className="px-3 py-4 text-sm text-secondary-500">No matching categories found.</p>
                    )}
                  </div>
                </div>
              )}
              {fieldErrors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            <Input
              label="Brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
            <Input
              label="Base Price (BDT)*"
              type="number"
              min={0}
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
            />
            {fieldErrors.basePrice && (
              <p className="-mt-2 text-sm text-red-600">
                {fieldErrors.basePrice}
              </p>
            )}

            <Input
              label="Sale Price (BDT)"
              type="number"
              min={0}
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
            />
            <Input
              label="Tags (comma separated)"
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Short Description{requiredMark}
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                required
              />
              {fieldErrors.shortDescription && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.shortDescription}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Full Description{requiredMark}
              </label>
              <textarea
                className="min-h-[140px] w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#285A48]/20 bg-white/90">
          <CardHeader>
            <CardTitle>Media + Specifications (5 photos + 1 video)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Product Photos{requiredMark}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImagesUpload}
                className="w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
              />
              <p className="mt-1 text-xs text-secondary-500">
                Upload up to 5 images. First image becomes primary.
              </p>
              {fieldErrors.images && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.images}
                </p>
              )}
              {uploadingImage && (
                <p className="mt-1 text-sm text-secondary-600">
                  Uploading images...
                </p>
              )}

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {images.map((item, index) => (
                    <div
                      key={item.url}
                      className="relative overflow-hidden rounded-lg border border-secondary-200"
                    >
                      <Image
                        src={item.url}
                        alt={item.alt}
                        width={200}
                        height={160}
                        className="h-20 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            prev
                              .filter((_, i) => i !== index)
                              .map((m, i) => ({ ...m, isPrimary: i === 0 })),
                          )
                        }
                        className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-xs text-white"
                      >
                        x
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-primary-600 px-1 py-0.5 text-[10px] text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Product Video (optional)
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,video/3gpp,.mov,.m4v,.3gp"
                onChange={handleVideoUpload}
                className="w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
              />
              <p className="mt-1 text-xs text-secondary-500">
                Upload one video only.
              </p>
              {uploadingVideo && (
                <p className="mt-1 text-sm text-secondary-600">
                  Uploading video...
                </p>
              )}
              {video?.url && (
                <div className="mt-3 rounded-lg border border-secondary-200 p-2">
                  <video controls className="h-28 w-full rounded object-cover">
                    <source src={video.url} />
                  </video>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-red-600"
                    onClick={() => setVideo(null)}
                  >
                    <Trash2 className="h-3 w-3" /> Remove video
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Specifications (one per line: key:value)
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
                value={specText}
                onChange={(event) => setSpecText(event.target.value)}
                placeholder={
                  "Material:Cotton 100%\nFit:Regular\nMade In:Bangladesh"
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#285A48]/20 bg-white/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variants</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="rounded-xl border border-secondary-100 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-secondary-900">
                    Variant {index + 1}
                  </p>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="rounded-md p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label="SKU"
                    value={variant.sku}
                    onChange={(event) =>
                      updateVariant(index, "sku", event.target.value)
                    }
                    required
                  />
                  {fieldErrors[`variant-${index}-sku`] && (
                    <p className="-mt-2 text-sm text-red-600">
                      {fieldErrors[`variant-${index}-sku`]}
                    </p>
                  )}
                  <Input
                    label="Size"
                    value={variant.size}
                    onChange={(event) =>
                      updateVariant(index, "size", event.target.value)
                    }
                    required
                  />
                  {fieldErrors[`variant-${index}-size`] && (
                    <p className="-mt-2 text-sm text-red-600">
                      {fieldErrors[`variant-${index}-size`]}
                    </p>
                  )}
                  <Input
                    label="Color"
                    value={variant.color}
                    onChange={(event) =>
                      updateVariant(index, "color", event.target.value)
                    }
                    required
                  />
                  {fieldErrors[`variant-${index}-color`] && (
                    <p className="-mt-2 text-sm text-red-600">
                      {fieldErrors[`variant-${index}-color`]}
                    </p>
                  )}
                  <Input
                    label="Color Code"
                    value={variant.colorCode}
                    onChange={(event) =>
                      updateVariant(index, "colorCode", event.target.value)
                    }
                    required
                  />
                  {fieldErrors[`variant-${index}-colorCode`] && (
                    <p className="-mt-2 text-sm text-red-600">
                      {fieldErrors[`variant-${index}-colorCode`]}
                    </p>
                  )}
                  <Input
                    label="Stock"
                    type="number"
                    min={0}
                    value={variant.stock}
                    onChange={(event) =>
                      updateVariant(index, "stock", event.target.value)
                    }
                    required
                  />
                  {fieldErrors[`variant-${index}-stock`] && (
                    <p className="-mt-2 text-sm text-red-600">
                      {fieldErrors[`variant-${index}-stock`]}
                    </p>
                  )}
                  <Input
                    label="Variant Price (optional)"
                    type="number"
                    min={0}
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(index, "price", event.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#285A48]/20 bg-white/90">
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-secondary-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-secondary-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                Featured
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-secondary-700">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(event) => setIsNew(event.target.checked)}
                />
                Mark as New
              </label>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                disabled={
                  submitting ||
                  uploadingImage ||
                  uploadingVideo ||
                  (isEditMode && loadingProduct)
                }
              >
                {isEditMode ? "Update Product" : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/products")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
