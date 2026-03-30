import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Product, Category } from "@/lib/db/models";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 100); // Max 100 items
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const categories = searchParams.getAll("categories"); // Multiple categories support
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sizes = searchParams.getAll("sizes");
    const colors = searchParams.getAll("colors");
    const tags = searchParams.getAll("tags");
    const sortBy = searchParams.get("sortBy") || "newest";
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const isNew = searchParams.get("new");
    const onSale = searchParams.get("sale");
    const minRating = searchParams.get("minRating");
    const inStock = searchParams.get("inStock");
    const brand = searchParams.get("brand");
    const brands = searchParams.getAll("brands");

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    const andConditions: Record<string, unknown>[] = [];

    // Category filtering - single or multiple
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    } else if (categories.length > 0) {
      const categoryDocs = await Category.find({ slug: { $in: categories } });
      if (categoryDocs.length > 0) {
        query.category = { $in: categoryDocs.map((c) => c._id) };
      }
    }

    // Subcategory filtering
    if (subcategory) {
      const subcategoryDoc = await Category.findOne({ slug: subcategory });
      if (subcategoryDoc) {
        query.subcategory = subcategoryDoc._id;
      }
    }

    // Price range filtering - handles both salePrice and basePrice
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, unknown> = {};
      if (minPrice) priceFilter.$gte = parseInt(minPrice);
      if (maxPrice) priceFilter.$lte = parseInt(maxPrice);

      andConditions.push({
        $or: [
          { salePrice: priceFilter },
          {
            salePrice: { $exists: false },
            basePrice: priceFilter,
          },
          {
            salePrice: null,
            basePrice: priceFilter,
          },
        ],
      });
    }

    // Size filtering
    if (sizes.length > 0) {
      query["variants.size"] = { $in: sizes };
    }

    // Color filtering (case-insensitive)
    if (colors.length > 0) {
      query["variants.color"] = { $in: colors.map((c) => new RegExp(`^${c}$`, "i")) };
    }

    // Tags filtering
    if (tags.length > 0) {
      query.tags = { $in: tags.map((t) => new RegExp(t, "i")) };
    }

    // Featured products
    if (featured === "true") {
      query.isFeatured = true;
    }

    // New arrivals
    if (isNew === "true") {
      query.isNew = true;
    }

    // On sale products (has salePrice lower than basePrice)
    if (onSale === "true") {
      andConditions.push({
        salePrice: { $exists: true, $ne: null },
        $expr: { $lt: ["$salePrice", "$basePrice"] },
      });
    }

    // Minimum rating filter
    if (minRating) {
      query["ratings.average"] = { $gte: parseFloat(minRating) };
    }

    // In-stock filter
    if (inStock === "true") {
      query["variants.stock"] = { $gt: 0 };
    }

    // Brand filtering (single or multiple)
    if (brand) {
      query.brand = new RegExp(`^${brand}$`, "i");
    } else if (brands.length > 0) {
      query.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, "i")) };
    }

    // Text search - with fallback to regex search
    if (search) {
      const searchRegex = new RegExp(search.split(/\s+/).join("|"), "i");
      andConditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { tags: searchRegex },
          { "variants.color": searchRegex },
        ],
      });
    }

    // Combine all AND conditions
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
        sort = { "ratings.average": -1, "ratings.count": -1 };
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
      case "newest":
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Execute query with aggregation for faceted results
    const [products, total, facets] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      // Get facets for filters (available sizes, colors, price range)
      Product.aggregate([
        { $match: { isActive: true } },
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
              {
                $group: {
                  _id: "$variants.color",
                  colorCode: { $first: "$variants.colorCode" },
                },
              },
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
      ]),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Process facets
    const processedFacets = facets[0]
      ? {
          priceRange: facets[0].priceRange[0] || { minPrice: 0, maxPrice: 10000 },
          sizes: facets[0].sizes.map((s: { _id: string }) => s._id).filter(Boolean),
          colors: facets[0].colors
            .filter((c: { _id: string }) => c._id)
            .map((c: { _id: string; colorCode?: string }) => ({
              name: c._id,
              code: c.colorCode || "#000000",
            })),
          tags: facets[0].tags.map((t: { _id: string }) => t._id).filter(Boolean),
        }
      : null;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      facets: processedFacets,
      query: {
        category,
        subcategory,
        search,
        sortBy,
        filters: {
          minPrice,
          maxPrice,
          sizes,
          colors,
          tags,
          featured,
          isNew,
          onSale,
          minRating,
          inStock,
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
