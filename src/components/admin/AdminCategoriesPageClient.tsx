"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
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
import { fetchJson } from "./utils";

type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  children?: CategoryNode[];
};

type CategoryTreeResponse = {
  success: boolean;
  data: CategoryNode[];
};

type AdminCategoryListResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    description?: string;
    image?: string;
    parent?: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
};

function CategoryItem({
  node,
  level = 0,
  onEdit,
  onDelete,
}: {
  node: CategoryNode;
  level?: number;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
}) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[#B0E4CC]/50 bg-gradient-to-r from-white to-[#f3fbf6] p-4 shadow-[0_10px_35px_-20px_rgba(40,90,72,0.45)]"
        style={{ marginLeft: level * 22 }}
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#285A48] to-[#8ad4ad]" />
        <div className="flex flex-wrap items-center justify-between gap-3 pl-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-secondary-900">{node.name}</p>
              {hasChildren && (
                <span className="rounded-full bg-[#285A48]/10 px-2 py-0.5 text-xs font-semibold text-[#285A48]">
                  {node.children?.length} child
                  {(node.children?.length || 0) > 1 ? "ren" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-500">/{node.slug}</p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#285A48]/60">
            L{level + 1}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-2">
          <Badge variant={node.isActive ? "success" : "danger"}>
            {node.isActive ? "active" : "inactive"}
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onEdit(node._id)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-red-600"
              onClick={() => onDelete(node._id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
      {node.children?.map((child) => (
        <CategoryItem
          key={child._id}
          node={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function AdminCategoriesPageClient() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<
    Array<{
      _id: string;
      name: string;
      description?: string;
      image?: string;
      parent?: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const collectDescendantIds = (
    nodes: CategoryNode[],
    targetId: string,
  ): string[] => {
    const walk = (items: CategoryNode[], collect: boolean): string[] => {
      const ids: string[] = [];

      for (const item of items) {
        const shouldCollect = collect || item._id === targetId;
        if (shouldCollect && item._id !== targetId) {
          ids.push(item._id);
        }
        if (item.children?.length) {
          ids.push(...walk(item.children, shouldCollect));
        }
      }

      return ids;
    };

    return walk(nodes, false);
  };

  const parentOptions = useMemo(() => {
    const blocked = new Set<string>();
    if (editingCategoryId) {
      blocked.add(editingCategoryId);
      for (const id of collectDescendantIds(categories, editingCategoryId)) {
        blocked.add(id);
      }
    }

    const rows: Array<{ _id: string; label: string; depth: number }> = [];
    const build = (nodes: CategoryNode[], depth: number) => {
      for (const node of nodes) {
        if (!blocked.has(node._id)) {
          rows.push({ _id: node._id, label: node.name, depth });
        }
        if (node.children?.length) {
          build(node.children, depth + 1);
        }
      }
    };

    build(categories, 0);

    const keyword = parentSearch.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => row.label.toLowerCase().includes(keyword));
  }, [categories, editingCategoryId, parentSearch]);

  const selectedParentName = useMemo(() => {
    if (!parent) return "No parent (Root category)";
    const selected = flatCategories.find((item) => item._id === parent);
    return selected?.name || "Parent selected";
  }, [flatCategories, parent]);

  const loadCategories = async () => {
    const payload = await fetchJson<CategoryTreeResponse>(
      "/api/categories?tree=true",
    );
    setCategories(payload.data || []);
  };

  const loadFlatCategories = async () => {
    const payload = await fetchJson<AdminCategoryListResponse>(
      "/api/admin/categories",
    );
    setFlatCategories(payload.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([loadCategories(), loadFlatCategories()]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch categories",
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setParent("");
    setImage("");
    setSortOrder("0");
    setIsActive(true);
    setEditingCategoryId(null);
    setParentPickerOpen(false);
    setParentSearch("");
  };

  const handleSubmitCategory = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint = editingCategoryId
        ? `/api/admin/categories/${editingCategoryId}`
        : "/api/admin/categories";

      const response = await fetch(endpoint, {
        method: editingCategoryId ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          image: image.trim() || undefined,
          parent: parent || undefined,
          sortOrder: Number(sortOrder || 0),
          isActive,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const fieldErrors = payload?.errors
          ? Object.values(payload.errors).flat().join(" ")
          : "";
        throw new Error(
          [
            payload?.error ||
              `Failed to ${editingCategoryId ? "update" : "create"} category`,
            fieldErrors,
          ]
            .filter(Boolean)
            .join(" "),
        );
      }

      setSuccessMessage(
        editingCategoryId
          ? "Category updated successfully."
          : "Category created successfully.",
      );
      resetForm();

      await Promise.all([loadCategories(), loadFlatCategories()]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    const selected = flatCategories.find((item) => item._id === categoryId);
    if (!selected) {
      setSubmitError(
        "Category details not found. Please refresh and try again.",
      );
      return;
    }

    setEditingCategoryId(selected._id);
    setName(selected.name || "");
    setDescription(selected.description || "");
    setImage(selected.image || "");
    setParent(selected.parent || "");
    setSortOrder(String(selected.sortOrder ?? 0));
    setIsActive(Boolean(selected.isActive));
    setParentPickerOpen(false);
    setParentSearch("");
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setSubmitError(null);
    setSuccessMessage(null);

    const confirmed = window.confirm(
      "Delete this category? This will fail if products or child categories exist.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete category");
      }

      if (editingCategoryId === categoryId) {
        resetForm();
      }

      setSuccessMessage("Category deleted successfully.");
      await Promise.all([loadCategories(), loadFlatCategories()]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#285A48]/20 bg-gradient-to-br from-white via-[#f7fff9] to-[#ecf9f2] p-6">
        <h1 className="text-2xl font-bold text-secondary-900">
          Category Architecture
        </h1>
        <p className="mt-1 text-sm text-secondary-600">
          Structured category tree for your storefront taxonomy.
        </p>
      </div>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />{" "}
            {editingCategoryId ? "Edit Category" : "Create Category"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmitCategory}
            className="grid gap-4 md:grid-cols-2"
          >
            <Input
              label="Category Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Parent Category
              </label>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-[#B0E4CC] bg-white px-4 text-left text-sm text-[#091413] transition-all hover:border-[#408A71]"
                onClick={() => setParentPickerOpen((prev) => !prev)}
              >
                <span className="truncate">{selectedParentName}</span>
                <ChevronRight
                  className={`h-4 w-4 text-[#285A48] transition-transform ${parentPickerOpen ? "rotate-90" : ""}`}
                />
              </button>
              {parentPickerOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-[#B0E4CC]/50 bg-white p-3 shadow-2xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#285A48]/60" />
                    <input
                      value={parentSearch}
                      onChange={(event) => setParentSearch(event.target.value)}
                      placeholder="Search parent category"
                      className="h-10 w-full rounded-lg border border-[#B0E4CC] bg-[#f7fff9] pl-9 pr-3 text-sm text-[#091413] outline-none focus:border-[#408A71]"
                    />
                  </div>

                  <div className="mt-3 max-h-60 space-y-1 overflow-y-auto pr-1">
                    <button
                      type="button"
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${!parent ? "bg-[#285A48]/10 font-semibold text-[#285A48]" : "hover:bg-[#f3fbf6]"}`}
                      onClick={() => {
                        setParent("");
                        setParentPickerOpen(false);
                      }}
                    >
                      No parent (Root category)
                    </button>

                    {parentOptions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${parent === item._id ? "bg-[#285A48]/10 font-semibold text-[#285A48]" : "hover:bg-[#f3fbf6]"}`}
                        style={{ paddingLeft: `${item.depth * 16 + 12}px` }}
                        onClick={() => {
                          setParent(item._id);
                          setParentPickerOpen(false);
                        }}
                      >
                        {item.depth > 0 && (
                          <span className="mr-2 text-[#285A48]/40">└</span>
                        )}
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}

                    {!parentOptions.length && (
                      <p className="px-3 py-4 text-sm text-secondary-500">
                        No matching categories found.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Image URL (optional)"
              value={image}
              onChange={(event) => setImage(event.target.value)}
            />

            <Input
              label="Sort Order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#091413]">
                Description (optional)
              </label>
              <textarea
                className="min-h-[110px] w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-secondary-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Active
              </label>
            </div>

            {submitError && (
              <p className="md:col-span-2 text-sm text-red-600">
                {submitError}
              </p>
            )}
            {successMessage && (
              <p className="md:col-span-2 text-sm text-green-700">
                {successMessage}
              </p>
            )}

            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  {editingCategoryId ? "Update Category" : "Create Category"}
                </Button>
                {editingCategoryId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
            {editingCategoryId && (
              <div className="md:col-span-2">
                <p className="text-xs text-secondary-500">
                  Editing category ID: {editingCategoryId}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#285A48]/20 bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#285A48]" /> Category Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-secondary-600">Loading categories...</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="rounded-2xl border border-[#B0E4CC]/40 bg-gradient-to-b from-[#fbfffc] to-[#f4fbf7] p-4">
              <div className="mb-4 flex items-center justify-between rounded-xl bg-white/70 p-3 shadow-sm">
                <p className="text-sm font-semibold text-[#285A48]">
                  Premium Category Showcase
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#285A48]/60">
                  {categories.length} root nodes
                </p>
              </div>
              <div className="space-y-3">
                {categories.map((category) => (
                  <CategoryItem
                    key={category._id}
                    node={category}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))}
                {!categories.length && (
                  <div className="rounded-xl border border-dashed border-secondary-300 p-8 text-center text-secondary-500">
                    <FolderTree className="mx-auto mb-3 h-5 w-5" />
                    No categories found.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
