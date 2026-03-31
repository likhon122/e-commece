import connectDB from "@/lib/db/connection";
import { Category } from "@/lib/db/models";
import type { ICategory } from "@/types";
import { unstable_noStore as noStore } from "next/cache";

export interface CategoryWithChildren extends ICategory {
  children?: CategoryWithChildren[];
}

export interface CategoriesResult {
  success: boolean;
  data: CategoryWithChildren[];
  error?: string;
}

export interface SingleCategoryResult {
  success: boolean;
  data: CategoryWithChildren | null;
  error?: string;
}

/**
 * Fetch all categories with their children (tree structure)
 * Server-side only - uses direct database connection
 */
export async function getCategories(): Promise<CategoriesResult> {
  try {
    // Always fetch latest category tree after admin changes.
    noStore();

    await connectDB();

    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const byParent = new Map<string | null, typeof categories>();
    for (const category of categories) {
      const parentId = category.parent?.toString() || null;
      const current = byParent.get(parentId) || [];
      current.push(category);
      byParent.set(parentId, current);
    }

    const buildTree = (parentId: string | null): CategoryWithChildren[] => {
      const children = byParent.get(parentId) || [];

      return children.map((cat) => {
        const nodeId = cat._id.toString();
        return {
          ...cat,
          _id: nodeId,
          parent: cat.parent?.toString() || null,
          children: buildTree(nodeId),
        } as CategoryWithChildren;
      });
    };

    const categoryTree = buildTree(null);

    return {
      success: true,
      data: categoryTree,
    };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

/**
 * Fetch parent categories only (no children included in result)
 */
export async function getParentCategories(): Promise<CategoriesResult> {
  try {
    noStore();

    await connectDB();

    const categories = await Category.find({
      isActive: true,
      parent: null,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return {
      success: true,
      data: categories.map((cat) => ({
        ...cat,
        _id: cat._id.toString(),
      })) as unknown as CategoryWithChildren[],
    };
  } catch (error) {
    console.error("Failed to fetch parent categories:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

/**
 * Fetch a single category by slug with its children
 */
export async function getCategoryBySlug(
  slug: string,
): Promise<SingleCategoryResult> {
  try {
    noStore();

    await connectDB();

    const category = await Category.findOne({ slug, isActive: true })
      .populate({
        path: "children",
        match: { isActive: true },
        select: "name slug image productCount description",
        options: { sort: { sortOrder: 1 } },
      })
      .lean();

    if (!category) {
      return {
        success: false,
        data: null,
        error: "Category not found",
      };
    }

    return {
      success: true,
      data: {
        ...category,
        _id: category._id.toString(),
        parent: category.parent?.toString() || null,
        children: category.children?.map((child: any) => ({
          ...child,
          _id: child._id.toString(),
        })),
      } as CategoryWithChildren,
    };
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch category",
    };
  }
}

/**
 * Get subcategories for a parent category
 */
export async function getSubcategories(
  parentSlug: string,
): Promise<CategoriesResult> {
  try {
    noStore();

    await connectDB();

    const parentCategory = await Category.findOne({
      slug: parentSlug,
      isActive: true,
    });

    if (!parentCategory) {
      return {
        success: false,
        data: [],
        error: "Parent category not found",
      };
    }

    const subcategories = await Category.find({
      parent: parentCategory._id,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return {
      success: true,
      data: subcategories.map((cat) => ({
        ...cat,
        _id: cat._id.toString(),
        parent: cat.parent?.toString(),
      })) as unknown as CategoryWithChildren[],
    };
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch subcategories",
    };
  }
}

/**
 * Get category breadcrumb path
 */
export async function getCategoryBreadcrumb(
  categorySlug: string,
  subcategorySlug?: string,
): Promise<{
  category: CategoryWithChildren | null;
  subcategory: CategoryWithChildren | null;
}> {
  try {
    noStore();

    await connectDB();

    const category = await Category.findOne({
      slug: categorySlug,
      isActive: true,
    }).lean();

    let subcategory = null;
    if (subcategorySlug) {
      subcategory = await Category.findOne({
        slug: subcategorySlug,
        isActive: true,
      }).lean();
    }

    return {
      category: category
        ? ({
            ...category,
            _id: category._id.toString(),
          } as unknown as CategoryWithChildren)
        : null,
      subcategory: subcategory
        ? ({
            ...subcategory,
            _id: subcategory._id.toString(),
          } as unknown as CategoryWithChildren)
        : null,
    };
  } catch (error) {
    console.error("Failed to fetch breadcrumb:", error);
    return { category: null, subcategory: null };
  }
}
