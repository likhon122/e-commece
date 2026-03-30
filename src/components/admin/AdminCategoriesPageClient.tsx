"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderTree,
  GitBranch,
  Layers,
  Minus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
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
import { fetchJson } from "./utils";

type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  image?: string;
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

function VisualTreeNode({
  node,
  level = 0,
  isLast = false,
  parentLines = [],
  onEdit,
  onDelete,
  expandedNodes,
  toggleExpand,
}: {
  node: CategoryNode;
  level?: number;
  isLast?: boolean;
  parentLines?: boolean[];
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = expandedNodes.has(node._id);
  const childCount = node.children?.length || 0;

  // Colors based on depth
  const depthColors = [
    { bg: "from-emerald-500 to-teal-500", border: "border-emerald-200", glow: "shadow-emerald-200/50" },
    { bg: "from-blue-500 to-indigo-500", border: "border-blue-200", glow: "shadow-blue-200/50" },
    { bg: "from-violet-500 to-purple-500", border: "border-violet-200", glow: "shadow-violet-200/50" },
    { bg: "from-amber-500 to-orange-500", border: "border-amber-200", glow: "shadow-amber-200/50" },
    { bg: "from-rose-500 to-pink-500", border: "border-rose-200", glow: "shadow-rose-200/50" },
  ];
  const colorScheme = depthColors[level % depthColors.length];

  return (
    <div className="relative">
      {/* Vertical connection lines from parents */}
      {level > 0 && (
        <div className="absolute left-0 top-0 flex h-full" style={{ width: `${level * 40}px` }}>
          {parentLines.map((showLine, idx) => (
            <div key={idx} className="relative w-10">
              {showLine && (
                <div className="absolute left-5 h-full w-0.5 bg-gradient-to-b from-[#B0E4CC] to-[#B0E4CC]/30" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Horizontal connector line */}
      {level > 0 && (
        <div
          className="absolute top-8"
          style={{ left: `${(level - 1) * 40 + 20}px`, width: "20px" }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-[#B0E4CC] to-[#408A71]" />
          {/* Corner piece */}
          <div className="absolute -top-4 left-0 h-4 w-0.5 bg-[#B0E4CC]" />
        </div>
      )}

      {/* Node Content */}
      <div
        className="group relative mb-3 transition-all duration-300"
        style={{ marginLeft: `${level * 40}px` }}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border-2 ${colorScheme.border} bg-white p-4 shadow-lg ${colorScheme.glow} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
        >
          {/* Gradient indicator */}
          <div className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${colorScheme.bg}`} />

          <div className="flex items-center gap-4 pl-3">
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node._id)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${colorScheme.bg} text-white shadow-md transition-transform hover:scale-110`}
              >
                {isExpanded ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${colorScheme.bg} text-white shadow-md`}>
                <Layers className="h-4 w-4" />
              </div>
            )}

            {/* Category Image */}
            {node.image ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-sm">
                <Image src={node.image} alt={node.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-50">
                <FolderTree className="h-5 w-5 text-secondary-400" />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-secondary-900">{node.name}</h3>
                {hasChildren && (
                  <span className={`rounded-full bg-gradient-to-r ${colorScheme.bg} px-2 py-0.5 text-[10px] font-bold text-white`}>
                    {childCount} {childCount === 1 ? "child" : "children"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-secondary-500">/{node.slug}</p>
            </div>

            {/* Level Badge */}
            <div className={`rounded-xl bg-gradient-to-br ${colorScheme.bg} px-3 py-1.5 text-xs font-bold text-white shadow-md`}>
              Level {level + 1}
            </div>

            {/* Status */}
            <Badge variant={node.isActive ? "success" : "danger"}>
              {node.isActive ? "Active" : "Inactive"}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => onEdit(node._id)}
                className="rounded-lg bg-secondary-100 p-2 text-secondary-600 transition-all hover:bg-[#285A48] hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(node._id)}
                className="rounded-lg bg-secondary-100 p-2 text-secondary-600 transition-all hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children?.map((child, index) => (
            <VisualTreeNode
              key={child._id}
              node={child}
              level={level + 1}
              isLast={index === (node.children?.length || 0) - 1}
              parentLines={[...parentLines, !isLast]}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parent, setParent] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Calculate stats
  const stats = useMemo(() => {
    const countNodes = (nodes: CategoryNode[]): number => {
      return nodes.reduce((sum, node) => {
        return sum + 1 + (node.children ? countNodes(node.children) : 0);
      }, 0);
    };
    const total = countNodes(categories);
    const rootCount = categories.length;
    const activeCount = flatCategories.filter((c) => c.isActive).length;
    const maxDepth = (nodes: CategoryNode[], depth = 1): number => {
      return Math.max(depth, ...nodes.map((n) => (n.children?.length ? maxDepth(n.children, depth + 1) : depth)));
    };
    const depth = categories.length ? maxDepth(categories) : 0;
    return { total, rootCount, activeCount, depth };
  }, [categories, flatCategories]);

  const collectDescendantIds = (nodes: CategoryNode[], targetId: string): string[] => {
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
    const payload = await fetchJson<CategoryTreeResponse>("/api/categories?tree=true");
    setCategories(payload.data || []);
  };

  const loadFlatCategories = async () => {
    const payload = await fetchJson<AdminCategoryListResponse>("/api/admin/categories");
    setFlatCategories(payload.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([loadCategories(), loadFlatCategories()]);
        // Expand all by default
        const allIds = new Set<string>();
        const collectIds = (nodes: CategoryNode[]) => {
          nodes.forEach((n) => {
            allIds.add(n._id);
            if (n.children) collectIds(n.children);
          });
        };
        collectIds(categories);
        setExpandedNodes(allIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // Expand all nodes when categories load
  useEffect(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n._id);
        if (n.children) collectIds(n.children);
      });
    };
    collectIds(categories);
    setExpandedNodes(allIds);
  }, [categories]);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n._id);
        if (n.children) collectIds(n.children);
      });
    };
    collectIds(categories);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

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
    setShowForm(false);
  };

  const handleSubmitCategory = async (event: React.FormEvent<HTMLFormElement>) => {
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
        headers: { "Content-Type": "application/json" },
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
      const payload = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        const fieldErrors = payload?.errors ? Object.values(payload.errors).flat().join(" ") : "";
        throw new Error(
          [
            payload?.error || `Failed to ${editingCategoryId ? "update" : "create"} category`,
            fieldErrors,
          ]
            .filter(Boolean)
            .join(" ")
        );
      }

      setSuccessMessage(editingCategoryId ? "Category updated successfully." : "Category created successfully.");
      resetForm();

      await Promise.all([loadCategories(), loadFlatCategories()]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    const selected = flatCategories.find((item) => item._id === categoryId);
    if (!selected) {
      setSubmitError("Category details not found. Please refresh and try again.");
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
    setShowForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setSubmitError(null);
    setSuccessMessage(null);

    const confirmed = window.confirm(
      "Delete this category? This will fail if products or child categories exist."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete category");
      }

      if (editingCategoryId === categoryId) {
        resetForm();
      }

      setSuccessMessage("Category deleted successfully.");
      await Promise.all([loadCategories(), loadFlatCategories()]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to delete category");
    }
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
                  <GitBranch className="h-6 w-6 text-white" />
                </div>
                Category Architecture
              </h1>
              <p className="mt-2 text-sm text-secondary-600">
                Visual hierarchy tree for your storefront taxonomy
              </p>
            </div>
            <Button
              variant="primary"
              className="gap-2 rounded-xl shadow-lg"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#285A48]/10 bg-gradient-to-br from-white to-[#f7fff9] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Total</p>
                <FolderTree className="h-4 w-4 text-[#285A48]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Root</p>
                <Layers className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.rootCount}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Active</p>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">{stats.activeCount}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Max Depth</p>
                <GitBranch className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-violet-700">{stats.depth} levels</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-secondary-100 pb-4">
              <CardTitle className="flex items-center gap-2">
                {editingCategoryId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingCategoryId ? "Edit Category" : "Create New Category"}
              </CardTitle>
              <button
                onClick={resetForm}
                className="rounded-lg p-2 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitCategory} className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Category Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-[#091413]">Parent Category</label>
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
                            {item.depth > 0 && <span className="mr-2 text-[#285A48]/40">└</span>}
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}

                        {!parentOptions.length && (
                          <p className="px-3 py-4 text-sm text-secondary-500">No matching categories found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Image URL (optional)"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />

                <Input
                  label="Sort Order"
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#091413]">Description (optional)</label>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border-2 border-[#B0E4CC] bg-white px-4 py-3 text-sm transition-colors focus:border-[#408A71] focus:outline-none"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-4">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) => setIsActive(event.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-secondary-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-secondary-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#285A48] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#285A48]/20" />
                    <span className="ml-3 text-sm font-medium text-secondary-700">Active</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="rounded-xl">
                    {editingCategoryId ? "Update Category" : "Create Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Category Tree */}
        <Card className="border-0 bg-white/90 shadow-[0_8px_32px_-8px_rgba(40,90,72,0.12)] backdrop-blur-xl">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-secondary-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-[#285A48]" />
              Visual Category Tree
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5 rounded-xl text-xs">
                <Plus className="h-3.5 w-3.5" /> Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5 rounded-xl text-xs">
                <Minus className="h-3.5 w-3.5" /> Collapse All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading && (
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="text-center">
                  <div className="relative mx-auto h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-[#B0E4CC]" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#285A48]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-secondary-600">Loading category tree...</p>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && (
              <div className="min-h-[200px] rounded-2xl border border-[#B0E4CC]/30 bg-gradient-to-b from-[#fbfffc] to-[#f4fbf7] p-6">
                {categories.length > 0 ? (
                  <div className="space-y-1">
                    {categories.map((category, index) => (
                      <VisualTreeNode
                        key={category._id}
                        node={category}
                        isLast={index === categories.length - 1}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        expandedNodes={expandedNodes}
                        toggleExpand={toggleExpand}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
                      <FolderTree className="h-8 w-8 text-secondary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900">No categories yet</h3>
                    <p className="mt-1 text-sm text-secondary-500">Create your first category to build your taxonomy</p>
                    <Button
                      variant="primary"
                      className="mt-4 gap-2"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
