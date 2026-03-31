import connectDB from "@/lib/db/connection";
import { Product, Category } from "@/lib/db/models";
import type { IProduct } from "@/types";
import { Types } from "mongoose";

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  minRating?: number;
  inStock?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResult {
  success: boolean;
  data: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface SingleProductResult {
  success: boolean;
  data: IProduct | null;
  error?: string;
}

export interface ProductFacets {
  priceRange: { minPrice: number; maxPrice: number };
  sizes: string[];
  colors: { name: string; code: string }[];
  tags: string[];
}

/**
 * Fetch products with advanced filtering - Server-side
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
  try {
    await connectDB();

    const {
      category,
      subcategory,
      categories,
      minPrice,
      maxPrice,
      sizes = [],
      colors = [],
      tags = [],
      search,
      featured,
      isNew,
      onSale,
      minRating,
      inStock,
      sortBy = "newest",
      page = 1,
      limit = 12,
    } = filters;

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    const andConditions: Record<string, unknown>[] = [];

    const allCategories = await Category.find({ isActive: true })
      .select("_id parent")
      .lean();

    const childrenByParent = new Map<string, Types.ObjectId[]>();
    for (const item of allCategories) {
      const parentId = item.parent ? item.parent.toString() : null;
      if (!parentId) continue;

      const current = childrenByParent.get(parentId) || [];
      current.push(item._id as Types.ObjectId);
      childrenByParent.set(parentId, current);
    }

    const collectDescendants = (rootId: Types.ObjectId): Types.ObjectId[] => {
      const visited = new Set<string>();
      const queue: Types.ObjectId[] = [rootId];
      const result: Types.ObjectId[] = [];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const key = current.toString();
        if (visited.has(key)) continue;
        visited.add(key);
        result.push(current);

        const children = childrenByParent.get(key) || [];
        for (const child of children) {
          if (!visited.has(child.toString())) {
            queue.push(child);
          }
        }
      }

      return result;
    };

    // Category filtering
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        const categoryTreeIds = collectDescendants(categoryDoc._id);
        andConditions.push({
          $or: [
            { category: { $in: categoryTreeIds } },
            { subcategory: { $in: categoryTreeIds } },
          ],
        });
      }
    } else if (categories && categories.length > 0) {
      const categoryDocs = await Category.find({ slug: { $in: categories } });
      if (categoryDocs.length > 0) {
        const categoryTreeIds = categoryDocs
          .map((entry) => collectDescendants(entry._id))
          .flat();

        andConditions.push({
          $or: [
            { category: { $in: categoryTreeIds } },
            { subcategory: { $in: categoryTreeIds } },
          ],
        });
      }
    }

    // Subcategory filtering
    if (subcategory) {
      const subcategoryDoc = await Category.findOne({ slug: subcategory });
      if (subcategoryDoc) {
        const subcategoryTreeIds = collectDescendants(subcategoryDoc._id);
        andConditions.push({
          $or: [
            { subcategory: { $in: subcategoryTreeIds } },
            { category: { $in: subcategoryTreeIds } },
          ],
        });
      }
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;

      andConditions.push({
        $or: [
          { salePrice: priceFilter },
          { salePrice: { $exists: false }, basePrice: priceFilter },
          { salePrice: null, basePrice: priceFilter },
        ],
      });
    }

    // Size filtering
    if (sizes.length > 0) {
      query["variants.size"] = { $in: sizes };
    }

    // Color filtering
    if (colors.length > 0) {
      query["variants.color"] = { $in: colors.map((c) => new RegExp(`^${c}$`, "i")) };
    }

    // Tags filtering
    if (tags.length > 0) {
      query.tags = { $in: tags.map((t) => new RegExp(t, "i")) };
    }

    // Featured products
    if (featured) {
      query.isFeatured = true;
    }

    // New arrivals
    if (isNew) {
      query.isNew = true;
    }

    // On sale
    if (onSale) {
      andConditions.push({
        salePrice: { $exists: true, $ne: null },
        $expr: { $lt: ["$salePrice", "$basePrice"] },
      });
    }

    // Minimum rating
    if (minRating !== undefined) {
      query["ratings.average"] = { $gte: minRating };
    }

    // In stock
    if (inStock) {
      query["variants.stock"] = { $gt: 0 };
    }

    // Text search
    if (search) {
      const searchRegex = new RegExp(search.split(/\s+/).join("|"), "i");
      andConditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { tags: searchRegex },
        ],
      });
    }

    // Combine AND conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Sort options
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortBy) {
      case "price_asc":
        sort = { salePrice: 1, basePrice: 1 };
        break;
      case "price_desc":
        sort = { salePrice: -1, basePrice: -1 };
        break;
      case "popularity":
        sort = { soldCount: -1, viewCount: -1 };
        break;
      case "rating":
        sort = { "ratings.average": -1 };
        break;
      case "name_asc":
        sort = { name: 1 };
        break;
      case "name_desc":
        sort = { name: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: products.map((p) => ({
        ...p,
        _id: p._id.toString(),
        category: p.category ? { ...p.category, _id: p.category._id?.toString() } : null,
        subcategory: p.subcategory ? { ...p.subcategory, _id: p.subcategory._id?.toString() } : null,
      })) as unknown as IProduct[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      success: false,
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
      error: error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<SingleProductResult> {
  try {
    await connectDB();

    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    if (!product) {
      return {
        success: false,
        data: null,
        error: "Product not found",
      };
    }

    // Increment view count
    await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

    return {
      success: true,
      data: {
        ...product,
        _id: product._id.toString(),
      } as unknown as IProduct,
    };
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch product",
    };
  }
}

/**
 * Get product facets for filtering
 */
export async function getProductFacets(categorySlug?: string): Promise<ProductFacets> {
  try {
    await connectDB();

    const matchStage: Record<string, unknown> = { isActive: true };

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (category) {
        matchStage.$or = [
          { category: category._id },
          { subcategory: category._id },
        ];
      }
    }

    const facets = await Product.aggregate([
      { $match: matchStage },
      {
        $facet: {
          priceRange: [
            {
              $group: {
                _id: null,
                minPrice: { $min: { $ifNull: ["$salePrice", "$basePrice"] } },
                maxPrice: { $max: { $ifNull: ["$salePrice", "$basePrice"] } },
              },
            },
          ],
          sizes: [
            { $unwind: "$variants" },
            { $group: { _id: "$variants.size" } },
            { $sort: { _id: 1 } },
          ],
          colors: [
            { $unwind: "$variants" },
            { $group: { _id: "$variants.color", colorCode: { $first: "$variants.colorCode" } } },
            { $sort: { _id: 1 } },
          ],
          tags: [
            { $unwind: "$tags" },
            { $group: { _id: "$tags" } },
            { $sort: { _id: 1 } },
            { $limit: 50 },
          ],
        },
      },
    ]);

    const result = facets[0];
    return {
      priceRange: result?.priceRange[0] || { minPrice: 0, maxPrice: 10000 },
      sizes: result?.sizes.map((s: { _id: string }) => s._id).filter(Boolean) || [],
      colors: result?.colors
        .filter((c: { _id: string }) => c._id)
        .map((c: { _id: string; colorCode?: string }) => ({
          name: c._id,
          code: c.colorCode || "#000000",
        })) || [],
      tags: result?.tags.map((t: { _id: string }) => t._id).filter(Boolean) || [],
    };
  } catch (error) {
    console.error("Failed to fetch product facets:", error);
    return {
      priceRange: { minPrice: 0, maxPrice: 10000 },
      sizes: [],
      colors: [],
      tags: [],
    };
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 8): Promise<IProduct[]> {
  const result = await getProducts({ featured: true, limit });
  return result.data;
}

/**
 * Get new arrival products
 */
export async function getNewArrivals(limit = 8): Promise<IProduct[]> {
  const result = await getProducts({ isNew: true, limit });
  return result.data;
}

/**
 * Get related products
 */
export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<IProduct[]> {
  try {
    await connectDB();

    const products = await Product.find({
      _id: { $ne: productId },
      isActive: true,
    })
      .populate("category", "name slug")
      .sort({ soldCount: -1 })
      .limit(limit)
      .lean();

    return products.map((p) => ({
      ...p,
      _id: p._id.toString(),
    })) as unknown as IProduct[];
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}
